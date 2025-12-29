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

# --- Statistics ---

@router.get("/stats/project-assignments")
def get_project_assignment_stats(
    days: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "project_manager"]))
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
        if current_user.role == "project_manager":
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
            "technical_manager": tm.email,
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
    current_user: models.User = Depends(auth.require_role(["admin", "project_manager"]))
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
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    usecase = db.query(models.Usecase).filter(models.Usecase.id == usecase_id).first()
    if not usecase:
        raise HTTPException(status_code=404, detail="Usecase not found")
    
    db.delete(usecase)
    db.commit()
    return {"message": "Usecase deleted successfully"}

@router.post("/templates", response_model=schemas.TaskTemplate)
def create_template(
    template: schemas.TaskTemplateCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["technical_manager", "admin"]))
):
    db_template = models.TaskTemplate(**template.dict())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.get("/templates", response_model=List[schemas.TaskTemplate])
def read_templates(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user) # Allow PMs to read templates
):
    # PMs need to read templates to assign them
    if current_user.role not in ["technical_manager", "project_manager", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    templates = db.query(models.TaskTemplate).offset(skip).limit(limit).all()
    return templates

@router.delete("/templates/{template_id}")
def delete_template(
    template_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["technical_manager", "admin"]))
):
    template = db.query(models.TaskTemplate).filter(models.TaskTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(template)
    db.commit()
    return {"message": "Template deleted"}

# --- Plan Profile Mappings ---

@router.post("/plan-mappings", response_model=schemas.PlanProfileMapping)
def create_plan_mapping(
    mapping: schemas.PlanProfileMappingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
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
    current_user: models.User = Depends(auth.require_role(["admin", "project_manager"]))
):
    mappings = db.query(models.PlanProfileMapping).offset(skip).limit(limit).all()
    return mappings

@router.delete("/plan-mappings/{mapping_id}")
def delete_plan_mapping(
    mapping_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    mapping = db.query(models.PlanProfileMapping).filter(models.PlanProfileMapping.id == mapping_id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    
    db.delete(mapping)
    db.commit()
    return {"message": "Mapping deleted successfully"}

# --- Thingsboard Profiles ---

@router.get("/tb-profiles", response_model=List[schemas.ThingsboardProfile])
def read_tb_profiles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "project_manager"]))
):
    profiles = db.query(models.ThingsboardProfile).offset(skip).limit(limit).all()
    return profiles

