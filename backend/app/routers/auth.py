from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, BackgroundTasks, Body
from sqlalchemy import or_
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Optional
from .. import database, models, schemas, auth, thingsboard
from .zoho import sync_zoho_data
from ..email_utils import send_activation_email, send_reset_password_email
import shutil
import os
import uuid
import secrets

router = APIRouter(tags=["Authentication"])



@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    background_tasks: BackgroundTasks,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(database.get_db)
):
    # 1. Try Local Login
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    local_valid = user and auth.verify_password(form_data.password, user.hashed_password)
    
    tb_token = None
    tb_refresh_token = None
    
    if local_valid:
        # Local login successful - Use System TB Credentials
        # Nibiaa Manager users are standalone, so we use the configured TB Admin account for API access.
        tb_username = os.getenv("TB_USERNAME", "admin@nibiaa.com")
        tb_password = os.getenv("TB_PASSWORD", "122333")
        tb_data = thingsboard.tb_login(tb_username, tb_password)
        tb_token = tb_data["token"] if tb_data else None
        tb_refresh_token = tb_data["refreshToken"] if tb_data else None
    else:
        # Local login failed
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})

    # Trigger Zoho Data Sync in Background
    background_tasks.add_task(sync_zoho_data, db)

    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role, 
        "username": user.email,
        "tb_token": tb_token,
        "tb_refresh_token": tb_refresh_token
    }


@router.post("/users/", response_model=schemas.User)
async def create_user(
    user: schemas.UserCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.require_role(["owner", "co_owner", "marketing", "developer"]))
):
    # Determine roles
    roles_to_assign = []
    if user.roles:
        roles_to_assign = user.roles
    elif user.role:
        roles_to_assign = [r.strip() for r in user.role.split(',')]
    else:
        roles_to_assign = ["developer"]

    # Role Restriction
    current_roles = current_user.roles

    if "co_owner" in current_roles and "owner" in roles_to_assign:
        raise HTTPException(status_code=403, detail="Co-admin cannot create Admin users")
    
    # Project Manager Restrictions
    if "marketing" in current_roles and not any(r in ["owner", "co_owner"] for r in current_roles):
        for r in roles_to_assign:
            if r != "project_member":
                raise HTTPException(status_code=403, detail="Project Managers can only invite Project Members")

    # Technical Manager Restrictions
    if "developer" in current_roles and not any(r in ["owner", "co_owner", "marketing"] for r in current_roles):
        for r in roles_to_assign:
            if r != "technical_member":
                raise HTTPException(status_code=403, detail="Technical Managers can only invite Technical Members")

    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate Activation Token
    activation_token = secrets.token_urlsafe(32)
    
    # Create user without password initially (or a random one)
    # We set is_active=False until they activate
    db_user = models.User(
        email=user.email, 
        hashed_password="pending_activation", 
        role=",".join(roles_to_assign),
        is_active=False,
        activation_token=activation_token
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Assign Tenant if provided
    if user.tenant_id:
        user_tenant = models.UserTenant(user_id=db_user.id, tenant_id=user.tenant_id)
        db.add(user_tenant)
        db.commit()

    # Send Activation Email
    background_tasks.add_task(send_activation_email, user.email, activation_token)
    
    return db_user

@router.post("/users/assign-tenant")
def assign_tenant(
    assignment: schemas.UserTenantAssign,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "marketing"]))
):
    # Check if assignment already exists
    existing = db.query(models.UserTenant).filter(
        models.UserTenant.user_id == assignment.user_id,
        models.UserTenant.tenant_id == assignment.tenant_id
    ).first()
    
    if existing:
        return {"message": "Tenant already assigned to user"}
    
    new_assignment = models.UserTenant(user_id=assignment.user_id, tenant_id=assignment.tenant_id)
    db.add(new_assignment)
    db.commit()
    return {"message": "Tenant assigned successfully"}

