from fastapi import APIRouter, Depends, HTTPException, Header, Body, BackgroundTasks
from typing import List, Optional
import asyncio
from sqlalchemy.orm import Session
from .. import schemas, thingsboard, auth, models, database

router = APIRouter(prefix="/tb", tags=["ThingsBoard"])

# Dependency to get TB token from header
def get_tb_token(x_tb_token: str = Header(None)):
    if not x_tb_token:
        raise HTTPException(status_code=400, detail="X-TB-Token header missing")
    return x_tb_token

# Helper to aggregate users
def _get_tenant_users_aggregated(tenant_id: str, token: str):
    # 1. Try to get Tenant Admin token
    ta_token = None
    users = thingsboard.get_tenant_users(token, tenant_id)
    
    # Find the first created Tenant Admin (Oldest First)
    tenant_admins = [u for u in users if u['authority'] == 'TENANT_ADMIN']
    tenant_admins.sort(key=lambda x: x.get('createdTime', float('inf')))
    
    ta = tenant_admins[0] if tenant_admins else None

    if ta:
        ta_token = thingsboard.get_user_token(token, ta['id']['id'])
    
    if ta_token:
        all_users = thingsboard.get_all_user_infos(ta_token)
        
        # Manual aggregation
        direct_users = thingsboard.get_tenant_admins(ta_token)
        customers = thingsboard.get_customers(ta_token)
        customer_users = []
        for c in customers:
            c_users = thingsboard.get_customer_users(ta_token, c['id']['id'])
            customer_users.extend(c_users)
            
        # Merge lists
        user_map = {u['id']['id']: u for u in all_users}
        for u in direct_users:
            user_map[u['id']['id']] = u
        for u in customer_users:
            user_map[u['id']['id']] = u
            
        final_users = list(user_map.values())
        
        # Enrich with details
        final_users = thingsboard.enrich_users_with_details(ta_token, final_users)
        return final_users, ta
    else:
        return users, None

@router.post("/login")
def login_tb(creds: schemas.LoginRequest):
    data = thingsboard.tb_login(creds.username, creds.password)
    if not data:
        raise HTTPException(status_code=401, detail="Invalid ThingsBoard credentials")
    return data

@router.post("/auth/token")
def refresh_tb_token(refresh_token: str = Body(..., embed=True)):
    data = thingsboard.tb_refresh_token(refresh_token)
    if not data:
        raise HTTPException(status_code=401, detail="Failed to refresh token")
    return data

@router.post("/auth/logout")
def logout_tb(token: str = Depends(get_tb_token)):
    thingsboard.tb_logout(token)
    return {"status": "logged out"}

