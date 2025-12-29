import os
from sqlalchemy import create_engine, inspect

# Get absolute path of the DB file
db_path = os.path.abspath("nibiaa_manager.db")
print(f"Checking database at: {db_path}")

if not os.path.exists(db_path):
    print("ERROR: Database file not found!")
    exit(1)

DATABASE_URL = f"sqlite:///{db_path}"
engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

print("\nTables found:")
tables = inspector.get_table_names()
for table in tables:
    print(f"- {table}")

required_tables = ["zoho_tenants", "zoho_customers"]
missing = [t for t in required_tables if t not in tables]

if missing:
    print(f"\nMISSING TABLES: {missing}")
else:
    print("\nAll Zoho tables are present.")
