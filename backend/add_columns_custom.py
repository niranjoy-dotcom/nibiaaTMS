import sys
import os
from sqlalchemy import text, inspect

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine

def add_column_if_not_exists(engine, table_name, column_name, column_type):
    try:
        # Use simple separate connection for inspection to avoid transaction issues
        inspector = inspect(engine)
        columns = [c['name'] for c in inspector.get_columns(table_name)]
        
        if column_name in columns:
            print(f"Column '{column_name}' already exists in '{table_name}'.")
            return
            
        print(f"Column '{column_name}' not found. Adding it...")
        # Use a new connection for the update
        with engine.connect() as conn:
            # Explicitly begin transaction
            with conn.begin():
                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))
            print(f"Successfully added '{column_name}'.")
            
    except Exception as e:
        print(f"Error processing '{column_name}': {e}")

if __name__ == "__main__":
    print("Starting Widget table migration...")
    try:
        add_column_if_not_exists(engine, "widgets", "height", "VARCHAR DEFAULT '1'")
        add_column_if_not_exists(engine, "widgets", "icon", "VARCHAR")
        print("Migration complete.")
    except Exception as e:
        print(f"Migration script failed: {e}")
