from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import SQLALCHEMY_DATABASE_URL
from app import models, thingsboard
import requests
import os
from dotenv import load_dotenv

load_dotenv(override=True)

# Setup DB
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Setup TB
BASE_URL = os.getenv("TB_BASE_URL", "https://dev.nibiaa.com")
ADMIN_USERNAME = os.getenv("TB_USERNAME", "admin@nibiaa.com")
ADMIN_PASSWORD = os.getenv("TB_PASSWORD", "122333")

def get_tb_token():
    data = thingsboard.tb_login(ADMIN_USERNAME, ADMIN_PASSWORD)
    if data:
        return data['token']
    return None

def update_projects():
    token = get_tb_token()
    if not token:
        print("Failed to login to ThingsBoard")
        return

    projects = db.query(models.Project).all()
    tenants = thingsboard.list_tenants(token)
    profiles = thingsboard.get_tenant_profiles(token)
    
    tenant_map = {t['id']['id']: t for t in tenants}
    profile_map = {p['id']['id']: p['name'] for p in profiles}

    for project in projects:
        if project.tenant_id in tenant_map:
            tenant = tenant_map[project.tenant_id]
            
            # Update Usecase
            if 'additionalInfo' in tenant and 'useCase' in tenant['additionalInfo']:
                project.usecase = tenant['additionalInfo']['useCase']
                print(f"Updated usecase for project {project.name}")
            
            # Update Plan (Profile Name)
            if 'tenantProfileId' in tenant:
                profile_id = tenant['tenantProfileId']['id']
                if profile_id in profile_map:
                    project.plan = profile_map[profile_id]
                    print(f"Updated plan for project {project.name}")
        else:
            print(f"Tenant not found for project {project.name}")

    db.commit()
    print("Update complete")

if __name__ == "__main__":
    update_projects()
