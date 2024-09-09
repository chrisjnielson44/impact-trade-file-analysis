from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from statsmodels.tsa.arima.model import ARIMA
import sqlalchemy
import matplotlib.pyplot as plt
import base64
from io import BytesIO
from sklearn.model_selection import train_test_split

from datetime import datetime

app = Flask(__name__)

# Database connection (replace with your actual database URL)
DATABASE_URL = 'postgresql://postgres.zqaxkfktdokwxesuwrxi:II5VKbenfHMS0keR@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
engine = sqlalchemy.create_engine(DATABASE_URL)


def get_pfe_data(engine_type, counterparty_id=None, transaction_id=None):
    query = f"""
    SELECT p.*, t."TradingDate", t."SpotRate", t."ForwardRate", t."BuyNotional", t."SellNotional"
    FROM {engine_type}_pfe_results p
    JOIN {engine_type}_fx_trades t ON p."TransactionID" = t."TransactionID"
    """

    if counterparty_id is not None:
        query += f' WHERE p."CounterpartyID" = {counterparty_id}'
        if transaction_id is not None:
            query += f' AND p."TransactionID" = {transaction_id}'

    df = pd.read_sql(query, engine)
    df['TradingDate'] = pd.to_datetime(df['TradingDate'])
    df['MaturityDate'] = pd.to_datetime(df['MaturityDate'])
    return df


def analyze_pfe_factors(df, target):
    df['TimeToMaturity'] = (df['MaturityDate'] - df['TradingDate']).dt.days
    df['CurrencyPair'] = df['BuyCurrency'] + '/' + df['SellCurrency']

    currency_pair_impact = df.groupby('CurrencyPair')[target].mean().sort_values(ascending=False)

    df['MaturityBucket'] = pd.cut(df['TimeToMaturity'], bins=[0, 30, 90, 180, 365, np.inf],
                                  labels=['0-30 days', '31-90 days', '91-180 days', '181-365 days', '365+ days'])
    maturity_impact = df.groupby('MaturityBucket')[target].mean().sort_values(ascending=False)

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 12))

    currency_pair_impact.plot(kind='bar', ax=ax1)
    ax1.set_title(f'Average {target} by Currency Pair')
    ax1.set_xlabel('Currency Pair')
    ax1.set_ylabel(f'Average {target}')
    ax1.tick_params(axis='x', rotation=45)

    maturity_impact.plot(kind='bar', ax=ax2)
    ax2.set_title(f'Average {target} by Maturity')
    ax2.set_xlabel('Maturity Bucket')
    ax2.set_ylabel(f'Average {target}')
    ax2.tick_params(axis='x', rotation=45)

    plt.tight_layout()

    buffer = BytesIO()
    plt.savefig(buffer, format='png', dpi=300)
    buffer.seek(0)
    plot_data = base64.b64encode(buffer.getvalue()).decode()
    plt.close()

    return {
        'currency_pair_impact': currency_pair_impact.to_dict(),
        'maturity_impact': maturity_impact.to_dict(),
        # 'impact_plot': plot_data
    }


@app.route('/analyze_pfe', methods=['POST'])
def analyze_pfe():
    data = request.json
    engine_type = data['engine'].lower()  # 'quic' or 'f22'
    counterparty_id = data.get('counterparty_id')
    transaction_id = data.get('transaction_id')

    if counterparty_id is not None:
        counterparty_id = int(counterparty_id)
    if transaction_id is not None:
        transaction_id = int(transaction_id)

    df = get_pfe_data(engine_type, counterparty_id, transaction_id)

    if df.empty:
        return jsonify({'error': 'No data found for the given parameters'}), 404

    targets = ['Uncollateralized_PFE', 'Collateralized_PFE']
    results = {}

    for target in targets:
        results[target] = analyze_pfe_factors(df, target)

    # Add summary statistics
    results['summary'] = {
        'total_trades': len(df),
        'unique_counterparties': df['CounterpartyID'].nunique(),
        'unique_currency_pairs': df['CurrencyPair'].nunique(),
        'date_range': [df['TradingDate'].min().strftime('%Y-%m-%d'),
                       df['TradingDate'].max().strftime('%Y-%m-%d')]
    }

    return jsonify(results)


if __name__ == '__main__':
    app.run(debug=True)