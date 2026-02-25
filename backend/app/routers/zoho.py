from fastapi import APIRouter, HTTPException, Depends, Body, BackgroundTasks
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List
import httpx
import os
import json
import time
from dotenv import load_dotenv
from ..database import get_db
from ..models import ZohoTenant, ZohoCustomer, Project, Usecase, PlanProfileMapping, ThingsboardProfile, User, ZohoProduct, ZohoPlan
from .. import schemas
from .. import thingsboard
from .. import email_utils

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
load_dotenv(env_path)

router = APIRouter(
    prefix="/zoho",
    tags=["zoho"]
)

async def get_zoho_access_token():
    # Define paths relative to backend directory
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    
    # 1. Check for cached access token
    access_token_path = os.path.join(backend_dir, "zoho_access_token.json")
    if not os.path.exists(access_token_path):
        # Fallback to CWD
        cwd_path = os.path.join(os.getcwd(), "zoho_access_token.json")
        if os.path.exists(cwd_path):
            access_token_path = cwd_path

    try:
        if os.path.exists(access_token_path):
            with open(access_token_path, "r") as f:
                cached_data = json.load(f)
                # Check if token is valid (with 5 minute buffer)
                if cached_data.get("expires_at", 0) > time.time() + 300:
                    return cached_data["access_token"]
    except Exception as e:
        print(f"Error reading cached access token: {e}")

    # 2. If no valid cached token, get new one using refresh token
    client_id = os.getenv("ZOHO_CLIENT_ID")
    client_secret = os.getenv("ZOHO_CLIENT_SECRET")
    
    # Read refresh token from zoho_token.txt
    try:
        token_path = os.path.join(backend_dir, "zoho_token.txt")
        
        if not os.path.exists(token_path):
            # Fallback to CWD
            token_path = os.path.join(os.getcwd(), "zoho_token.txt")
            
        print(f"DEBUG: Reading refresh token from {token_path}")
        with open(token_path, "r") as f:
            refresh_token = f.read().strip()
    except Exception as e:
        print(f"Error reading zoho_token.txt: {e}")
        refresh_token = None

    # Determine Zoho DC (Data Center) from env, default to .in
    zoho_dc = os.getenv("ZOHO_DC", "in")
    
    # Helper to try fetching token from a specific DC
    async def fetch_token_from_dc(dc):
        url = f"https://accounts.zoho.{dc}/oauth/v2/token"
        params = {
            "refresh_token": refresh_token,
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "refresh_token"
        }
        print(f"DEBUG: Fetching token from {dc} with params: client_id={client_id[:5]}..., refresh_token={refresh_token[:10]}...")
        async with httpx.AsyncClient() as client:
            response = await client.post(url, params=params)
            resp_json = response.json()
            print(f"DEBUG: Response from {dc}: {resp_json}")
            return resp_json

    try:
        # Try configured DC first
        data = await fetch_token_from_dc(zoho_dc)
        
        if "access_token" not in data:
            # If .in fails, try .com as a last resort fallback
            print(f"DEBUG: Failed with .in, trying .com fallback...")
            data = await fetch_token_from_dc("com")
            
        if "access_token" not in data:
            error_msg = data.get("error", "Unknown error")
            raise HTTPException(status_code=500, detail=f"Failed to generate access token: {error_msg}. Response: {data}")
            
        # Update refresh token if a new one is provided (Refresh Token Rotation)
        if "refresh_token" in data:
            try:
                with open(token_path, "w") as f:
                    f.write(data["refresh_token"])
            except Exception as e:
                print(f"Warning: Failed to update zoho_token.txt: {e}")
        
        # Cache the new access token
        try:
            expires_in = data.get("expires_in", 3600) # Default to 1 hour
            cache_data = {
                "access_token": data["access_token"],
                "expires_at": time.time() + expires_in
            }
            # Use the same path logic as reading
            with open(access_token_path, "w") as f:
                json.dump(cache_data, f)
            print(f"DEBUG: Cached access token to {access_token_path}")
        except Exception as e:
            print(f"Warning: Failed to cache access token: {e}")
            
        return data["access_token"]

    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Network error connecting to Zoho: {str(e)}")

