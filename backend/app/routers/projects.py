from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database, auth, email_utils

router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)

get_db = database.get_db

@router.post("/", response_model=schemas.Project)
def create_project(
    project: schemas.ProjectCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["project_manager", "admin"]))
):
    # Verify technical manager exists and has correct role
    tm = db.query(models.User).filter(models.User.id == project.technical_manager_id).first()
    if not tm:
        raise HTTPException(status_code=404, detail="Technical Manager not found")
    if tm.role != "technical_manager" and tm.role != "admin": # Allow assigning to admin too? Maybe just TM.
        raise HTTPException(status_code=400, detail="Assigned user is not a Technical Manager")

    db_project = models.Project(**project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/", response_model=List[schemas.Project])
def read_projects(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    # Admin sees all projects
    if current_user.role == "admin":
        projects = db.query(models.Project).offset(skip).limit(limit).all()
    # Technical Managers see only projects assigned to them
    elif current_user.role == "technical_manager":
        projects = db.query(models.Project).filter(models.Project.technical_manager_id == current_user.id).offset(skip).limit(limit).all()
    else:
        # For standard users and project managers, find projects linked to their assigned tenants
        assigned_tenants = db.query(models.UserTenant).filter(models.UserTenant.user_id == current_user.id).all()
        assigned_tenant_ids = [t.tenant_id for t in assigned_tenants]
        projects = db.query(models.Project).filter(models.Project.tenant_id.in_(assigned_tenant_ids)).offset(skip).limit(limit).all()
        
    return projects

@router.get("/{project_id}", response_model=schemas.Project)
def read_project(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{project_id}/assign/{user_id}", response_model=schemas.Project)
def assign_project(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "project_manager"]))
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    project.technical_manager_id = user.id
    db.commit()
    db.refresh(project)
    return project
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/{project_id}/tasks/", response_model=schemas.Task)
def create_task_for_project(
    project_id: int, 
    task: schemas.TaskCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["project_manager", "technical_manager", "admin"]))
):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    db_task = models.Task(**task.dict(), project_id=project_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.put("/tasks/{task_id}", response_model=schemas.Task)
def update_task(
    task_id: int, 
    task_update: schemas.TaskUpdate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["technical_manager", "admin"]))
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check for status change and enforce forward-only movement
    if task_update.status:
        old_status = db_task.status
        new_status = task_update.status
        
        # Define allowed transitions
        allowed = False
        if old_status == "Pending" and new_status == "In Progress":
            allowed = True
        elif old_status == "In Progress" and new_status == "Completed":
            allowed = True
        elif old_status == new_status:
            allowed = True
            
        if not allowed:
            # Log the invalid attempt
            project_name = db_task.project.name if db_task.project else "Unknown"
            comment_text = f"Invalid status change attempted from '{old_status}' to '{new_status}'."
            
            new_comment = models.TaskComment(
                task_id=task_id,
                project_name=project_name,
                comment=comment_text
            )
            db.add(new_comment)
            db.commit()
            
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status transition. Cannot move from {old_status} to {new_status}."
            )

    update_data = task_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    db.commit()

    # Check for Project Completion
    project = db_task.project
    if project:
        all_tasks = db.query(models.Task).filter(models.Task.project_id == project.id).all()
        if all_tasks and all(t.status == "Completed" for t in all_tasks):
            # Project is complete!
            # 1. Update Project Status if needed
            if project.status != "Completed":
                project.status = "Completed"
                project.completion_percentage = 100
                db.commit()
            
            # 2. Notify PM and Admins
            recipients = []
            if project.project_manager and project.project_manager.email:
                recipients.append(project.project_manager.email)
            
            admins = db.query(models.User).filter(models.User.role == "admin").all()
            for admin in admins:
                if admin.email and admin.email not in recipients:
                    recipients.append(admin.email)
            
            if recipients:
                subject = f"Project Completed: {project.name}"
                body = f"""
                <h1>Project Completed</h1>
                <p>The project <b>{project.name}</b> has been completed.</p>
                <p>All tasks have been marked as Completed.</p>
                <p>Technical Manager: {project.technical_manager.email if project.technical_manager else 'N/A'}</p>
                """
                background_tasks.add_task(email_utils.send_email, recipients, subject, body)

    db.refresh(db_task)
    return db_task
