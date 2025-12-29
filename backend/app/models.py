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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    total_duration = Column(Integer, default=0) # Duration in seconds

    project = relationship("Project", back_populates="tasks")
    comments = relationship("TaskComment", back_populates="task")

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
    created_at = Column(DateTime(timezone=True), server_default=func.now())

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

