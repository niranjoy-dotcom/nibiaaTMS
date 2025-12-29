import sqlite3
import os

db_path = "nibiaa_manager.db"
if not os.path.exists(db_path):
    print(f"DB {db_path} not found")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Tables:")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
for table in tables:
    print(f" - {table[0]}")

print("\nColumns in 'projects':")
try:
    cursor.execute("PRAGMA table_info(projects);")
    columns = cursor.fetchall()
    for col in columns:
        print(f" - {col[1]} ({col[2]})")
except Exception as e:
    print(f"Error: {e}")

print("\nColumns in 'zoho_tenants':")
try:
    cursor.execute("PRAGMA table_info(zoho_tenants);")
    columns = cursor.fetchall()
    if not columns:
        print(" - Table not found")
    for col in columns:
        print(f" - {col[1]} ({col[2]})")
except Exception as e:
    print(f"Error: {e}")

conn.close()
