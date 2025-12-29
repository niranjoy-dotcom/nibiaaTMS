import sqlite3
import os

db_path = os.path.abspath("nibiaa_manager.db")
print(f"Checking database at: {db_path}")

if not os.path.exists(db_path):
    print("ERROR: Database file does not exist!")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # List tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print("\nTables found:")
        for table in tables:
            print(f"- {table[0]}")
            
        # Check zoho_tenants specifically
        if ('zoho_tenants',) in tables:
            cursor.execute("SELECT count(*) FROM zoho_tenants")
            count = cursor.fetchone()[0]
            print(f"\nRow count in 'zoho_tenants': {count}")
        else:
            print("\nWARNING: 'zoho_tenants' table NOT found.")
            
        conn.close()
    except Exception as e:
        print(f"Error reading database: {e}")
