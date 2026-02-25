from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Dict, Any, Optional
from .. import models, schemas, database, auth
import os
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/admin",
    tags=["Technical Admin"]
)

get_db = database.get_db

@router.get("/users", response_model=List[schemas.User])
def read_users(
    role: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "co_owner", "marketing"]))
):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role.like(f"%{role}%"))
    
    users = query.offset(skip).limit(limit).all()
    return users

# --- Statistics ---

@router.get("/stats/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "co_owner", "marketing", "developer"]))
):
    # Projects
    total_projects = db.query(models.Project).count()
    active_projects = db.query(models.Project).filter(models.Project.status != "Completed").count()
    completed_projects = db.query(models.Project).filter(models.Project.status == "Completed").count()
    
    # Tenants (assuming we can count Projects as proxies for tenants if Tenant model isn't local, 
    # but strictly speaking we don't have a local Tenant model synced usually. 
    # Wait, we do have a CreateTenant that talks to Thingsboard.
    # We might not have a local 'tenants' table? 
    # Let's check models.py quickly. 
    # If no local tenant model, we might use 'unique tenant_id' in projects as a proxy or just skip.)
    # Actually, let's check models.py first. Assuming we don't have a Tenant model yet, skipping Tenant count or approximating.
    # Wait, Step 842 showed 'tenant_id' in Project model.
    # Let's count unique tenant_ids in Projects as 'Active Tenants'.
    unique_tenants = db.query(models.Project.tenant_id).distinct().count()

    # Users
    total_users = db.query(models.User).count()
    
    # Teams
    total_teams = db.query(models.Team).count()

    # Payment & Provisioning Stats (from ZohoTenant)
    # Assumes models.ZohoTenant exists and has 'status' and 'is_provisioned'
    # Zoho Statuses: live, unpaid, past_due, cancelled, trial, etc.
    
    # Payment & Provisioning Stats (from ZohoTenant)
    # Join with ZohoPlan and ZohoProduct to filter by status
    # We want to exclude subscriptions where Plan or Product is NOT active.
    
    # Perform a join query to get tenants with their plan/product status
    # Note: ZohoTenant.plan_code links to ZohoPlan.plan_code
    # ZohoPlan.product_id links to ZohoProduct.product_id
    
    results = db.query(models.ZohoTenant, models.ZohoPlan, models.ZohoProduct)\
        .outerjoin(models.ZohoPlan, models.ZohoTenant.plan_code == models.ZohoPlan.plan_code)\
        .outerjoin(models.ZohoProduct, models.ZohoPlan.product_id == models.ZohoProduct.product_id)\
        .all()
        
    zoho_tenants = []
    for tenant, plan, product in results:
        # Check if Plan and Product are active (if they exist)
        # If plan/product missing, we assume active (or strictly exclude? Let's assume active to show data unless explicitly inactive)
        # User request: "If Product or plan got inactivate Dont show" -> implies strict exclusion if inactive.
        
        is_plan_active = True
        if plan and plan.status:
             if plan.status.lower() != "active":
                 is_plan_active = False
                 
        is_product_active = True
        if product and product.status:
            if product.status.lower() != "active":
                is_product_active = False
        
        if is_plan_active and is_product_active:
            zoho_tenants.append(tenant)

    total_subscriptions = len(zoho_tenants)
    provisioned_count = sum(1 for z in zoho_tenants if z.is_provisioned)
    unprovisioned_count = total_subscriptions - provisioned_count
    
    # Simple Payment Status grouping
    # Paid/Good = live, trial
    # Unpaid/Bad = unpaid, past_due
    # Cancelled = cancelled
    paid_count = sum(1 for z in zoho_tenants if z.status in ["live", "trial", "active"])
    unpaid_count = sum(1 for z in zoho_tenants if z.status in ["unpaid", "past_due", "overdue"])
    cancelled_count = sum(1 for z in zoho_tenants if z.status == "cancelled")

    return {
        "projects": {
            "total": total_projects,
            "active": active_projects,
            "completed": completed_projects
        },
        "tenants": {
            "total": unique_tenants # Approximation based on projects
        },
        "users": {
            "total": total_users
        },
        "teams": {
            "total": total_teams
        },
        "payments": {
             "paid": paid_count,
             "unpaid": unpaid_count,
             "cancelled": cancelled_count
        },
        "provisioning": {
             "total": total_subscriptions,
             "provisioned": provisioned_count,
             "unprovisioned": unprovisioned_count
        }
    }

