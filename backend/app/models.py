from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, DateTime, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="project_manager") # 'admin', 'project_manager', 'technical_manager'
    is_active = Column(Boolean, default=True)
    profile_picture = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    activation_token = Column(String, nullable=True)

    @property
    def roles(self):
        if not self.role:
            return []
        return [r.strip() for r in self.role.split(',')]

class UserTenant(Base):
    __tablename__ = "user_tenants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    tenant_id = Column(String, index=True) # ThingsBoard Tenant ID
    
    user = relationship("User", backref="tenants")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    tenant_id = Column(String, index=True) # ThingsBoard Tenant ID
    technical_manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    project_manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    customer_email = Column(String, nullable=True)
    status = Column(String, default="Active")
    usecase = Column(String, nullable=True)
    plan = Column(String, nullable=True)
    completion_percentage = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    technical_manager = relationship("User", foreign_keys=[technical_manager_id], backref="technical_projects")
    project_manager = relationship("User", foreign_keys=[project_manager_id], backref="managed_projects")

    project_lead_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    technology_lead_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    project_lead = relationship("User", foreign_keys=[project_lead_id], backref="led_projects")
    technology_lead = relationship("User", foreign_keys=[technology_lead_id], backref="tech_led_projects")
    
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    technical_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    
    team = relationship("Team", foreign_keys=[team_id], backref="projects")
    technical_team = relationship("Team", foreign_keys=[technical_team_id], backref="technical_projects_teams")
    
    tasks = relationship("Task", back_populates="project")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    status = Column(String, default="Pending") # Pending, In Progress, Completed
    criticality = Column(String, default="Medium") # Low, Medium, High
    issue = Column(Text, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    total_duration = Column(Integer, default=0) # Duration in seconds

    project = relationship("Project", back_populates="tasks")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], backref="assigned_tasks")
    comments = relationship("TaskComment", back_populates="task")
    
    task_type_id = Column(Integer, ForeignKey("task_types.id"), nullable=True)
    task_type = relationship("TaskType", backref="tasks")

class TaskComment(Base):
    __tablename__ = "task_comments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    project_name = Column(String, nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    task = relationship("Task", back_populates="comments")

class Usecase(Base):
    __tablename__ = "usecases"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    zoho_prefix = Column(String, nullable=True) # e.g., "WTS", "ETS"

class TaskTemplate(Base):
    __tablename__ = "task_templates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    criticality = Column(String, default="Medium") # Low, Medium, High
    task_type_id = Column(Integer, ForeignKey("task_types.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    task_type = relationship("TaskType")

class ZohoTenant(Base):
    __tablename__ = "zoho_tenants"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(String, unique=True, index=True)
    customer_id = Column(String, nullable=True)
    customer_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    plan_name = Column(String, nullable=True)
    plan_code = Column(String, nullable=True)
    status = Column(String, nullable=True)
    amount = Column(Float, nullable=True)
    currency_symbol = Column(String, nullable=True)
    current_term_starts_at = Column(String, nullable=True)
    current_term_ends_at = Column(String, nullable=True)
    interval = Column(Integer, nullable=True)
    interval_unit = Column(String, nullable=True)
    created_at = Column(String, nullable=True)
    is_provisioned = Column(Boolean, default=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ZohoProduct(Base):
    __tablename__ = "zoho_products"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String, unique=True, index=True)
    product_name = Column(String)
    product_code = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=True)
    created_time = Column(String, nullable=True)
    updated_time = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ZohoPlan(Base):
    __tablename__ = "zoho_plans"

    id = Column(Integer, primary_key=True, index=True)
    plan_code = Column(String, unique=True, index=True)
    product_id = Column(String, index=True)
    product_type = Column(String, nullable=True)
    plan_name = Column(String)
    plan_description = Column(Text, nullable=True)
    unit_price = Column(Float, default=0.0)
    setup_fee = Column(Float, default=0.0)
    recurring_price = Column(Float, default=0.0)
    currency_code = Column(String, default="INR")
    interval = Column(Integer, default=1)
    interval_unit = Column(String, default="months")
    billing_cycles = Column(Integer, default=-1) # -1 for auto-renew
    trial_period = Column(Integer, default=0)
    status = Column(String, default="active")
    created_time = Column(String, nullable=True)
    updated_time = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ZohoCustomer(Base):
    __tablename__ = "zoho_customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, unique=True, index=True)
    display_name = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    mobile = Column(String, nullable=True)
    currency_code = Column(String, nullable=True)
    status = Column(String, nullable=True)
    created_time = Column(String, nullable=True)
    updated_time = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class PlanProfileMapping(Base):
    __tablename__ = "plan_profile_mappings"

    id = Column(Integer, primary_key=True, index=True)
    zoho_plan_keyword = Column(String, unique=True, index=True) # e.g. "Basic", "Standard"
    tb_profile_name = Column(String) # e.g. "Basic", "Standard"

class ThingsboardProfile(Base):
    __tablename__ = "thingsboard_profiles"

    id = Column(Integer, primary_key=True, index=True)
    tb_profile_id = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, unique=True)
    description = Column(Text, nullable=True)
    type = Column(String, default="General") # General, Marketing, Technical
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String, default="Member") # Member, Lead
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    team = relationship("Team", back_populates="members")
    user = relationship("User", backref="team_memberships")

class TeamType(Base):
    __tablename__ = "team_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    roles = Column(String, nullable=True) # Comma-separated roles: "admin,project_manager"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    task_types = relationship("TaskType", back_populates="team_type", cascade="all, delete-orphan")

class TaskType(Base):
    __tablename__ = "task_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    team_type_id = Column(Integer, ForeignKey("team_types.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    team_type = relationship("TeamType", back_populates="task_types")


class Widget(Base):
    __tablename__ = "widgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    metric_type = Column(String) # e.g. "total_projects", "active_tenants", "custom"
    custom_code = Column(Text, nullable=True) # HTML/CSS/JS snippet
    size = Column(String, default="1") # "1" (1/4), "2" (1/2), "4" (Full)
    height = Column(String, default="1") # "1" (Standard), "2" (Tall)
    icon = Column(String, nullable=True) # Lucide icon name
    position = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="widgets")
