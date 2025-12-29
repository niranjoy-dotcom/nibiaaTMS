from app.database import SessionLocal
from app.models import ZohoTenant
from datetime import datetime

def populate_dummy_zoho():
    db = SessionLocal()
    
    # Check if dummy data already exists
    existing = db.query(ZohoTenant).filter(ZohoTenant.subscription_id == "SUB-DUMMY-001").first()
    if existing:
        print("Dummy Zoho tenant already exists.")
        return

    dummy_tenant = ZohoTenant(
        subscription_id="SUB-DUMMY-001",
        customer_id="CUST-001",
        customer_name="Acme Corp",
        email="contact@acme.com",
        plan_name="Enterprise Plan",
        plan_code="ENT-YEARLY",
        status="live",
        amount=999.00,
        currency_symbol="$",
        current_term_starts_at="2023-01-01",
        current_term_ends_at="2023-12-31",
        interval=1,
        interval_unit="years",
        created_at="2023-01-01"
    )
    
    db.add(dummy_tenant)
    db.commit()
    print("Dummy Zoho tenant added successfully.")
    db.close()

if __name__ == "__main__":
    populate_dummy_zoho()
