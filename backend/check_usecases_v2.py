from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Usecase

DATABASE_URL = "sqlite:///nibiaa_manager.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def check_usecases():
    usecases = db.query(Usecase).all()
    print(f"Found {len(usecases)} usecases.")
    for uc in usecases:
        print(f"Name: {uc.name}, Prefix: '{uc.zoho_prefix}'")

if __name__ == "__main__":
    check_usecases()