@router.get("/auth")
async def zoho_auth():
    """Initiate Zoho OAuth flow"""
    client_id = os.getenv("ZOHO_CLIENT_ID")
    zoho_dc = os.getenv("ZOHO_DC", "com")
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8080")
    redirect_uri = f"{backend_url}/zoho/callback"
    
    # Scopes required for your application
    scope = "ZohoBilling.subscriptions.READ,ZohoBilling.subscriptions.CREATE,ZohoBilling.customers.READ,ZohoBilling.customers.CREATE"
    
    auth_url = f"https://accounts.zoho.{zoho_dc}/oauth/v2/auth?response_type=code&client_id={client_id}&scope={scope}&redirect_uri={redirect_uri}&access_type=offline&prompt=consent"
    return RedirectResponse(auth_url)

@router.get("/callback")
async def zoho_callback(code: str = None, error: str = None):
    """Handle Zoho OAuth callback"""
    if error:
        return {"error": error}
    
    if not code:
        return {"error": "No authorization code received. Please try connecting again from the application."}
        
    client_id = os.getenv("ZOHO_CLIENT_ID")
    client_secret = os.getenv("ZOHO_CLIENT_SECRET")
    zoho_dc = os.getenv("ZOHO_DC", "com")
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8080")
    redirect_uri = f"{backend_url}/zoho/callback"
    
    url = f"https://accounts.zoho.{zoho_dc}/oauth/v2/token"
    params = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, params=params)
            data = response.json()
            
            if "error" in data:
                return {"error": data["error"]}
                
            refresh_token = data.get("refresh_token")
            access_token = data.get("access_token")
            
            if refresh_token:
                # Save refresh token to file
                try:
                    # Use robust path logic relative to backend dir
                    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
                    token_path = os.path.join(backend_dir, "zoho_token.txt")
                    
                    print(f"DEBUG: Saving new refresh token to {token_path}")
                    with open(token_path, "w") as f:
                        f.write(refresh_token)
                except Exception as e:
                    return {"error": f"Failed to save refresh token: {str(e)}"}
            
            if access_token:
                # Cache access token
                try:
                    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
                    access_token_path = os.path.join(backend_dir, "zoho_access_token.json")
                        
                    expires_in = data.get("expires_in", 3600)
                    cache_data = {
                        "access_token": access_token,
                        "expires_at": time.time() + expires_in
                    }
                    with open(access_token_path, "w") as f:
                        json.dump(cache_data, f)
                    print(f"DEBUG: Cached access token to {access_token_path}")
                except Exception as e:
                    print(f"Warning: Failed to cache access token: {e}")

            return {"message": "Zoho authentication successful! Tokens have been saved.", "refresh_token_saved": bool(refresh_token)}
            
        except httpx.RequestError as exc:
            return {"error": f"Connection error: {str(exc)}"}

@router.get("/plans")
async def get_zoho_plans(db: Session = Depends(get_db)):
    """Fetch ACTIVE plans from Local DB"""
    try:
        plans = db.query(ZohoPlan).filter(ZohoPlan.status == "active").all()
        return plans
    except Exception as e:
        print(f"Error in get_zoho_plans: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/products")
async def get_zoho_products(db: Session = Depends(get_db)):
    """Fetch ACTIVE products from Local DB"""
    try:
        products = db.query(ZohoProduct).filter(ZohoProduct.status == "active").all()
        return products
    except Exception as e:
        print(f"Error in get_zoho_products: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plans/sync")
async def sync_zoho_plans_route(db: Session = Depends(get_db)):
    return await sync_zoho_plans(db)

