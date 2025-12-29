from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def add_columns():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE projects ADD COLUMN usecase VARCHAR"))
            print("Added usecase column")
        except Exception as e:
            print(f"Error adding usecase: {e}")

        try:
            conn.execute(text("ALTER TABLE projects ADD COLUMN plan VARCHAR"))
            print("Added plan column")
        except Exception as e:
            print(f"Error adding plan: {e}")

        try:
            conn.execute(text("ALTER TABLE projects ADD COLUMN completion_percentage INTEGER DEFAULT 0"))
            print("Added completion_percentage column")
        except Exception as e:
            print(f"Error adding completion_percentage: {e}")
        
        conn.commit()

if __name__ == "__main__":
    add_columns()
