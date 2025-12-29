from sqlalchemy import create_engine, inspect
import os

DATABASE_URL = "sqlite:///nibiaa_manager.db"

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

print("Tables in database:")
for table_name in inspector.get_table_names():
    print(f"- {table_name}")

print("\nColumns in 'zoho_tenants':")
if 'zoho_tenants' in inspector.get_table_names():
    for column in inspector.get_columns('zoho_tenants'):
        print(f"- {column['name']} ({column['type']})")
else:
    print("Table 'zoho_tenants' does not exist.")

print("\nColumns in 'zoho_customers':")
if 'zoho_customers' in inspector.get_table_names():
    for column in inspector.get_columns('zoho_customers'):
        print(f"- {column['name']} ({column['type']})")
else:
    print("Table 'zoho_customers' does not exist.")
