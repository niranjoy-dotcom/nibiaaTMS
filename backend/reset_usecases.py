from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Usecase
import os

DATABASE_URL = "sqlite:///nibiaa_manager.db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# 1. Delete all existing usecases
try:
    num_deleted = db.query(Usecase).delete()
    print(f"Deleted {num_deleted} existing usecases.")
    db.commit()
except Exception as e:
    print(f"Error deleting usecases: {e}")
    db.rollback()

# 2. Create the two required usecases
required_usecases = [
    {"name": "Equipment Tracking System", "zoho_prefix": "ETS"},
    {"name": "Workforce Management System", "zoho_prefix": "WMS"}
]

for uc_data in required_usecases:
    usecase = Usecase(name=uc_data["name"], zoho_prefix=uc_data["zoho_prefix"])
    db.add(usecase)
    print(f"Created usecase: {uc_data['name']} (Prefix: {uc_data['zoho_prefix']})")

db.commit()
db.close()
