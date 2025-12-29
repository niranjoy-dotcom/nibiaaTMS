from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Usecase
import os

DATABASE_URL = "sqlite:///nibiaa_manager.db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Update existing usecases with prefixes
updates = {
    "Workforce Monitoring System": "WTS",
    "Equipment Monitoring": "ETS",
    "Workforce Management System": "WMS", # Keeping old one just in case
    "Equipment Tracking System": "ETS"    # Keeping old one just in case
}

for name, prefix in updates.items():
    usecase = db.query(Usecase).filter(Usecase.name == name).first()
    if usecase:
        usecase.zoho_prefix = prefix
        print(f"Updated {name} with prefix {prefix}")
    else:
        # Create if not exists (for the new ones requested)
        if name in ["Workforce Monitoring System", "Equipment Monitoring"]:
             print(f"Creating new usecase: {name} with prefix {prefix}")
             db.add(Usecase(name=name, zoho_prefix=prefix))

db.commit()
db.close()