@router.get("/tenants")
def get_tenants(
    token: str = Depends(get_tb_token), 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_role(["project_manager", "technical_manager"]))
):
    all_tenants_tb = thingsboard.list_tenants(token)
    
    # --- SYNC: Delete local data for tenants that no longer exist in ThingsBoard ---
    valid_tb_ids = [t['id']['id'] for t in all_tenants_tb]
    
    # 1. Identify orphaned projects
    orphaned_projects_query = db.query(models.Project)
    if valid_tb_ids:
        orphaned_projects_query = orphaned_projects_query.filter(models.Project.tenant_id.notin_(valid_tb_ids))
    else:
        # If TB returns empty list (and it's not an error), then all local projects with tenant_id are orphaned
        orphaned_projects_query = orphaned_projects_query.filter(models.Project.tenant_id != None)
        
    orphaned_projects = orphaned_projects_query.all()
    
    if orphaned_projects:
        for proj in orphaned_projects:
            # Delete associated tasks
            db.query(models.Task).filter(models.Task.project_id == proj.id).delete()
            # Delete the project
            db.delete(proj)
        db.commit()
        
    # 2. Identify orphaned UserTenant records
    orphaned_ut_query = db.query(models.UserTenant)
    if valid_tb_ids:
        orphaned_ut_query = orphaned_ut_query.filter(models.UserTenant.tenant_id.notin_(valid_tb_ids))
    else:
        orphaned_ut_query = orphaned_ut_query.filter(models.UserTenant.tenant_id != None)
        
    if orphaned_ut_query.count() > 0:
        orphaned_ut_query.delete(synchronize_session=False)
        db.commit()
    # -------------------------------------------------------------------------------

    # Filter: Only show tenants that have a corresponding Project in local DB (Created by System)
    # Query returns list of tuples like [('id1',), ('id2',)]
    system_project_tenant_ids = [r[0] for r in db.query(models.Project.tenant_id).all()]
    
    # Keep only tenants that exist in our local Project table
    system_tenants = [t for t in all_tenants_tb if t['id']['id'] in system_project_tenant_ids]

    # Filter for Technical Manager
    if current_user.role == "technical_manager":
        # Get tenant_ids assigned to this TM
        tm_tenant_ids = [r[0] for r in db.query(models.Project.tenant_id).filter(models.Project.technical_manager_id == current_user.id).all()]
        system_tenants = [t for t in system_tenants if t['id']['id'] in tm_tenant_ids]

    # Filter for Project Manager
    if current_user.role == "project_manager":
        # Get tenant_ids assigned to this PM (via UserTenant or Project)
        # Using UserTenant as it seems to be the primary link for PMs in create_tenant
        pm_tenant_ids = [r[0] for r in db.query(models.UserTenant.tenant_id).filter(models.UserTenant.user_id == current_user.id).all()]
        # Also check Project table just in case
        pm_project_tenant_ids = [r[0] for r in db.query(models.Project.tenant_id).filter(models.Project.project_manager_id == current_user.id).all()]
        
        allowed_ids = set(pm_tenant_ids + pm_project_tenant_ids)
        system_tenants = [t for t in system_tenants if t['id']['id'] in allowed_ids]

    # If user is admin, project_manager, or technical_manager, return all system tenants
    if current_user.role in ["admin", "project_manager", "technical_manager"]:
        return system_tenants
        
    return []

@router.get("/profiles")
def get_profiles(token: str = Depends(get_tb_token), current_user: models.User = Depends(auth.require_role(["project_manager", "technical_manager"]))):
    return thingsboard.get_tenant_profiles(token)

@router.post("/users")
def create_tb_user(
    user: schemas.TBUserCreate, 
    token: str = Depends(get_tb_token), 
    current_user: models.User = Depends(auth.require_role(["admin", "project_manager", "technical_manager"]))
):
    # Permission Check based on Authority
    if user.authority == "TENANT_ADMIN":
        # Only Admin and Project Manager can create Tenant Admins
        if current_user.role not in ["admin", "project_manager"]:
             raise HTTPException(status_code=403, detail="Only Admins and Project Managers can invite Tenant Admins")

    new_user = thingsboard.create_user(
        token, 
        user.email, 
        user.firstName, 
        user.lastName, 
        user.authority, 
        user.tenantId, 
        user.customerId
    )
    if not new_user:
        raise HTTPException(status_code=400, detail="Failed to create user in ThingsBoard")
    return new_user

