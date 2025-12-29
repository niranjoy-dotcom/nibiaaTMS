import sqlite3

# Connect to the database
conn = sqlite3.connect('nibiaa_manager.db')
cursor = conn.cursor()

# Add the column
try:
    cursor.execute("ALTER TABLE task_templates ADD COLUMN criticality VARCHAR DEFAULT 'Medium'")
    print("Column 'criticality' added successfully.")
except sqlite3.OperationalError as e:
    print(f"Error: {e}")

conn.commit()
conn.close()
