from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, BackgroundTasks, Body
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Optional
from .. import database, models, schemas, auth, thingsboard
from ..email_utils import send_activation_email, send_reset_password_email
import shutil
import os
import uuid
import secrets

router = APIRouter(tags=["Authentication"])



@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
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
    current_user: models.User = Depends(auth.require_role(["admin", "co_admin", "project_manager", "technical_manager"]))
):
    # Determine roles
    roles_to_assign = []
    if user.roles:
        roles_to_assign = user.roles
    elif user.role:
        roles_to_assign = [r.strip() for r in user.role.split(',')]
    else:
        roles_to_assign = ["user"]

    # Role Restriction
    if "co_admin" in current_user.roles and "admin" in roles_to_assign:
        raise HTTPException(status_code=403, detail="Co-admin cannot create Admin users")
    
    if not any(r in ["admin", "co_admin"] for r in current_user.roles):
         # Example restriction: PMs can create TMs? Or just remove this check if logic is undefined.
         # For now, let's assume only Admin/Co-admin can create non-standard roles
         pass

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
    current_user: models.User = Depends(auth.require_role(["admin", "project_manager"]))
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
    current_user: models.User = Depends(auth.require_role(["admin", "co_admin"]))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Handle roles update
    new_roles = None
    if user_update.roles:
        new_roles = user_update.roles
    elif user_update.role:
        new_roles = [r.strip() for r in user_update.role.split(',')]
        
    if new_roles:
        if "co_admin" in current_user.roles and "admin" in new_roles:
            raise HTTPException(status_code=403, detail="Co-admin cannot assign Admin role")
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
    current_user: models.User = Depends(auth.require_role(["admin", "co_admin", "project_manager", "technical_manager"]))
):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role.contains(role))
    users = query.offset(skip).limit(limit).all()
    return users

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.require_role(["admin", "co_admin"]))):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    if "admin" in user.roles and "co_admin" in current_user.roles:
        raise HTTPException(status_code=403, detail="Co-admin cannot delete Admin users")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}
