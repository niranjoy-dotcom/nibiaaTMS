from app.database import SessionLocal
from app.models import User

def delete_users_except_admin():
    db = SessionLocal()
    try:
        # Delete all users where email is NOT 'adminuser@nibiaa.com'
        num_deleted = db.query(User).filter(User.email != 'adminuser@nibiaa.com').delete(synchronize_session=False)
        db.commit()
        print(f"Deleted {num_deleted} users. 'adminuser@nibiaa.com' preserved.")
        
        # Verify remaining users
        remaining_users = db.query(User).all()
        print("Remaining users:")
        for user in remaining_users:
            print(f"- {user.email} (Role: {user.role})")
            
    except Exception as e:
        print(f"Error deleting users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    delete_users_except_admin()
