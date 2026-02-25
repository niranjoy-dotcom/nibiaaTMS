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
    current_user: models.User = Depends(auth.require_role(["marketing", "owner"]))
):
    # Verify technical manager exists and has correct role
    tm = db.query(models.User).filter(models.User.id == project.technical_manager_id).first()
    if not tm:
        raise HTTPException(status_code=404, detail="Technical Manager not found")
    if not any(r in tm.roles for r in ["developer", "owner", "co_owner", "admin", "co_admin"]):
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
    # Admin and Co-Admin see all projects
    if any(r in current_user.roles for r in ["owner", "co_owner", "admin", "co_admin"]):
        projects = db.query(models.Project).offset(skip).limit(limit).all()
    # Technical Managers see only projects assigned to them
    elif "developer" in current_user.roles:
        projects = db.query(models.Project).filter(models.Project.technical_manager_id == current_user.id).offset(skip).limit(limit).all()
    else:
        # For standard users, find projects linked to their assigned tenants OR their teams
        # 1. Tenant-based access
        assigned_tenants = db.query(models.UserTenant).filter(models.UserTenant.user_id == current_user.id).all()
        assigned_tenant_ids = [t.tenant_id for t in assigned_tenants]
        
        # 2. Team-based access
        user_team_ids = db.query(models.TeamMember.team_id).filter(models.TeamMember.user_id == current_user.id).all()
        user_team_ids = [t[0] for t in user_team_ids]
        
        projects = db.query(models.Project).filter(
            (models.Project.tenant_id.in_(assigned_tenant_ids)) | 
            (models.Project.team_id.in_(user_team_ids))
        ).offset(skip).limit(limit).all()
        
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
        
    # Permission Check & Task Filtering
    if not any(r in current_user.roles for r in ["owner", "co_owner", "admin", "co_admin", "marketing", "developer"]):
        # Check if user has access via Tenant or Team
        has_access = False
        is_team_member = False
        is_team_lead = False
        
        # Tenant Access
        user_tenants = [ut.tenant_id for ut in current_user.tenants]
        if project.tenant_id in user_tenants:
            has_access = True
            
        # Team Access
        if project.team_id:
            membership = db.query(models.TeamMember).filter(
                models.TeamMember.team_id == project.team_id,
                models.TeamMember.user_id == current_user.id
            ).first()
            if membership:
                has_access = True
                is_team_member = True
                if membership.role == "Lead":
                    is_team_lead = True

        if not has_access:
            raise HTTPException(status_code=403, detail="Not authorized to view this project")
            
        # Task Filtering Logic
        # If Team Member but NOT Lead, show only assigned tasks
        if is_team_member and not is_team_lead:
            # We need to filter tasks. 
            # modifying project.tasks in place is risky for session, but response_model reads from it.
            # Safe way: filter the list in memory.
            # NOTE: This effectively hides other tasks from the response.
            visible_tasks = [t for t in project.tasks if t.assigned_to_id == current_user.id]
            project.tasks = visible_tasks

    return project

@router.put("/{project_id}", response_model=schemas.Project)
def update_project(
    project_id: int,
    project_update: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "marketing"]))
):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # If updating technical manager, verify existence
    if project_update.technical_manager_id:
        tm = db.query(models.User).filter(models.User.id == project_update.technical_manager_id).first()
        if not tm:
            raise HTTPException(status_code=404, detail="Technical Manager not found")
            
    update_data = project_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project

@router.put("/{project_id}/assign/{user_id}", response_model=schemas.Project)
def assign_project(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "marketing"]))
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
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Permission Check
    allowed = False
    if any(r in current_user.roles for r in ["owner", "co_owner", "admin", "co_admin", "marketing", "developer"]):
        allowed = True
    elif db_project.team_id:
        # Check if Team Lead
        membership = db.query(models.TeamMember).filter(
            models.TeamMember.team_id == db_project.team_id,
            models.TeamMember.user_id == current_user.id,
            models.TeamMember.role == "Lead"
        ).first()
        if membership:
            allowed = True
            
    if not allowed:
        raise HTTPException(status_code=403, detail="Not authorized to create tasks for this project")
        
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
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Permission Check
    is_admin_or_manager = any(r in current_user.roles for r in ["owner", "co_owner", "admin", "co_admin", "marketing", "developer"])
    is_team_lead = False
    is_assignee = (db_task.assigned_to_id == current_user.id)
    
    if db_task.project and db_task.project.team_id:
        membership = db.query(models.TeamMember).filter(
            models.TeamMember.team_id == db_task.project.team_id,
            models.TeamMember.user_id == current_user.id,
            models.TeamMember.role == "Lead"
        ).first()
        if membership:
            is_team_lead = True
            
    if not (is_admin_or_manager or is_team_lead or is_assignee):
        raise HTTPException(status_code=403, detail="Not authorized to update this task")

    # If only assignee (strict member), ensure ONLY status is being updated (and maybe issue/comments)
    if is_assignee and not (is_admin_or_manager or is_team_lead):
        # Check if restricted fields are being updated
        update_data = task_update.dict(exclude_unset=True)
        allowed_fields = ["status", "issue"] # Maybe description/comments too? strict for now.
        for field in update_data.keys():
            if field not in allowed_fields:
                raise HTTPException(status_code=403, detail=f"Team members can only update task status. Cannot update '{field}'.")
    
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

    # Send Notification to Customer if status changed
    if task_update.status and db_task.project and db_task.project.customer_email:
        customer_email = db_task.project.customer_email
        task_title = db_task.title
        
        subject = ""
        body = ""
        
        if task_update.status == "In Progress":
            subject = f"Working on your task: {task_title}"
            body = f"""
            <h3>Task Update</h3>
            <p>We're pleased to let you know that your task <b>{task_title}</b> for project <b>{db_task.project.name}</b> is now being worked on.</p>
            <p>We appreciate your patience and will notify you as soon as it's completed.</p>
            """
        elif task_update.status == "Completed":
            subject = f"Task Completed successfully: {task_title}"
            body = f"""
            <h3>Success!</h3>
            <p>Your task <b>{task_title}</b> for project <b>{db_task.project.name}</b> has been completed.</p>
            <p>Thank you for your continued partnership.</p>
            """
            
        if subject:
            background_tasks.add_task(email_utils.send_email, [customer_email], subject, body)

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
            
            admins = db.query(models.User).filter(models.User.role.like("%owner%")).all()
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

def apply_task_template(
    project_id: int,
    template_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "co_owner", "admin", "co_admin", "marketing", "developer"]))
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    template = db.query(models.TaskTemplate).filter(models.TaskTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    new_task = models.Task(
        title=template.title,
        description=template.description,
        criticality=template.criticality,
        status="Pending",
        project_id=project.id
    )
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task
