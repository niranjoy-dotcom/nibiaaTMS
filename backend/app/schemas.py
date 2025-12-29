from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: str
    role: str = "user" # Kept for backward compatibility, stores comma-separated roles

class UserCreate(UserBase):
    tenant_id: Optional[str] = None
    roles: Optional[List[str]] = None # New field for multiple roles

class UserTenantAssign(BaseModel):
    user_id: int
    tenant_id: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    profile_picture: Optional[str] = None

class UserUpdateAdmin(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    roles: Optional[List[str]] = None
    is_active: Optional[bool] = None


class UserTenant(BaseModel):
    tenant_id: str
    
    class Config:
        from_attributes = True

class ProjectSummary(BaseModel):
    id: int
    name: str
    tenant_id: str
    
    class Config:
        from_attributes = True

class User(UserBase):
    id: int
    is_active: bool
    profile_picture: Optional[str] = None
    tenants: List[UserTenant] = []
    projects: List[ProjectSummary] = []

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    tb_token: Optional[str] = None
    tb_refresh_token: Optional[str] = None


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# ThingsBoard Schemas
class TenantCreate(BaseModel):
    title: str
    profile_id: Optional[str] = None
    use_case: Optional[str] = None
    admin_email: Optional[str] = None
    customer_email: Optional[str] = None
    first_name: str
    last_name: str
    technical_manager_id: int
    project_manager_id: Optional[int] = None
    assigned_user_id: Optional[int] = None
    task_template_ids: Optional[List[int]] = []
    zoho_tenant_id: Optional[int] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class TBUserCreate(BaseModel):
    email: str
    firstName: str
    lastName: str
    authority: str  # TENANT_ADMIN, TENANT_USER, CUSTOMER_ADMIN, CUSTOMER_USER
    tenantId: Optional[str] = None
    customerId: Optional[str] = None

# Project Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "Pending"
    criticality: str = "Medium"
    issue: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    issue: Optional[str] = None

class Task(TaskBase):
    id: int
    project_id: int
    created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    total_duration: int = 0
    # created_at is datetime in model, pydantic handles it if type is datetime or compatible
    
    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    tenant_id: str
    technical_manager_id: Optional[int] = None
    project_manager_id: Optional[int] = None
    customer_email: Optional[str] = None
    status: str = "Active"
    usecase: Optional[str] = None
    plan: Optional[str] = None
    completion_percentage: Optional[int] = 0

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    created_at: Optional[datetime] = None
    tasks: List[Task] = []

    class Config:
        from_attributes = True

# Usecase Schemas
class UsecaseBase(BaseModel):
    name: str
    description: Optional[str] = None
    zoho_prefix: Optional[str] = None

class UsecaseCreate(UsecaseBase):
    pass

class Usecase(UsecaseBase):
    id: int

    class Config:
        from_attributes = True

# Task Template Schemas
class TaskTemplateBase(BaseModel):
    title: str
    description: Optional[str] = None
    criticality: str = "Medium"

class TaskTemplateCreate(TaskTemplateBase):
    pass

class TaskTemplate(TaskTemplateBase):
    id: int
    
    class Config:
        from_attributes = True

# Env Schema
class EnvVar(BaseModel):
    key: str
    value: str

class EnvUpdate(BaseModel):
    variables: List[EnvVar]

class ZohoTenantBase(BaseModel):
    subscription_id: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    email: Optional[str] = None
    plan_name: Optional[str] = None
    plan_code: Optional[str] = None
    status: Optional[str] = None
    amount: Optional[float] = None
    currency_symbol: Optional[str] = None
    current_term_starts_at: Optional[str] = None
    current_term_ends_at: Optional[str] = None
    interval: Optional[int] = None
    interval_unit: Optional[str] = None
    created_at: Optional[str] = None
    is_provisioned: bool = False

class ZohoTenant(ZohoTenantBase):
    id: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PlanProfileMappingBase(BaseModel):
    zoho_plan_keyword: str
    tb_profile_name: str

class PlanProfileMappingCreate(PlanProfileMappingBase):
    pass

class PlanProfileMapping(PlanProfileMappingBase):
    id: int

    class Config:
        from_attributes = True

class ThingsboardProfileBase(BaseModel):
    tb_profile_id: str
    name: str
    description: Optional[str] = None
    is_default: bool = False

class ThingsboardProfileCreate(ThingsboardProfileBase):
    pass

class ThingsboardProfile(ThingsboardProfileBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