@router.post("/tenants")
def create_tenant(
    tenant: schemas.TenantCreate, 
    token: str = Depends(get_tb_token), 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "project_manager"]))
):
    # Create Tenant
    new_tenant = thingsboard.create_tenant(token, tenant.title, tenant.profile_id, tenant.use_case)
    if not new_tenant:
        raise HTTPException(status_code=400, detail="Failed to create tenant")
    
    # Generate Admin Email
    # Format: technical_manager_name + tenant_name + @nibiaa.com
    tm_user = db.query(models.User).filter(models.User.id == tenant.technical_manager_id).first()
    if not tm_user:
        # Fallback if TM not found (shouldn't happen due to frontend validation)
        tm_name = "technical"
    else:
        # Extract name from email (e.g. technical@nibiaa.com -> technical)
        tm_name = tm_user.email.split('@')[0]
    
    # Clean tenant title for email (remove spaces, lowercase)
    clean_tenant_title = "".join(e for e in tenant.title if e.isalnum()).lower()
    
    generated_admin_email = f"{tm_name}+{clean_tenant_title}@nibiaa.com"

    # Create Admin
    admin = thingsboard.create_tenant_admin(token, new_tenant['id']['id'], generated_admin_email, tenant.first_name, tenant.last_name)
    
    # Create Project in Local DB
    # Automatically create a project for this tenant
    
    # Fetch Profile Name if profile_id is present
    profile_name = None
    if tenant.profile_id:
        # We need to fetch profiles to find the name. 
        # This is a bit inefficient but works.
        profiles = thingsboard.get_tenant_profiles(token)
        for p in profiles:
            if p['id']['id'] == tenant.profile_id:
                profile_name = p['name']
                break
    
    db_project = models.Project(
        name=f"{tenant.title} Project",
        description=f"Project for managing tenant {tenant.title}",
        tenant_id=new_tenant['id']['id'],
        technical_manager_id=tenant.technical_manager_id,
        project_manager_id=tenant.project_manager_id if tenant.project_manager_id else current_user.id,
        usecase=tenant.use_case,
        plan=profile_name,
        customer_email=tenant.customer_email
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    # Assign the creator (Project Manager) to this tenant
    # If project_manager_id is provided, assign that user. If not, assign current_user.
    pm_id_to_assign = tenant.project_manager_id if tenant.project_manager_id else current_user.id
    
    # Check if assignment already exists (e.g. if current_user is the assigned PM)
    existing_assignment = db.query(models.UserTenant).filter(models.UserTenant.user_id == pm_id_to_assign, models.UserTenant.tenant_id == new_tenant['id']['id']).first()
    if not existing_assignment:
        user_tenant = models.UserTenant(user_id=pm_id_to_assign, tenant_id=new_tenant['id']['id'])
        db.add(user_tenant)
    
    # If current_user is NOT the assigned PM (e.g. Admin creating for a PM), maybe assign Admin too?
    # For now, let's just ensure the assigned PM is linked.
    
    # Also assign the Technical Manager to this tenant
    if tenant.technical_manager_id:
        tm_assignment = db.query(models.UserTenant).filter(models.UserTenant.user_id == tenant.technical_manager_id, models.UserTenant.tenant_id == new_tenant['id']['id']).first()
        if not tm_assignment:
            tm_tenant = models.UserTenant(user_id=tenant.technical_manager_id, tenant_id=new_tenant['id']['id'])
            db.add(tm_tenant)

    # Assign the selected User if provided
    if tenant.assigned_user_id:
        assigned_user_tenant = models.UserTenant(user_id=tenant.assigned_user_id, tenant_id=new_tenant['id']['id'])
        db.add(assigned_user_tenant)

    # Create Tasks from Templates if provided
    if tenant.task_template_ids:
        for template_id in tenant.task_template_ids:
            template = db.query(models.TaskTemplate).filter(models.TaskTemplate.id == template_id).first()
            if template:
                new_task = models.Task(
                    title=template.title,
                    description=template.description,
                    criticality=template.criticality,
                    status="Pending",
                    project_id=db_project.id
                )
                db.add(new_task)

    # Update Zoho Tenant Status if linked
    if tenant.zoho_tenant_id:
        zoho_tenant = db.query(models.ZohoTenant).filter(models.ZohoTenant.id == tenant.zoho_tenant_id).first()
        if zoho_tenant:
            zoho_tenant.status = "Provisioned"
            db.add(zoho_tenant)

    db.commit()

    if not admin:
        return {"tenant": new_tenant, "project": db_project, "message": "Tenant and Project created but Admin creation failed"}
    
    return {"tenant": new_tenant, "admin": admin, "project": db_project}

@router.put("/tenant/{tenant_id}")
def update_tenant(
    tenant_id: str, 
    title: str = Body(..., embed=True), 
    profile_id: str = Body(..., embed=True), 
    token: str = Depends(get_tb_token), 
    current_user: models.User = Depends(auth.require_role(["admin", "project_manager"]))
):
    updated_tenant = thingsboard.update_tenant(token, tenant_id, title, profile_id)
    if not updated_tenant:
        raise HTTPException(status_code=400, detail="Failed to update tenant")
    return updated_tenant

@router.get("/tenant/{tenant_id}/users")
def get_tenant_users(
    tenant_id: str, 
    token: str = Depends(get_tb_token), 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_role(["project_manager", "technical_manager"]))
):
    users, _ = _get_tenant_users_aggregated(tenant_id, token)
    return users

