from faker import Faker
import pandas as pd
from random import randint, choice, uniform
from datetime import datetime, timedelta
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Float, Date, Time

# Initialize Faker
fake = Faker()

# Generate a list of trader IDs and companies
trader_ids = [fake.random_number(digits=5) for _ in range(100)]  # 100 unique trader IDs
counterparty_ids = [fake.random_number(digits=5) for _ in range(50)]  # 100 unique counterparty IDs

# Define a list of currency pairs and corresponding spot rate range
currency_data = {
    'EUR/USD': {'spot_rate_range': (1.1, 1.2)},
    'USD/JPY': {'spot_rate_range': (105, 115)},
    'GBP/USD': {'spot_rate_range': (1.3, 1.4)},
    'USD/CHF': {'spot_rate_range': (0.9, 1.0)},
    'USD/CAD': {'spot_rate_range': (1.2, 1.3)},
    'AUD/USD': {'spot_rate_range': (0.7, 0.8)},
    'NZD/USD': {'spot_rate_range': (0.6, 0.7)},
}

# Define the structure of your transaction data
def generate_transaction():
    currency_pair = choice(list(currency_data.keys()))
    buy_currency, sell_currency = currency_pair.split('/')
    rate_data = currency_data[currency_pair]
    buy_sell_indicator = choice(['Buy', 'Sell'])
    quantity = randint(1, 10000) * 10000
    spot_rate = round(fake.pyfloat(right_digits=4, positive=True, min_value=rate_data['spot_rate_range'][0], max_value=rate_data['spot_rate_range'][1]), 4)  # generating a spot rate within the range
    # calculate a forward rate within 1% of the spot rate
    forward_rate = round(spot_rate * uniform(0.99, 1.01), 4)
    return {
        'TransactionID': fake.unique.random_number(digits=8),
        'QUICID': fake.unique.random_number(digits=15),
        'TradingDate': fake.date_between(start_date='-1y', end_date='today'),
        'MaturityDate': fake.date_between(start_date='today', end_date='+1y'),
        'ExecutionTime': (datetime.now()-timedelta(seconds=randint(1,86400))).strftime('%H:%M:%S'),
        'InstrumentID': fake.random_number(digits=12),
        'TraderID': choice(trader_ids),  # select a trader ID from the list
        'BuyCurrency': buy_currency,
        'SellCurrency': sell_currency,
        'SpotRate': spot_rate,
        'ForwardRate': forward_rate,
        'BuySellIndicator': buy_sell_indicator,
        'BuyNotional': round(quantity, 2),
        'SellNotional': round(quantity * spot_rate, 2),
        'CounterpartyID': choice(counterparty_ids)  # select a company from the list
    }

# Generate n transactions
def generate_transactions(n=100):
    return [generate_transaction() for _ in range(n)]

# Usage
data = generate_transactions(1000)  # generate 10,000 transactions
quic_fx_trades = pd.DataFrame(data)

DATABASE_URL = 'postgresql://postgres.zqaxkfktdokwxesuwrxi:II5VKbenfHMS0keR@aws-0-us-east-1.pooler.supabase.com:6543/postgres'

# Create the database engine
engine = create_engine(DATABASE_URL)

# Define the table schema with TransactionID as the primary key
metadata = MetaData()
f22_fx_trades_table = Table('f22_fx_trades', metadata,
    Column('TransactionID', Integer, primary_key=True),
    Column('QUICID', String(15)),
    Column('TradingDate', Date),
    Column('MaturityDate', Date),
    Column('ExecutionTime', Time),
    Column('InstrumentID', String(12)),
    Column('TraderID', Integer),
    Column('BuyCurrency', String(3)),
    Column('SellCurrency', String(3)),
    Column('SpotRate', Float),
    Column('ForwardRate', Float),
    Column('BuySellIndicator', String(4)),
    Column('BuyNotional', Float),
    Column('SellNotional', Float),
    Column('CounterpartyID', Integer)
)

# Create the table in the database
metadata.create_all(engine)

# Upload the DataFrame to the PostgreSQL database
quic_fx_trades.to_sql('quic_fx_trades', engine, if_exists='append', index=False, method='multi')