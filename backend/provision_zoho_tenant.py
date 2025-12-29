import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import ZohoTenant, Usecase, PlanProfileMapping, ThingsboardProfile, User
from app import thingsboard
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = "sqlite:///nibiaa_manager.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def provision_tenant(subscription_id):
    print(f"Provisioning tenant for subscription: {subscription_id}")
    
    # 1. Fetch Zoho Tenant
    zoho_tenant = db.query(ZohoTenant).filter(ZohoTenant.subscription_id == subscription_id).first()
    if not zoho_tenant:
        print(f"Error: Zoho Tenant with subscription ID {subscription_id} not found.")
        return

    print(f"Found Zoho Tenant: {zoho_tenant.customer_name} (Plan: {zoho_tenant.plan_name}, Code: {zoho_tenant.plan_code})")

    # 2. Determine Use Case
    # Logic: Check if plan_code starts with any Usecase.zoho_prefix
    usecases = db.query(Usecase).all()
    selected_usecase = None
    
    if zoho_tenant.plan_code:
        for uc in usecases:
            if uc.zoho_prefix and zoho_tenant.plan_code.startswith(uc.zoho_prefix):
                selected_usecase = uc.name
                print(f"Matched Use Case: {selected_usecase} (Prefix: {uc.zoho_prefix})")
                break
    
    if not selected_usecase:
        print("Warning: No matching Use Case found based on plan code prefix. Defaulting to 'General'.")
        selected_usecase = "General"

    # 3. Determine Thingsboard Profile
    # Logic: Check PlanProfileMapping
    mappings = db.query(PlanProfileMapping).all()
    selected_profile_id = None
    
    for m in mappings:
        # Check if keyword is in plan name or plan code
        if (m.zoho_plan_keyword in zoho_tenant.plan_name) or \
           (zoho_tenant.plan_code and m.zoho_plan_keyword in zoho_tenant.plan_code):
            
            # Find the profile ID
            profile = db.query(ThingsboardProfile).filter(ThingsboardProfile.name == m.tb_profile_name).first()
            if profile:
                selected_profile_id = profile.tb_profile_id
                print(f"Matched Profile: {profile.name} (ID: {selected_profile_id}) via keyword '{m.zoho_plan_keyword}'")
                break
    
    if not selected_profile_id:
        print("Warning: No matching Profile found. Using Default profile.")
        default_profile = db.query(ThingsboardProfile).filter(ThingsboardProfile.is_default == True).first()
        if default_profile:
            selected_profile_id = default_profile.tb_profile_id
            print(f"Using Default Profile: {default_profile.name}")
        else:
            print("Error: No default profile found.")
            return

    # 4. Create Thingsboard Tenant
    print("Logging into ThingsBoard...")
    try:
        # Use settings for credentials
        tb_username = os.getenv("TB_USERNAME")
        tb_password = os.getenv("TB_PASSWORD")
        token_response = thingsboard.tb_login(tb_username, tb_password)
        tb_token = token_response.get("token")
        if not tb_token:
            print("Failed to get token from login response.")
            return
    except Exception as e:
        print(f"Failed to login to ThingsBoard: {e}")
        return

    tenant_title = zoho_tenant.customer_name
    print(f"Creating Tenant: {tenant_title}")
    
    new_tenant = thingsboard.create_tenant(tb_token, tenant_title, selected_profile_id, selected_usecase)
    
    if not new_tenant:
        print("Failed to create tenant (or it already exists).")
        # Try to find existing tenant to continue?
        # For now, let's assume we stop if creation fails, or maybe we search for it.
        # But create_tenant usually returns None if it fails.
        return

    tenant_id = new_tenant['id']['id']
    print(f"Tenant Created Successfully. ID: {tenant_id}")

    # 5. Create Tenant Admin
    # First Name: Technical Admin Name
    # Last Name: Customer Name
    # Email: Zoho Tenant Email
    
    first_name = "Technical Admin"
    # Try to find a technical manager to use their name if possible, but User model lacks name fields.
    # So we stick to "Technical Admin" or maybe "System Admin".
    
    last_name = zoho_tenant.customer_name
    admin_email = zoho_tenant.email
    
    print(f"Creating Tenant Admin: {admin_email} ({first_name} {last_name})")
    
    admin_user = thingsboard.create_tenant_admin(tb_token, tenant_id, admin_email, first_name, last_name)
    
    if admin_user:
        print("Tenant Admin created successfully.")
    else:
        print("Failed to create Tenant Admin.")

    db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python provision_zoho_tenant.py <subscription_id>")
        sys.exit(1)
    
    provision_tenant(sys.argv[1])
