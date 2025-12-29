import sqlite3

# Connect to the database
conn = sqlite3.connect('nibiaa_manager.db')
cursor = conn.cursor()

# Add the columns
try:
    cursor.execute("ALTER TABLE tasks ADD COLUMN started_at DATETIME")
    print("Column 'started_at' added successfully.")
except sqlite3.OperationalError as e:
    print(f"Error adding started_at: {e}")

try:
    cursor.execute("ALTER TABLE tasks ADD COLUMN completed_at DATETIME")
    print("Column 'completed_at' added successfully.")
except sqlite3.OperationalError as e:
    print(f"Error adding completed_at: {e}")

try:
    cursor.execute("ALTER TABLE tasks ADD COLUMN total_duration INTEGER DEFAULT 0")
    print("Column 'total_duration' added successfully.")
except sqlite3.OperationalError as e:
    print(f"Error adding total_duration: {e}")

conn.commit()
conn.close()
