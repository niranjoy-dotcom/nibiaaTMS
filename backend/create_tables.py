from sqlalchemy import create_engine
from app.database import SQLALCHEMY_DATABASE_URL
from app.models import Base

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def create_tables():
    # This will create all tables that don't exist yet
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully")

if __name__ == "__main__":
    create_tables()
