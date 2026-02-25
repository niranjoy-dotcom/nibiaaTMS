import uvicorn
import sys
import os
from dotenv import load_dotenv

# Add current directory to sys.path to ensure imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

def create_user(db, email, password, role):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        hashed_password = get_password_hash(password)
        new_user = User(email=email, hashed_password=hashed_password, role=role, is_active=True)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    else:
        pass

def init_users():
    print("Do you want to load dummy users? (y/n)")
    choice = input().strip().lower()
    # choice = 'n'
    
    db = SessionLocal()
    try:
        # Always ensure Admin exists from .env
        admin_email = os.getenv("ADMIN_EMAIL")
        admin_password = os.getenv("ADMIN_PASSWORD")
        
        if admin_email and admin_password:
            create_user(db, admin_email, admin_password, "admin")
        else:
            print("Warning: ADMIN_EMAIL or ADMIN_PASSWORD not set in .env. Admin user not created.")
        
        if choice == 'y':
            create_user(db, "support@nibiaa.com", "Nibiaa@12", "admin")
            create_user(db, "technical@nibiaa.com", "technical12", "technical_manager")
            create_user(db, "maneger@nibiaa.com", "maneger12", "project_manager")
        else:
            pass
            
    except Exception as e:
        print(f"Error creating users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_users()
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=True)