@router.get("/stats/free-developers")
def get_free_developers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "co_owner", "marketing", "developer"]))
):
    # Get all Technical Managers/Admins
    tms = db.query(models.User).filter(
        or_(
            models.User.role.like("%technical_manager%"),
            models.User.role.like("%technical_admin%"),
            models.User.role.like("%developer%")
        )
    ).all()
    
    # Get all active projects (status != 'Completed')
    active_projects = db.query(models.Project).filter(models.Project.status != "Completed").all()
    
    # Developers assigned to active projects
    assigned_dev_ids = set()
    for p in active_projects:
        if p.technical_manager_id:
            assigned_dev_ids.add(p.technical_manager_id)
        if p.technology_lead_id:
            assigned_dev_ids.add(p.technology_lead_id)
        if p.project_lead_id:
            assigned_dev_ids.add(p.project_lead_id)
            
    # Free developers are those not in assigned_dev_ids
    free_devs = [tm for tm in tms if tm.id not in assigned_dev_ids]
    
    return {
        "total": len(tms),
        "free_count": len(free_devs),
        "free_developers": [
            {
                "id": dev.id,
                "email": dev.email,
                "role": dev.role
            } for dev in free_devs
        ]
    }

@router.get("/stats/project-assignments")
def get_project_assignment_stats(
    days: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "marketing"]))
):
    # Get all Technical Managers (checking for both technical_manager and technical_admin)
    # Removed is_active check to show stats for inactive/past employees as well
    tms = db.query(models.User).filter(
        or_(
            models.User.role.like("%technical_manager%"),
            models.User.role.like("%technical_admin%")
        )
    ).all()
    
    result = []
    for tm in tms:
        # Get projects for this TM
        query = db.query(models.Project).filter(models.Project.technical_manager_id == tm.id)
        
        # Filter by Project Manager if current user is a PM
        if current_user.role == "marketing":
            query = query.filter(models.Project.project_manager_id == current_user.id)

        if days:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            query = query.filter(models.Project.created_at >= cutoff_date)
            
        projects = query.all()
        
        # Only show TMs that have projects assigned (for both Admin and PM)
        if len(projects) == 0:
            continue

        active_count = sum(1 for p in projects if p.status != "Completed")
        completed_count = sum(1 for p in projects if p.status == "Completed")

        project_details = []
        for p in projects:
            # Calculate task stats
            tasks = db.query(models.Task).filter(models.Task.project_id == p.id).all()
            total_tasks = len(tasks)

            if p.status == "Completed":
                pending_tasks = 0
                inprogress_tasks = 0
                completed_tasks = total_tasks
            else:
                pending_tasks = sum(1 for t in tasks if t.status == "Pending")
                inprogress_tasks = sum(1 for t in tasks if t.status == "In Progress")
                completed_tasks = sum(1 for t in tasks if t.status == "Completed")

                # Auto-complete project if all tasks are done
                if total_tasks > 0 and completed_tasks == total_tasks:
                    p.status = "Completed"
                    db.commit()
                    active_count -= 1
                    completed_count += 1

            project_details.append({
                "id": p.id,
                "name": p.name,
                "created_at": p.created_at,
                "status": p.status,
                "tenant_id": p.tenant_id,
                "task_stats": {
                    "total": total_tasks,
                    "pending": pending_tasks,
                    "in_progress": inprogress_tasks,
                    "completed": completed_tasks
                }
            })
            
        result.append({
            "developer": tm.email,
            "technical_manager_id": tm.id,
            "count": len(projects),
            "active_count": active_count,
            "completed_count": completed_count,
            "projects": project_details
        })
    
    return result

# --- Task Templates ---

# --- Usecases ---

@router.post("/usecases", response_model=schemas.Usecase)
def create_usecase(
    usecase: schemas.UsecaseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "marketing"]))
):
    db_usecase = models.Usecase(**usecase.dict())
    db.add(db_usecase)
    db.commit()
    db.refresh(db_usecase)
    return db_usecase

