from app.database import SessionLocal, engine
from sqlalchemy import text

def add_column():
    db = SessionLocal()
    try:
        # Check if column exists
        result = db.execute(text("PRAGMA table_info(projects)"))
        columns = [row[1] for row in result]
        
        if "customer_email" not in columns:
            print("Adding customer_email column to projects table...")
            db.execute(text("ALTER TABLE projects ADD COLUMN customer_email VARCHAR"))
            db.commit()
            print("Column added successfully.")
        else:
            print("Column customer_email already exists.")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_column()
