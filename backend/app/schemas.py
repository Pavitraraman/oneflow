from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime, date
from app.models import UserRole, TaskStatus, TaskPriority

class UserBase(BaseModel):
    work_mail: EmailStr
    first_name: str
    last_name: str

class UserCreate(UserBase):
    password: str
    confirm_password: str
    role: Optional[UserRole] = UserRole.TEAM_MEMBER

class UserLogin(BaseModel):
    work_mail: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    role: UserRole
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    work_mail: Optional[str] = None

# Project Schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "Planned"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = 0
    progress: Optional[float] = 0

class ProjectCreate(ProjectBase):
    manager_id: Optional[int] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None
    progress: Optional[float] = None
    manager_id: Optional[int] = None

class ProjectResponse(ProjectBase):
    id: int
    manager_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    manager: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)

# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[TaskStatus] = TaskStatus.TODO
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    deadline: Optional[date] = None
    estimated_hours: Optional[float] = 0

class TaskCreate(TaskBase):
    project_id: int
    assignee_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    deadline: Optional[date] = None
    estimated_hours: Optional[float] = None
    project_id: Optional[int] = None
    assignee_id: Optional[int] = None

class TaskResponse(TaskBase):
    id: int
    project_id: int
    assignee_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    assignee: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)

