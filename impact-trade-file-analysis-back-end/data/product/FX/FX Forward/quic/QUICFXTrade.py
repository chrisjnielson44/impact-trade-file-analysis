# Simulating QUIC FX trade generation and PFE calculations

import yfinance as yf
import pandas as pd
import numpy as np
from faker import Faker
from random import randint, choice, uniform
from datetime import datetime, timedelta
from scipy.stats import norm
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Float, Date, Time, Boolean

# Initialize Faker
fake = Faker()

# Generate a list of trader IDs and companies
trader_ids = [fake.random_number(digits=5) for _ in range(100)]  # 100 unique trader IDs
counterparty_ids = [fake.random_number(digits=5) for _ in range(50)]  # 50 unique counterparty IDs

# Define the list of currency pairs
currency_pairs = ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'USD/CAD', 'AUD/USD', 'NZD/USD']


# Function to download historical FX rates using yfinance
def get_historical_fx_rates(currency_pairs, start_date, end_date):
    fx_data = {}
    for pair in currency_pairs:
        ticker = f"{pair[:3]}{pair[4:]}=X"  # yfinance ticker format for FX pairs
        data = yf.download(ticker, start=start_date, end=end_date)
        if not data.empty:
            fx_data[pair] = data['Close']  # Save the 'Close' prices (which are the spot rates)
    return pd.DataFrame(fx_data)


# Fetch historical spot rates for the past year
fx_rates = get_historical_fx_rates(currency_pairs, '2023-01-01', '2023-12-31')


# Calculate daily returns and volatilities
def calculate_volatility(fx_data):
    returns = fx_data.pct_change().dropna()
    volatilities = returns.std() * np.sqrt(252)  # Annualized volatility
    volatilities = volatilities.replace(0, 1e-6)  # Replace zero volatilities with a small number
    return volatilities, returns.corr()


def get_real_spot_rate(currency_pair, trading_date):
    trading_date_str = trading_date.strftime('%Y-%m-%d')
    if currency_pair in fx_rates.columns and trading_date_str in fx_rates.index:
        rate = fx_rates.loc[trading_date_str, currency_pair]
        if rate == 0 or pd.isna(rate):
            return None
        return rate
    return None


def generate_quic_transaction():
    currency_pair = choice(currency_pairs)
    buy_currency, sell_currency = currency_pair.split('/')
    buy_sell_indicator = choice(['Buy', 'Sell'])
    quantity = randint(1, 10000) * 10000

    trading_date = fake.date_between(start_date='-1y', end_date='today')
    spot_rate = get_real_spot_rate(currency_pair, pd.to_datetime(trading_date))

    if spot_rate is None:
        spot_rate = round(uniform(1.0, 1.5), 4)  # Fallback spot rate

    forward_rate = round(spot_rate * uniform(0.99, 1.01), 4)

    collateral_factor = round(uniform(0, 0.1) * quantity, 2)  # Random collateral factor

    return {
        'TransactionID': fake.unique.random_number(digits=8),
        'QUICID': fake.unique.random_number(digits=15),
        'TradingDate': trading_date,
        'MaturityDate': fake.date_between(start_date='today', end_date='+1y'),
        'BuyCurrency': buy_currency,
        'SellCurrency': sell_currency,
        'SpotRate': spot_rate,
        'ForwardRate': forward_rate,
        'BuyNotional': round(quantity, 2),
        'SellNotional': round(quantity * spot_rate, 2),
        'CounterpartyID': choice(counterparty_ids),
        'CollateralFactor': collateral_factor
    }


def generate_quic_transactions(n):
    return [generate_quic_transaction() for _ in range(n)]


# Generate 100,000 QUIC transactions
quic_data = generate_quic_transactions(100000)
quic_fx_trades = pd.DataFrame(quic_data)


# Create an exposure vector for a trade
def create_exposure_vector(buy_currency, sell_currency, buy_notional, sell_notional, volatilities_usd):
    currency_pairs = list(volatilities_usd.index)
    exposures = np.zeros(len(currency_pairs))

    for i, pair in enumerate(currency_pairs):
        base, quote = pair.split('/')

        if buy_currency == base and sell_currency == quote:
            exposures[i] += buy_notional
        elif sell_currency == base and buy_currency == quote:
            exposures[i] -= sell_notional
        elif buy_currency == base:
            exposures[i] += buy_notional
        elif sell_currency == base:
            exposures[i] -= sell_notional
        elif buy_currency == quote:
            exposures[i] -= buy_notional
        elif sell_currency == quote:
            exposures[i] += sell_notional

    return exposures


