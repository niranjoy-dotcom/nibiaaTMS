from app.database import SessionLocal
from app.models import Project, User

db = SessionLocal()
email = "niranjoyy@gmail.com"
user = db.query(User).filter(User.email == email).first()

if user:
    print(f"User Found: {user.email} (ID: {user.id})")
    print(f"Role: {user.role}")
    
    projects = db.query(Project).filter(Project.technical_manager_id == user.id).all()
    if projects:
        print(f"Assigned Projects ({len(projects)}):")
        for p in projects:
            print(f" - Project ID: {p.id}, Name: {p.name}, Tenant ID: {p.tenant_id}")
    else:
        print("No projects assigned to this user (via technical_manager_id).")
else:
    print(f"User {email} not found.")

db.close()