async def sync_zoho_plans(db: Session):
    try:
        print("Syncing Zoho Plans...")
        access_token = await get_zoho_access_token()
        
        zoho_dc = os.getenv("ZOHO_DC", "in")
        api_domain = "zohoapis.in" if zoho_dc == "in" else "zohoapis.com"
        org_id = os.getenv("ZOHO_BILLING_ORG_ID") or os.getenv("ZOHO_ORG_ID")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
             # Fetch Org ID if missing (Simplification: Assuming org_id is present or fetched previously)
             if not org_id:
                # Fetch logic repeated or refactored. For now assuming env is set or fetched elsewhere.
                pass

             url = f"https://www.{api_domain}/billing/v1/plans"
             headers = {
                "Authorization": f"Zoho-oauthtoken {access_token}",
                "Content-Type": "application/json"
             }
             if org_id:
                headers["X-com-zoho-subscriptions-organizationid"] = org_id
            
             response = await client.get(url, headers=headers)
             if response.status_code == 200:
                 plans = response.json().get("plans", [])
                 for plan in plans:
                     db_plan = db.query(ZohoPlan).filter(ZohoPlan.plan_code == plan.get("plan_code")).first()
                     if not db_plan:
                         db_plan = ZohoPlan(plan_code=plan.get("plan_code"))
                         db.add(db_plan)
                     
                     db_plan.product_id = plan.get("product_id")
                     db_plan.product_type = plan.get("product_type")
                     db_plan.plan_name = plan.get("name")
                     db_plan.plan_description = plan.get("description")
                     db_plan.unit_price = plan.get("recurring_price", 0) # Mapping recurring_price to unit_price as base
                     db_plan.recurring_price = plan.get("recurring_price", 0)
                     db_plan.setup_fee = plan.get("setup_fee", 0)
                     db_plan.interval = plan.get("interval")
                     db_plan.interval_unit = plan.get("interval_unit")
                     db_plan.billing_cycles = plan.get("billing_cycles")
                     db_plan.trial_period = plan.get("trial_period")
                     db_plan.status = plan.get("status")
                     db_plan.created_time = plan.get("created_time")
                     db_plan.updated_time = plan.get("updated_time")
                 
                 db.commit()
                 print(f"Synced {len(plans)} plans.")
                 return plans
             else:
                 print(f"Failed to fetch plans: {response.text}")
                 return []
    except Exception as e:
        print(f"Error executing sync_zoho_plans: {e}")
        return []

@router.get("/products/sync")
async def sync_zoho_products_route(db: Session = Depends(get_db)):
    return await sync_zoho_products(db)

async def sync_zoho_products(db: Session):
    try:
        print("Syncing Zoho Products...")
        access_token = await get_zoho_access_token()
        
        zoho_dc = os.getenv("ZOHO_DC", "in")
        api_domain = "zohoapis.in" if zoho_dc == "in" else "zohoapis.com"
        org_id = os.getenv("ZOHO_BILLING_ORG_ID") or os.getenv("ZOHO_ORG_ID")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
             url = f"https://www.{api_domain}/billing/v1/products"
             headers = {
                "Authorization": f"Zoho-oauthtoken {access_token}",
                "Content-Type": "application/json"
             }
             if org_id:
                headers["X-com-zoho-subscriptions-organizationid"] = org_id
            
             response = await client.get(url, headers=headers)
             if response.status_code == 200:
                 products = response.json().get("products", [])
                 for prod in products:
                     db_prod = db.query(ZohoProduct).filter(ZohoProduct.product_id == prod.get("product_id")).first()
                     if not db_prod:
                         db_prod = ZohoProduct(product_id=prod.get("product_id"))
                         db.add(db_prod)
                     
                     db_prod.product_name = prod.get("name")
                     db_prod.product_code = prod.get("product_code") # Check if key exists
                     db_prod.description = prod.get("description")
                     db_prod.status = prod.get("status")
                     db_prod.created_time = prod.get("created_time")
                     db_prod.updated_time = prod.get("updated_time")
                 
                 db.commit()
                 print(f"Synced {len(products)} products.")
                 return products
             else:
                 print(f"Failed to fetch products: {response.text}")
                 return []
    except Exception as e:
        print(f"Error executing sync_zoho_products: {e}")
        return []

async def sync_zoho_data(db: Session):
    """Orchestrator function to sync all Zoho data"""
    print("Starting background Zoho Sync...")
    await sync_zoho_products(db)
    await sync_zoho_plans(db)
    print("Background Zoho Sync Completed.")

