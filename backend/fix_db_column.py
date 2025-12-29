import sqlite3
import os

# Define the path to the database
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "nibiaa_manager.db")

print(f"Checking database at: {DB_PATH}")

try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get list of columns in zoho_tenants
    cursor.execute("PRAGMA table_info(zoho_tenants)")
    columns = [info[1] for info in cursor.fetchall()]
    
    print(f"Current columns: {columns}")

    if "is_provisioned" not in columns:
        print("Adding 'is_provisioned' column...")
        cursor.execute("ALTER TABLE zoho_tenants ADD COLUMN is_provisioned BOOLEAN DEFAULT 0")
        conn.commit()
        print("Column added successfully.")
    else:
        print("'is_provisioned' column already exists.")

    conn.close()

except Exception as e:
    print(f"Error: {e}")