@router.get("/usecases", response_model=List[schemas.Usecase])
def read_usecases(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    usecases = db.query(models.Usecase).offset(skip).limit(limit).all()
    return usecases

@router.delete("/usecases/{usecase_id}")
def delete_usecase(
    usecase_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner"]))
):
    usecase = db.query(models.Usecase).filter(models.Usecase.id == usecase_id).first()
    if not usecase:
        raise HTTPException(status_code=404, detail="Usecase not found")
    
    db.delete(usecase)
    db.commit()
    return {"message": "Usecase deleted successfully"}

@router.put("/usecases/{usecase_id}", response_model=schemas.Usecase)
def update_usecase(
    usecase_id: int,
    usecase_update: schemas.UsecaseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "marketing"]))
):
    db_usecase = db.query(models.Usecase).filter(models.Usecase.id == usecase_id).first()
    if not db_usecase:
        raise HTTPException(status_code=404, detail="Usecase not found")
    
    update_data = usecase_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_usecase, key, value)
    
    db.commit()
    db.refresh(db_usecase)
    return db_usecase

@router.post("/templates", response_model=schemas.TaskTemplate)
def create_template(
    template: schemas.TaskTemplateCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["developer", "owner"]))
):
    db_template = models.TaskTemplate(**template.dict())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

from sqlalchemy.orm import Session, joinedload

@router.get("/templates", response_model=List[schemas.TaskTemplate])
def read_templates(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user) # Allow PMs to read templates
):
    # PMs need to read templates to assign them
    if current_user.role not in ["developer", "marketing", "owner"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    templates = db.query(models.TaskTemplate).options(joinedload(models.TaskTemplate.task_type).joinedload(models.TaskType.team_type)).offset(skip).limit(limit).all()
    return templates

@router.delete("/templates/{template_id}")
def delete_template(
    template_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["developer", "owner"]))
):
    template = db.query(models.TaskTemplate).filter(models.TaskTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(template)
    db.commit()
    return {"message": "Template deleted"}

@router.put("/templates/{template_id}", response_model=schemas.TaskTemplate)
def update_template(
    template_id: int,
    template_update: schemas.TaskTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["developer", "owner"]))
):
    db_template = db.query(models.TaskTemplate).filter(models.TaskTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = template_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_template, key, value)
    
    db.commit()
    db.refresh(db_template)
    return db_template

# --- Plan Profile Mappings ---

@router.post("/plan-mappings", response_model=schemas.PlanProfileMapping)
def create_plan_mapping(
    mapping: schemas.PlanProfileMappingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner"]))
):
    db_mapping = models.PlanProfileMapping(**mapping.dict())
    try:
        db.add(db_mapping)
        db.commit()
        db.refresh(db_mapping)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Mapping already exists or invalid data")
    return db_mapping

@router.get("/plan-mappings", response_model=List[schemas.PlanProfileMapping])
def read_plan_mappings(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "marketing"]))
):
    mappings = db.query(models.PlanProfileMapping).offset(skip).limit(limit).all()
    return mappings

@router.delete("/plan-mappings/{mapping_id}")
def delete_plan_mapping(
    mapping_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner"]))
):
    mapping = db.query(models.PlanProfileMapping).filter(models.PlanProfileMapping.id == mapping_id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    
    db.delete(mapping)
    db.commit()
    return {"message": "Mapping deleted successfully"}

@router.put("/plan-mappings/{mapping_id}", response_model=schemas.PlanProfileMapping)
def update_plan_mapping(
    mapping_id: int,
    mapping_update: schemas.PlanProfileMappingUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner"]))
):
    db_mapping = db.query(models.PlanProfileMapping).filter(models.PlanProfileMapping.id == mapping_id).first()
    if not db_mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    
    update_data = mapping_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_mapping, key, value)
    
    try:
        db.commit()
        db.refresh(db_mapping)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Update failed, possibly duplicate mapping")
        
    return db_mapping

# --- Thingsboard Profiles ---

@router.get("/tb-profiles", response_model=List[schemas.ThingsboardProfile])
def read_tb_profiles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "marketing"]))
):
    profiles = db.query(models.ThingsboardProfile).offset(skip).limit(limit).all()
    return profiles

