import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import PlanProfileMapping, ThingsboardProfile

DATABASE_URL = "sqlite:///nibiaa_manager.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def list_mappings():
    mappings = db.query(PlanProfileMapping).all()
    print(f"{'ID':<5} {'Zoho Keyword':<20} {'TB Profile Name':<20}")
    print("-" * 50)
    for m in mappings:
        print(f"{m.id:<5} {m.zoho_plan_keyword:<20} {m.tb_profile_name:<20}")

def add_mapping(keyword, profile_name):
    # Validate profile exists
    profile = db.query(ThingsboardProfile).filter(ThingsboardProfile.name == profile_name).first()
    if not profile:
        print(f"Error: Thingsboard Profile '{profile_name}' not found.")
        return

    # Check if mapping exists
    existing = db.query(PlanProfileMapping).filter(PlanProfileMapping.zoho_plan_keyword == keyword).first()
    if existing:
        print(f"Updating existing mapping for '{keyword}' to '{profile_name}'")
        existing.tb_profile_name = profile_name
    else:
        print(f"Adding new mapping: '{keyword}' -> '{profile_name}'")
        new_mapping = PlanProfileMapping(zoho_plan_keyword=keyword, tb_profile_name=profile_name)
        db.add(new_mapping)
    
    db.commit()
    print("Mapping saved.")

def delete_mapping(keyword):
    mapping = db.query(PlanProfileMapping).filter(PlanProfileMapping.zoho_plan_keyword == keyword).first()
    if mapping:
        db.delete(mapping)
        db.commit()
        print(f"Mapping for '{keyword}' deleted.")
    else:
        print(f"Mapping for '{keyword}' not found.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python manage_mappings.py list")
        print("  python manage_mappings.py add <keyword> <profile_name>")
        print("  python manage_mappings.py delete <keyword>")
        sys.exit(1)

    command = sys.argv[1]

    if command == "list":
        list_mappings()
    elif command == "add":
        if len(sys.argv) != 4:
            print("Usage: python manage_mappings.py add <keyword> <profile_name>")
        else:
            add_mapping(sys.argv[2], sys.argv[3])
    elif command == "delete":
        if len(sys.argv) != 3:
            print("Usage: python manage_mappings.py delete <keyword>")
        else:
            delete_mapping(sys.argv[2])
    else:
        print(f"Unknown command: {command}")
    
    db.close()
