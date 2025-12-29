from app.database import SessionLocal
from app import models

db = SessionLocal()
projects = db.query(models.Project).all()
print(f"Total Projects in DB: {len(projects)}")
for p in projects:
    print(f"Project: {p.name}, Tenant ID: {p.tenant_id}")

user_tenants = db.query(models.UserTenant).all()
print(f"Total UserTenant assignments: {len(user_tenants)}")
for ut in user_tenants:
    print(f"User: {ut.user_id}, Tenant ID: {ut.tenant_id}")

zoho_tenants = db.query(models.ZohoTenant).all()
print(f"Total Zoho Tenants in DB: {len(zoho_tenants)}")
for zt in zoho_tenants:
    print(f"Subscription ID: {zt.subscription_id}, Customer: {zt.customer_name}, Plan: {zt.plan_name}")
