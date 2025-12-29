from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Usecase
import os

DATABASE_URL = "sqlite:///nibiaa_manager.db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Add missing usecases
required_usecases = ["Workforce Management System", "Equipment Tracking System"]
for name in required_usecases:
    exists = db.query(Usecase).filter(Usecase.name == name).first()
    if not exists:
        print(f"Adding usecase: {name}")
        db.add(Usecase(name=name))
    else:
        print(f"Usecase already exists: {name}")

db.commit()
db.close()
