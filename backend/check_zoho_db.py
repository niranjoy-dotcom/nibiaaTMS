from app.database import SessionLocal
from app.models import ZohoTenant

db = SessionLocal()
tenants = db.query(ZohoTenant).all()
print(f"Found {len(tenants)} Zoho Tenants in database.")
for t in tenants:
    print(f"- {t.customer_name} ({t.plan_code})")
db.close()
