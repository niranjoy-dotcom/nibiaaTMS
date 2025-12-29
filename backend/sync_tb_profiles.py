import requests
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import ThingsboardProfile
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = "sqlite:///nibiaa_manager.db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

TB_BASE_URL = os.getenv("TB_BASE_URL")
TB_USERNAME = os.getenv("TB_USERNAME")
TB_PASSWORD = os.getenv("TB_PASSWORD")

def get_tb_token():
    url = f"{TB_BASE_URL}/api/auth/login"
    response = requests.post(url, json={"username": TB_USERNAME, "password": TB_PASSWORD})
    if response.status_code == 200:
        return response.json()["token"]
    else:
        print(f"Failed to login to Thingsboard: {response.text}")
        return None

def sync_profiles():
    token = get_tb_token()
    if not token:
        return

    headers = {"Authorization": f"Bearer {token}"}
    url = f"{TB_BASE_URL}/api/tenantProfiles?pageSize=100&page=0"
    
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to fetch profiles: {response.text}")
        return

    profiles = response.json().get("data", [])
    print(f"Found {len(profiles)} profiles in Thingsboard.")

    for p in profiles:
        profile_id = p["id"]["id"]
        name = p["name"]
        description = p.get("description")
        is_default = p.get("default", False)

        # Check if exists
        db_profile = db.query(ThingsboardProfile).filter(ThingsboardProfile.tb_profile_id == profile_id).first()
        
        if db_profile:
            print(f"Updating profile: {name}")
            db_profile.name = name
            db_profile.description = description
            db_profile.is_default = is_default
        else:
            print(f"Creating profile: {name}")
            new_profile = ThingsboardProfile(
                tb_profile_id=profile_id,
                name=name,
                description=description,
                is_default=is_default
            )
            db.add(new_profile)
    
    db.commit()
    print("Sync complete.")
    db.close()

if __name__ == "__main__":
    sync_profiles()
