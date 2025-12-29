from sqlalchemy import create_engine, inspect
from app.database import SQLALCHEMY_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
inspector = inspect(engine)
tables = inspector.get_table_names()
print("Tables in database:", tables)

if "zoho_tenants" in tables:
    print("SUCCESS: zoho_tenants table exists.")
    columns = [col['name'] for col in inspector.get_columns("zoho_tenants")]
    print("Columns:", columns)
else:
    print("FAILURE: zoho_tenants table does NOT exist.")
