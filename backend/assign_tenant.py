from app.database import SessionLocal
from app.models import Project, User
from app import thingsboard
import os
from dotenv import load_dotenv

load_dotenv(override=True)

# Login to TB
print("Logging into ThingsBoard...")
tb_username = os.getenv("TB_USERNAME", "admin@nibiaa.com")
tb_password = os.getenv("TB_PASSWORD", "122333")
tb_data = thingsboard.tb_login(tb_username, tb_password)
if not tb_data:
    print("Failed to login to ThingsBoard")
    exit(1)

token = tb_data['token']

# List Tenants
print("Fetching Tenants...")
tenants = thingsboard.list_tenants(token)
print(f"Found {len(tenants)} tenants.")

target_tenant = None

if not tenants:
    print("No tenants found. Creating one...")
    # Create a dummy tenant
    new_tenant = thingsboard.create_tenant(token, "Demo Tenant", None, "Testing")
    if new_tenant:
        print(f"Created Tenant: {new_tenant['title']} ({new_tenant['id']['id']})")
        target_tenant = new_tenant
    else:
        print("Failed to create tenant")
        exit(1)
else:
    target_tenant = tenants[0]
    print(f"Using existing tenant: {target_tenant['title']} ({target_tenant['id']['id']})")

# Assign to User ID 2 (niranjoyy@gmail.com)
db = SessionLocal()
user = db.query(User).filter(User.email == "niranjoyy@gmail.com").first()

if user:
    print(f"Assigning tenant to user {user.email} (ID: {user.id})")
    
    # Check if project exists
    project = db.query(Project).filter(Project.tenant_id == target_tenant['id']['id']).first()
    if not project:
        project = Project(
            name=f"{target_tenant['title']} Project",
            description="Auto-generated project",
            tenant_id=target_tenant['id']['id'],
            technical_manager_id=user.id # Assigning here!
        )
        db.add(project)
        print("Created new project assignment.")
    else:
        project.technical_manager_id = user.id
        print("Updated existing project assignment.")
    
    db.commit()
    print("Assignment complete.")
else:
    print("User niranjoyy@gmail.com not found.")

db.close()