def _bulk_user_action_task(tenant_id: str, token: str, active: bool, ignore_domain_check: bool = False):
    action_name = "activation" if active else "deactivation"
    users, first_ta = _get_tenant_users_aggregated(tenant_id, token)
    
    count = 0
    for u in users:
        # Skip if email ends with @nibiaa.com UNLESS ignore_domain_check is True
        if not ignore_domain_check and u.get('email', '').endswith('@nibiaa.com'):
            continue
            
        # Skip if it is the First Tenant Admin
        if first_ta and u['id']['id'] == first_ta['id']['id']:
            continue
            
        # Toggle
        thingsboard.toggle_user_credentials(token, u['id']['id'], active)
        count += 1

@router.post("/tenant/{tenant_id}/deactivate-safe")
def deactivate_safe(tenant_id: str, background_tasks: BackgroundTasks, token: str = Depends(get_tb_token), current_user: models.User = Depends(auth.require_role(["admin", "project_manager", "technical_manager"]))):
    ignore_domain = False
    background_tasks.add_task(_bulk_user_action_task, tenant_id, token, False, ignore_domain)
    return {"message": "Safe deactivation started in background"}

@router.post("/tenant/{tenant_id}/activate-safe")
def activate_safe(tenant_id: str, background_tasks: BackgroundTasks, token: str = Depends(get_tb_token), current_user: models.User = Depends(auth.require_role(["admin", "project_manager", "technical_manager"]))):
    background_tasks.add_task(_bulk_user_action_task, tenant_id, token, True)
    return {"message": "Safe activation started in background"}

@router.post("/tenant/{tenant_id}/schedule-deactivation")
def schedule_deactivation(
    tenant_id: str, 
    background_tasks: BackgroundTasks, 
    duration: int = Body(..., embed=True), 
    unit: str = Body("minutes", embed=True),
    token: str = Depends(get_tb_token), 
    current_user: models.User = Depends(auth.require_role(["admin", "project_manager", "technical_manager"]))
):
    delay_seconds = 0
    if unit.lower().startswith("s"): # seconds
        delay_seconds = duration
    elif unit.lower().startswith("m"): # minutes
        delay_seconds = duration * 60
    elif unit.lower().startswith("h"): # hours
        delay_seconds = duration * 3600
    elif unit.lower().startswith("d"): # days
        delay_seconds = duration * 86400
    else:
        delay_seconds = duration * 60 # Default to minutes

    async def delayed_task():
        await asyncio.sleep(delay_seconds)
        _bulk_user_action_task(tenant_id, token, False)
    
    background_tasks.add_task(delayed_task)
    return {"message": f"Deactivation scheduled in {duration} {unit}"}




@router.post("/user/{user_id}/toggle")
def toggle_user(user_id: str, enabled: bool = Body(..., embed=True), token: str = Depends(get_tb_token), current_user: models.User = Depends(auth.require_role(["admin", "project_manager"]))):
    success = thingsboard.toggle_user_credentials(token, user_id, enabled)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to toggle user")
    return {"status": "success"}

@router.post("/profile")
def create_profile(
    name: str = Body(..., embed=True),
    description: Optional[str] = Body(None, embed=True),
    token: str = Depends(get_tb_token),
    current_user: models.User = Depends(auth.require_role(["technical_manager"]))
):
    profile = thingsboard.create_tenant_profile(token, name, description)
    if not profile:
        raise HTTPException(status_code=400, detail="Failed to create tenant profile")
    return profile