@router.post("/auth/forgot-password")
async def forgot_password(
    background_tasks: BackgroundTasks,
    email: str = Body(..., embed=True), 
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        # Return success even if user not found to prevent enumeration
        return {"message": "If the email exists, a reset link has been sent."}
    
    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    db.commit()
    
    background_tasks.add_task(send_reset_password_email, email, reset_token)
    return {"message": "If the email exists, a reset link has been sent."}

@router.post("/auth/reset-password")
def reset_password(
    token: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.reset_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    user.hashed_password = auth.get_password_hash(new_password)
    user.reset_token = None
    db.commit()
    return {"message": "Password reset successfully"}

@router.post("/auth/activate")
def activate_account(
    token: str = Body(..., embed=True),
    password: str = Body(..., embed=True),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.activation_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired activation token")
    
    user.hashed_password = auth.get_password_hash(password)
    user.activation_token = None
    user.is_active = True
    db.commit()
    return {"message": "Account activated successfully"}

@router.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@router.put("/users/me", response_model=schemas.User)
def update_user_me(user_update: schemas.UserUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    if user_update.email:
        # Check if email already exists
        existing_user = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_update.email
    
    if user_update.password:
        current_user.hashed_password = auth.get_password_hash(user_update.password)
    
    if user_update.profile_picture:
        current_user.profile_picture = user_update.profile_picture

    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/users/me/avatar")
async def upload_avatar(file: UploadFile = File(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Create directory if not exists
    # backend/app/routers -> backend/static/profile_pictures
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "profile_pictures")
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Update user profile
    relative_path = f"/static/profile_pictures/{filename}"
    current_user.profile_picture = relative_path
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.put("/users/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdateAdmin,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "co_owner", "admin", "co_admin"]))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check Role-based Restrictions
    current_roles = current_user.roles
    target_roles = user.roles
    
    # Check if current user has permission to edit target user
    is_admin = "owner" in current_roles or "admin" in current_roles
    is_co_admin = "co_owner" in current_roles or "co_admin" in current_roles
    
    target_is_admin = "owner" in target_roles or "admin" in target_roles
    
    if is_co_admin and not is_admin:
        # Co-Admin cannot edit Admin users
        if target_is_admin:
            raise HTTPException(status_code=403, detail="Co-Admins cannot edit Admin users")
        
        # Co-Admin cannot promote anyone to Admin
        new_roles_check = []
        if user_update.roles:
            new_roles_check = user_update.roles
        elif user_update.role:
            new_roles_check = [r.strip() for r in user_update.role.split(',')]
            
        if "owner" in new_roles_check or "admin" in new_roles_check:
             raise HTTPException(status_code=403, detail="Co-Admins cannot promote users to Admin")

    # Handle roles update
    new_roles = None
    if user_update.roles:
        new_roles = user_update.roles
    elif user_update.role:
        new_roles = [r.strip() for r in user_update.role.split(',')]
        
    if new_roles:
        user.role = ",".join(new_roles)
    
    if user_update.email:
        existing = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing and existing.id != user_id:
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = user_update.email
        
    if user_update.password:
        user.hashed_password = auth.get_password_hash(user_update.password)
        
    if user_update.is_active is not None:
        user.is_active = user_update.is_active

    db.commit()
    db.refresh(user)
    return user

@router.get("/users/", response_model=List[schemas.User])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    role: Optional[str] = None,
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.require_role(["owner", "co_owner", "marketing", "developer"]))
):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role.contains(role))
    users = query.offset(skip).limit(limit).all()
    return users

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.require_role(["owner"]))):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}
@router.get("/notifications/count")
def get_notification_count(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    # (Same logic as before, but I'll add the detail endpoint below)
    return {"count": _get_notifications_internal(db, current_user, count_only=True)}

@router.get("/notifications")
def get_notifications(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    return _get_notifications_internal(db, current_user, count_only=False)

def _get_notifications_internal(db: Session, current_user: models.User, count_only: bool = False):
    roles = current_user.roles
    notifications = []
    
    if "owner" in roles or "co_owner" in roles:
        # 1. Unpaid Zoho Subscriptions
        unpaid_subs = db.query(models.ZohoTenant).filter(
            models.ZohoTenant.status.in_(["unpaid", "past_due", "overdue"])
        ).all()
        for sub in unpaid_subs:
            notifications.append({
                "id": f"sub_{sub.id}",
                "type": "payment",
                "title": "Payment Issue",
                "message": f"Tenant {sub.customer_name} has status: {sub.status}",
                "link": "/zoho-subscriptions",
                "severity": "high"
            })
            
        # 2. Unprovisioned Tenants
        unprovisioned = db.query(models.ZohoTenant).filter(
            models.ZohoTenant.is_provisioned == False
        ).all()
        for tenant in unprovisioned:
            notifications.append({
                "id": f"prov_{tenant.id}",
                "type": "provisioning",
                "title": "Provisioning Pending",
                "message": f"New tenant {tenant.customer_name} needs provisioning.",
                "link": "/tenants",
                "severity": "medium"
            })
    else:
        # Manager/Member Level
        project_ids = [r[0] for r in db.query(models.Project.id).filter(
            or_(
                models.Project.project_manager_id == current_user.id,
                models.Project.technical_manager_id == current_user.id,
                models.Project.project_lead_id == current_user.id,
                models.Project.technology_lead_id == current_user.id
            )
        ).all()]
        
        pending_tasks = db.query(models.Task).filter(
            models.Task.status == "Pending",
            or_(
                models.Task.project_id.in_(project_ids) if project_ids else False,
                models.Task.assigned_to_id == current_user.id
            )
        ).all()
        
        for task in pending_tasks:
            notifications.append({
                "id": f"task_{task.id}",
                "type": "task",
                "title": "Pending Task",
                "message": f"Task '{task.title}' is pending.",
                "link": f"/projects/{task.project_id}",
                "severity": task.criticality.lower() if task.criticality else "medium"
            })
            
    if count_only:
        return len(notifications)
    return notifications