# QUIC PFE calculation
def calculate_quic_pfe(exposures, days, cov_matrix, confidence_level=0.99, collateral_factor=0):
    exposures_vector = np.array(exposures)
    if np.all(exposures_vector == 0):
        return 0.0, 0.0

    # QUIC uses a different time scaling factor
    quic_time_factor = np.sqrt(days / 365)  # Square root of time instead of linear scaling
    cov_matrix_adjusted = cov_matrix * quic_time_factor

    variance = exposures_vector.T @ cov_matrix_adjusted @ exposures_vector
    if variance <= 0:
        return 0.0, 0.0

    stddev = np.sqrt(variance)
    z_score = norm.ppf(confidence_level)

    # QUIC adds an additional factor to the PFE calculation
    quic_factor = 1.1  # 10% increase in PFE for demonstration purposes
    pfe = stddev * z_score * quic_factor

    # QUIC uses a different collateralization approach
    collateralized_pfe = max(0, pfe - collateral_factor * 1.2)  # 20% more effective collateral

    return pfe, collateralized_pfe


# Calculate volatilities and correlation matrix
volatilities, correlation_matrix = calculate_volatility(fx_rates)

# Calculate covariance matrix
volatility_vector = volatilities.values
cov_matrix = np.dot(volatility_vector[:, None], volatility_vector[None, :]) * correlation_matrix.values

# Time grid for PFE calculation (up to 30 days)
time_grid = range(1, 31)

# Calculate QUIC PFE for each trade
quic_pfe_results = []
for idx, row in quic_fx_trades.iterrows():
    exposures = create_exposure_vector(row['BuyCurrency'], row['SellCurrency'], row['BuyNotional'], row['SellNotional'],
                                       volatilities)

    for days in time_grid:
        uncollateralized_pfe, collateralized_pfe = calculate_quic_pfe(
            exposures, days, cov_matrix, confidence_level=0.99, collateral_factor=row['CollateralFactor']
        )

        quic_pfe_results.append({
            'TransactionID': row['TransactionID'],
            'QUICID': row['QUICID'],
            'CounterpartyID': row['CounterpartyID'],
            'BuyCurrency': row['BuyCurrency'],
            'SellCurrency': row['SellCurrency'],
            'MaturityDate': row['MaturityDate'],
            'Days': days,
            'Uncollateralized_PFE': uncollateralized_pfe,
            'Collateralized_PFE': collateralized_pfe
        })

quic_pfe_results_df = pd.DataFrame(quic_pfe_results)

# Database connection
DATABASE_URL = 'postgresql://postgres.zqaxkfktdokwxesuwrxi:II5VKbenfHMS0keR@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
engine = create_engine(DATABASE_URL)

# Define the metadata and table schema for QUIC FX trades and PFE results
metadata = MetaData()

quic_fx_trades_table = Table(
    'quic_fx_trades', metadata,
    Column('TransactionID', Integer, primary_key=True),
    Column('QUICID', String(15)),
    Column('TradingDate', Date),
    Column('MaturityDate', Date),
    Column('BuyCurrency', String(3)),
    Column('SellCurrency', String(3)),
    Column('SpotRate', Float),
    Column('ForwardRate', Float),
    Column('BuyNotional', Float),
    Column('SellNotional', Float),
    Column('CounterpartyID', Integer),
    Column('CollateralFactor', Float)
)

quic_pfe_results_table = Table(
    'quic_pfe_results', metadata,
    Column('id', Integer, primary_key=True),
    Column('TransactionID', Integer),
    Column('QUICID', String(15)),
    Column('CounterpartyID', Integer),
    Column('BuyCurrency', String(3)),
    Column('SellCurrency', String(3)),
    Column('MaturityDate', Date),
    Column('Days', Integer),
    Column('Uncollateralized_PFE', Float),
    Column('Collateralized_PFE', Float)
)

# Create tables and insert data
metadata.create_all(engine)
with engine.connect() as conn:
    quic_fx_trades.to_sql('quic_fx_trades', conn, if_exists='replace', index=False)
    quic_pfe_results_df.to_sql('quic_pfe_results', conn, if_exists='replace', index=False)

print("QUIC FX trades and PFE results have been successfully stored in the database.")