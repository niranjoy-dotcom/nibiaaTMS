from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: str
    role: str = "developer" # Kept for backward compatibility, stores comma-separated roles

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
    project_lead_id: Optional[int] = None
    technology_lead_id: Optional[int] = None
    team_id: Optional[int] = None # Project Team
    technical_team_id: Optional[int] = None # Technical Team

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
    assigned_to_id: Optional[int] = None
    task_type_id: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    issue: Optional[str] = None
    assigned_to_id: Optional[int] = None
    task_type_id: Optional[int] = None

class Task(TaskBase):
    id: int
    project_id: int
    created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    total_duration: int = 0
    assigned_to_id: Optional[int] = None
    assigned_to: Optional[UserBase] = None 
    # Link to task_type if needed in response, but circular imports might be tricky.
    # We'll stick to ID for now or use forward ref if needed.
    
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
    team_id: Optional[int] = None
    project_lead_id: Optional[int] = None
    technology_lead_id: Optional[int] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    technical_manager_id: Optional[int] = None
    project_manager_id: Optional[int] = None
    customer_email: Optional[str] = None
    status: Optional[str] = None
    usecase: Optional[str] = None
    plan: Optional[str] = None
    team_id: Optional[int] = None
    project_lead_id: Optional[int] = None
    technology_lead_id: Optional[int] = None
    technical_team_id: Optional[int] = None

class Project(ProjectBase):
    id: int
    created_at: Optional[datetime] = None
    team_id: Optional[int] = None
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

class UsecaseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    zoho_prefix: Optional[str] = None


# Team Type Schemas
class TeamTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    roles: Optional[str] = None

class TeamTypeCreate(TeamTypeBase):
    pass

class TeamTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    roles: Optional[str] = None

class TeamType(TeamTypeBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Task Type Schemas
class TaskTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    team_type_id: int # TaskType must belong to a TeamType

class TaskTypeCreate(TaskTypeBase):
    pass

class TaskTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    team_type_id: Optional[int] = None

class TaskType(TaskTypeBase):
    id: int
    created_at: Optional[datetime] = None
    team_type: Optional[TeamType] = None
    
    class Config:
        from_attributes = True

# Task Template Schemas
class TaskTemplateBase(BaseModel):
    title: str
    description: Optional[str] = None
    criticality: str = "Medium"
    task_type_id: Optional[int] = None

class TaskTemplateCreate(TaskTemplateBase):
    pass

class TaskTemplateUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    criticality: Optional[str] = None
    task_type_id: Optional[int] = None

class TaskTemplate(TaskTemplateBase):
    id: int
    created_at: Optional[datetime] = None
    task_type: Optional[TaskType] = None
    
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

class ZohoProductBase(BaseModel):
    product_id: str
    product_name: str
    product_code: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    created_time: Optional[str] = None
    updated_time: Optional[str] = None

class ZohoProduct(ZohoProductBase):
    id: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ZohoPlanBase(BaseModel):
    product_id: str
    product_type: Optional[str] = None
    plan_code: str
    plan_name: str
    plan_description: Optional[str] = None
    unit_price: Optional[float] = 0.0
    setup_fee: Optional[float] = 0.0
    recurring_price: Optional[float] = 0.0
    currency_code: Optional[str] = None
    interval: Optional[int] = 1
    interval_unit: Optional[str] = None
    billing_cycles: Optional[int] = -1
    trial_period: Optional[int] = 0
    status: Optional[str] = None
    created_time: Optional[str] = None
    updated_time: Optional[str] = None

class ZohoPlan(ZohoPlanBase):
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

class PlanProfileMappingUpdate(BaseModel):
    zoho_plan_keyword: Optional[str] = None
    tb_profile_name: Optional[str] = None

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

# Team Schemas
class TeamMemberBase(BaseModel):
    user_id: int
    role: str = "Member"

class TeamMemberCreate(TeamMemberBase):
    pass

class TeamMember(TeamMemberBase):
    id: int
    team_id: int
    joined_at: Optional[datetime] = None
    user: Optional[User] = None # For returning user details

    class Config:
        from_attributes = True

class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: Optional[str] = "General"

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None

class Team(TeamBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    members: List[TeamMember] = []

    class Config:
        from_attributes = True


# Widget Schemas
class WidgetBase(BaseModel):
    title: str
    metric_type: str
    custom_code: Optional[str] = None
    size: Optional[str] = "1"
    height: Optional[str] = "1" # "1" (Standard), "2" (Tall)
    icon: Optional[str] = None
    position: Optional[int] = 0

class WidgetCreate(WidgetBase):
    pass

class WidgetUpdate(BaseModel):
    title: Optional[str] = None
    metric_type: Optional[str] = None
    custom_code: Optional[str] = None
    size: Optional[str] = None
    height: Optional[str] = None
    icon: Optional[str] = None
    position: Optional[int] = None

class Widget(WidgetBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
