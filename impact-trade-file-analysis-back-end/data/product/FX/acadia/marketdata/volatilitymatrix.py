import numpy as np
import pandas as pd
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, Float, String
from faker import Faker

# Initialize Faker
fake = Faker()

# Define the currencies
currencies = ['EUR', 'JPY', 'GBP', 'CHF', 'CAD', 'AUD', 'NZD']

# Function to generate random volatilities
def generate_random_volatilities(currencies):
    return {currency: round(fake.pyfloat(right_digits=2, positive=True, min_value=0.1, max_value=0.3), 2) for currency in currencies}

# Function to generate a random correlation matrix
def generate_random_correlation_matrix(size):
    matrix = np.random.uniform(low=0.1, high=1.0, size=(size, size))
    np.fill_diagonal(matrix, 1.0)
    return (matrix + matrix.T) / 2  # Make the matrix symmetric

# Generate random volatilities and correlation matrix
volatilities = generate_random_volatilities(currencies)
correlation_matrix = generate_random_correlation_matrix(len(currencies))

# Convert the correlation matrix to a DataFrame for easier handling
correlation_df = pd.DataFrame(correlation_matrix, index=currencies, columns=currencies)

# Database connection
DATABASE_URL = 'postgresql://postgres.zqaxkfktdokwxesuwrxi:II5VKbenfHMS0keR@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
engine = create_engine(DATABASE_URL)
metadata = MetaData()

# Define the table schema
volatility_table = Table('volatility_matrix', metadata,
    Column('Currency', String(3), primary_key=True),
    Column('Volatility', Float)
)

correlation_table = Table('correlation_matrix', metadata,
    Column('Currency1', String(3), primary_key=True),
    Column('Currency2', String(3), primary_key=True),
    Column('Correlation', Float)
)

# Create the tables in the database
metadata.create_all(engine)

# Upload volatilities to the database
volatility_df = pd.DataFrame(list(volatilities.items()), columns=['Currency', 'Volatility'])
volatility_df.to_sql('volatility_matrix', engine, if_exists='append', index=False, method='multi')

# Prepare correlation data for upload
correlation_data = []
for i, currency1 in enumerate(currencies):
    for j, currency2 in enumerate(currencies):
        correlation_data.append({'Currency1': currency1, 'Currency2': currency2, 'Correlation': correlation_matrix[i, j]})

correlation_df = pd.DataFrame(correlation_data)
correlation_df.to_sql('correlation_matrix', engine, if_exists='append', index=False, method='multi')