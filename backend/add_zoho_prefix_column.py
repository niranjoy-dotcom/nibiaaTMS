from sqlalchemy import create_engine, text
import os

DATABASE_URL = "sqlite:///nibiaa_manager.db"

engine = create_engine(DATABASE_URL)

with engine.connect() as connection:
    try:
        connection.execute(text("ALTER TABLE usecases ADD COLUMN zoho_prefix VARCHAR"))
        print("Added 'zoho_prefix' column to 'usecases' table.")
    except Exception as e:
        print(f"Error adding column (it might already exist): {e}")

