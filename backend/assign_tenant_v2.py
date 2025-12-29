from app.database import SessionLocal
from app.models import User, UserTenant
from app import thingsboard
from app.config import settings

# Login to TB to get tenant ID
print("Logging into ThingsBoard...")
tb_data = thingsboard.tb_login(settings.TB_USERNAME, settings.TB_PASSWORD)
token = tb_data['token']
tenants = thingsboard.list_tenants(token)

if not tenants:
    print("No tenants found.")
    exit(1)

target_tenant = tenants[0]
print(f"Target Tenant: {target_tenant['title']} ({target_tenant['id']['id']})")

db = SessionLocal()
user = db.query(User).filter(User.email == "niranjoyy@gmail.com").first()

if user:
    print(f"Assigning tenant to user {user.email} (ID: {user.id})")
    
    existing = db.query(UserTenant).filter(
        UserTenant.user_id == user.id,
        UserTenant.tenant_id == target_tenant['id']['id']
    ).first()
    
    if not existing:
        new_assignment = UserTenant(user_id=user.id, tenant_id=target_tenant['id']['id'])
        db.add(new_assignment)
        db.commit()
        print("Assignment created in UserTenant table.")
    else:
        print("Assignment already exists.")
else:
    print("User not found.")

db.close()