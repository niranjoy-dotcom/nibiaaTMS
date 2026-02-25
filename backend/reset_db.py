import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add the current directory to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import Base, SQLALCHEMY_DATABASE_URL
from app import models, auth as auth_utils

def reset_database():
    print(f"Connecting to database: {SQLALCHEMY_DATABASE_URL}")
    
    # Use the existing engine configuration
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    print("Dropping all tables...")
    try:
        # Drop all tables in the correct order (respecting foreign keys)
        Base.metadata.drop_all(bind=engine)
        print("Successfully dropped all tables.")
    except Exception as e:
        print(f"Error dropping tables: {e}")
        return

    print("Creating all tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Successfully created all tables.")
    except Exception as e:
        print(f"Error creating tables: {e}")
        return

    # Seed Initial Admin
    print("Seeding initial admin user...")
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        admin_email = os.getenv("ADMIN_EMAIL", "support@nibiaa.com")
        admin_password = os.getenv("ADMIN_PASSWORD", "Admin12")
        
        hashed_password = auth_utils.get_password_hash(admin_password)
        db_user = models.User(
            email=admin_email, 
            hashed_password=hashed_password, 
            role="admin",
            is_active=True
        )
        db.add(db_user)
        db.commit()
        print(f"Successfully seeded admin user: {admin_email}")
    except Exception as e:
        print(f"Error seeding admin: {e}")
        db.rollback()
    finally:
        db.close()

    print("\nDatabase reset complete!")

if __name__ == "__main__":
    # Ensure environment is loaded
    load_dotenv()
    reset_database()