@router.get("/subscriptions")
async def get_zoho_subscriptions(db: Session = Depends(get_db)):
    # 1. Get Access Token
    access_token = await get_zoho_access_token()
    
    # Determine API domain based on DC
    zoho_dc = os.getenv("ZOHO_DC", "in")
    api_domain = "zohoapis.in" if zoho_dc == "in" else "zohoapis.com" # Add more if needed (eu, au, etc)
    
    # 2. Fetch Subscriptions from Zoho
    # Try ZOHO_BILLING_ORG_ID first, then ZOHO_ORG_ID
    org_id = os.getenv("ZOHO_BILLING_ORG_ID") or os.getenv("ZOHO_ORG_ID")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # If Org ID is missing, try to fetch it
        if not org_id:
            print("Org ID not found in env, fetching from Zoho...")
            org_url = f"https://www.{api_domain}/billing/v1/organizations"
            headers = {
                "Authorization": f"Zoho-oauthtoken {access_token}",
                "Content-Type": "application/json"
            }
            try:
                org_resp = await client.get(org_url, headers=headers)
                org_data = org_resp.json()
                if org_resp.status_code == 200 and "organizations" in org_data and len(org_data["organizations"]) > 0:
                    org_id = org_data["organizations"][0]["organization_id"]
                    print(f"Fetched Org ID: {org_id}")
                else:
                    print(f"Failed to fetch organizations: {org_data}")
            except Exception as e:
                print(f"Error fetching organizations: {e}")

        url = f"https://www.{api_domain}/billing/v1/subscriptions?per_page=200"
        
        headers = {
            "Authorization": f"Zoho-oauthtoken {access_token}",
            "Content-Type": "application/json"
        }
        if org_id:
            headers["X-com-zoho-subscriptions-organizationid"] = org_id
        
        try:
            print(f"Fetching subscriptions from: {url}")
            response = await client.get(url, headers=headers)
            data = response.json()
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=data.get("message", f"Failed to fetch subscriptions from Zoho. Status: {response.status_code}, Response: {data}")
                )
            
            subscriptions = data.get("subscriptions", [])
            print(f"Fetched {len(subscriptions)} subscriptions from Zoho.")
            
            # Get list of existing project names AND emails
            existing_projects = db.query(Project.name, Project.customer_email).all()
            existing_project_names = {p.name for p in existing_projects}
            existing_project_emails = {p.customer_email for p in existing_projects if p.customer_email}

            # 3. Save to Database
            for sub in subscriptions:
                # Check if exists in DB
                db_sub = db.query(ZohoTenant).filter(ZohoTenant.subscription_id == sub.get("subscription_id")).first()
                
                # Determine Provision Status
                # Check if Project exists by Name OR Email
                is_provisioned = (sub.get("customer_name") in existing_project_names) or \
                                 (sub.get("email") in existing_project_emails)

                sub["is_provisioned"] = is_provisioned

                if not db_sub:
                    db_sub = ZohoTenant(subscription_id=sub.get("subscription_id"))
                    db.add(db_sub)
                
                # Update fields
                db_sub.is_provisioned = is_provisioned
                db_sub.customer_id = sub.get("customer_id")
                db_sub.customer_name = sub.get("customer_name")
                db_sub.email = sub.get("email")
                db_sub.plan_name = sub.get("plan_name")
                db_sub.plan_code = sub.get("plan_code")
                db_sub.status = sub.get("status")
                db_sub.amount = sub.get("amount")
                db_sub.currency_symbol = sub.get("currency_symbol")
                db_sub.current_term_starts_at = sub.get("current_term_starts_at")
                db_sub.current_term_ends_at = sub.get("current_term_ends_at")
                db_sub.interval = sub.get("interval")
                db_sub.interval_unit = sub.get("interval_unit")
                db_sub.created_at = sub.get("created_at")
                
            db.commit()
            
            return data
            
        except httpx.RequestError as exc:
            print(f"Request Error: {exc}")
            raise HTTPException(status_code=500, detail=f"Connection error while requesting {exc.request.url!r}: {str(exc)}")
        except Exception as e:
            print(f"Unexpected Error: {e}")
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@router.get("/customers")
async def get_zoho_customers(db: Session = Depends(get_db)):
    # 1. Get Access Token
    access_token = await get_zoho_access_token()
    
    # 2. Fetch Customers from Zoho
    org_id = os.getenv("ZOHO_BILLING_ORG_ID")
    # Use .in or .com based on DC, but usually the API endpoint is zohoapis.com or zohoapis.in
    zoho_dc = os.getenv("ZOHO_DC", "com")
    base_url = "https://www.zohoapis.in" if zoho_dc == "in" else "https://www.zohoapis.com"
    url = f"{base_url}/billing/v1/customers?per_page=200"
    
    headers = {
        "Authorization": f"Zoho-oauthtoken {access_token}",
        "Content-Type": "application/json"
    }
    if org_id:
        headers["X-com-zoho-subscriptions-organizationid"] = org_id
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            data = response.json()
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=data.get("message", "Failed to fetch customers from Zoho")
                )
            
            customers = data.get("customers", [])
            
            # 3. Save to Database
            for cust in customers:
                # Check if exists
                db_cust = db.query(ZohoCustomer).filter(ZohoCustomer.customer_id == cust.get("customer_id")).first()
                
                if not db_cust:
                    db_cust = ZohoCustomer(customer_id=cust.get("customer_id"))
                    db.add(db_cust)
                
                # Update fields
                db_cust.display_name = cust.get("display_name")
                db_cust.first_name = cust.get("first_name")
                db_cust.last_name = cust.get("last_name")
                db_cust.email = cust.get("email")
                db_cust.company_name = cust.get("company_name")
                db_cust.phone = cust.get("phone")
                db_cust.mobile = cust.get("mobile")
                db_cust.currency_code = cust.get("currency_code")
                db_cust.status = cust.get("status")
                db_cust.created_time = cust.get("created_time")
                db_cust.updated_time = cust.get("updated_time")
                
            db.commit()
            
            return {"message": f"Successfully synced {len(customers)} customers", "customers": customers}
            
        except httpx.RequestError as exc:
            raise HTTPException(status_code=500, detail=f"An error occurred while requesting {exc.request.url!r}.")

