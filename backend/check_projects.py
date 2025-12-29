from app.database import SessionLocal
from app.models import Project, User

db = SessionLocal()
projects = db.query(Project).all()

print(f"{'ID':<5} {'Name':<30} {'Tenant ID':<40} {'Tech Manager ID'}")
print("-" * 90)
for p in projects:
    print(f"{p.id:<5} {p.name:<30} {p.tenant_id:<40} {p.technical_manager_id}")

users = db.query(User).all()
print("\nUsers:")
for u in users:
    print(f"{u.id}: {u.email} ({u.role})")

db.close()