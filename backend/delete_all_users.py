from app.database import SessionLocal
from app.models import User

def delete_all_users():
    db = SessionLocal()
    try:
        num_deleted = db.query(User).delete()
        db.commit()
        print(f"Deleted {num_deleted} users. Database is now empty.")
    except Exception as e:
        print(f"Error deleting users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    delete_all_users()