@router.get("/stored_tenants", response_model=List[schemas.ZohoTenant])
def get_stored_zoho_tenants(include_provisioned: bool = False, db: Session = Depends(get_db)):
    """Get Zoho Tenants stored in local database. By default excludes those already created as Projects."""
    
    if include_provisioned:
        return db.query(ZohoTenant).all()

    # Filter using the is_provisioned column
    available_zoho_tenants = db.query(ZohoTenant).filter(ZohoTenant.is_provisioned == False).all()
    
    return available_zoho_tenants

@router.post("/provision/{subscription_id}")
def provision_zoho_tenant(
    subscription_id: str, 
    background_tasks: BackgroundTasks,
    technical_manager_id: int = Body(None, embed=True),
    db: Session = Depends(get_db)
):
    """
    Auto-populate Tenant Name from Zoho Tenant Customer Name.
    Determine Use Case by looking at Zoho Prefix in Plan Code.
    Determine Plan/Profile from Plan Profile Mapping.
    Create Thingsboard Tenant and Tenant Admin.
    Create Project in local DB (Technical Manager is optional).
    Send Email to Customer.
    """
    # 1. Fetch Zoho Tenant
    zoho_tenant = db.query(ZohoTenant).filter(ZohoTenant.subscription_id == subscription_id).first()
    if not zoho_tenant:
        raise HTTPException(status_code=404, detail=f"Zoho Tenant with subscription ID {subscription_id} not found.")

    # 2. Determine Use Case
    usecases = db.query(Usecase).all()
    selected_usecase = "General" # Default
    
    if zoho_tenant.plan_code:
        for uc in usecases:
            if uc.zoho_prefix and zoho_tenant.plan_code.startswith(uc.zoho_prefix):
                selected_usecase = uc.name
                break
    
    # 3. Determine Thingsboard Profile
    mappings = db.query(PlanProfileMapping).all()
    selected_profile_id = None
    
    for m in mappings:
        if (zoho_tenant.plan_name and m.zoho_plan_keyword in zoho_tenant.plan_name) or \
           (zoho_tenant.plan_code and m.zoho_plan_keyword in zoho_tenant.plan_code):
            
            profile = db.query(ThingsboardProfile).filter(ThingsboardProfile.name == m.tb_profile_name).first()
            if profile:
                selected_profile_id = profile.tb_profile_id
                break
    
    if not selected_profile_id:
        default_profile = db.query(ThingsboardProfile).filter(ThingsboardProfile.is_default == True).first()
        if default_profile:
            selected_profile_id = default_profile.tb_profile_id
        else:
            raise HTTPException(status_code=500, detail="No matching profile found and no default profile configured.")

    # 4. Create Thingsboard Tenant
    try:
        tb_username = os.getenv("TB_USERNAME")
        tb_password = os.getenv("TB_PASSWORD")
        token_response = thingsboard.tb_login(tb_username, tb_password)
        tb_token = token_response.get("token")
        if not tb_token:
             raise HTTPException(status_code=500, detail="Failed to authenticate with ThingsBoard.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ThingsBoard login failed: {str(e)}")

    tenant_title = zoho_tenant.customer_name
    
    new_tenant = thingsboard.create_tenant(tb_token, tenant_title, selected_profile_id, selected_usecase, email=zoho_tenant.email)
    
    if not new_tenant:
        raise HTTPException(status_code=400, detail="Failed to create tenant in ThingsBoard (or it already exists).")

    tenant_id = new_tenant['id']['id']

    # 5. Create Tenant Admin
    first_name = "Technical Admin"
    last_name = zoho_tenant.customer_name
    admin_email = zoho_tenant.email
    
    # Don't send activation mail automatically, we will send it manually
    admin_user = thingsboard.create_tenant_admin(tb_token, tenant_id, admin_email, first_name, last_name, send_activation_mail=False)
    
    if not admin_user:
        print(f"Warning: Failed to create Tenant Admin {admin_email}. Checking if user already exists in tenant...")
        # Fallback: Check if user exists in the tenant
        try:
            tenant_users = thingsboard.get_tenant_users(tb_token, tenant_id)
            for u in tenant_users:
                if u.get('email') == admin_email:
                    admin_user = u
                    print(f"Found existing user: {admin_user['id']['id']}")
                    break
        except Exception as e:
            print(f"Error searching for existing user: {e}")

    activation_link = None
    if admin_user:
        admin_user_id = admin_user['id']['id']
        activation_link = thingsboard.get_activation_link(tb_token, admin_user_id)
    
    # 6. Create Project in Local DB
    # Check if project already exists
    existing_project = db.query(Project).filter(Project.tenant_id == tenant_id).first()
    if not existing_project:
        new_project = Project(
            name=zoho_tenant.customer_name,
            description=f"Project for {zoho_tenant.customer_name}",
            tenant_id=tenant_id,
            technical_manager_id=technical_manager_id,
            status="Active",
            usecase=selected_usecase,
            plan=zoho_tenant.plan_name,
            customer_email=zoho_tenant.email
        )
        db.add(new_project)
        db.commit()
        db.refresh(new_project)

    # 7. Update Zoho Tenant Provision Status
    zoho_tenant.is_provisioned = True
    db.commit()

    # 8. Send Email to Technical Manager (Internal Process)
    subject = f"Activation Details for New Tenant: {zoho_tenant.customer_name}"
    host_ip = email_utils.get_host_ip()
    dashboard_url = f"http://{host_ip}:8090"
    
    activation_msg = ""
    if activation_link:
        activation_msg = f'<li><b>Activation Link:</b> <a href="{activation_link}">Click here to set password</a></li>'
    else:
        activation_msg = '<li><b>Activation Link:</b> Not available. (User creation failed or link fetch error. Check server logs.)</li>'

    body = f"""
    <html>
        <body>
            <h2>New Tenant Provisioned</h2>
            <p><b>Customer Name:</b> {zoho_tenant.customer_name}</p>
            <p><b>Plan:</b> {zoho_tenant.plan_name}</p>
            <p><b>Tenant Admin Email:</b> {admin_email}</p>
            <br>
            <p>Please use the following link to activate the Tenant Admin account and set the password:</p>
            <ul>
                <li><b>Dashboard URL:</b> <a href="{dashboard_url}">{dashboard_url}</a></li>
                {activation_msg}
            </ul>
            <br>
            <p>This is an internal notification. The customer has NOT been emailed.</p>
        </body>
    </html>
    """
    
    recipients = []
    # Only send to Technical Manager
    if technical_manager_id:
        tm = db.query(User).filter(User.id == technical_manager_id).first()
        if tm and tm.email:
            recipients.append(tm.email)
            
    if recipients:
        background_tasks.add_task(email_utils.send_email, recipients, subject, body)

    return {
        "message": "Tenant provisioned successfully. Activation email sent to Technical Manager.",
        "tenant_id": tenant_id,
        "tenant_name": tenant_title,
        "profile_id": selected_profile_id,
        "use_case": selected_usecase,
        "admin_email": admin_email,
        "project_created": True
    }
