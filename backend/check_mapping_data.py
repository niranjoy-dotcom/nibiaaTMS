from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models import ZohoTenant, ThingsboardProfile, PlanProfileMapping

DATABASE_URL = "sqlite:///nibiaa_manager.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def check_data():
    print("--- Zoho Tenants (Plans) ---")
    tenants = db.query(ZohoTenant).all()
    plans = set()
    for t in tenants:
        plans.add((t.plan_name, t.plan_code))
    
    if not plans:
        print("No Zoho Tenants found.")
    else:
        for name, code in plans:
            print(f"Plan Name: {name}, Plan Code: {code}")

    print("\n--- Thingsboard Profiles ---")
    profiles = db.query(ThingsboardProfile).all()
    if not profiles:
        print("No Thingsboard Profiles found.")
    else:
        for p in profiles:
            print(f"Profile Name: {p.name}, ID: {p.tb_profile_id}, Default: {p.is_default}")

    print("\n--- Existing Mappings ---")
    mappings = db.query(PlanProfileMapping).all()
    if not mappings:
        print("No mappings found.")
    else:
        for m in mappings:
            print(f"Keyword: {m.zoho_plan_keyword} -> TB Profile: {m.tb_profile_name}")

    db.close()

if __name__ == "__main__":
    check_data()
