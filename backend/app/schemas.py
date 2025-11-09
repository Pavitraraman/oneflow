"""
Complete Pydantic V2 schemas for OneFlow API.
All schemas are defined in dependency order to avoid forward reference issues.
"""
from pydantic import BaseModel, EmailStr, ConfigDict, field_serializer
from typing import Optional, List
from datetime import datetime, date as dt_date
from app.models import UserRole, FinancialEntryType, TaskStatus, TaskPriority, DocumentType

# ============================================================================
# USER SCHEMAS
# ============================================================================

class UserBase(BaseModel):
    work_mail: EmailStr
    first_name: str
    last_name: str

class UserCreate(UserBase):
    password: str
    confirm_password: str
    role: Optional[UserRole] = UserRole.TEAM_MEMBER
    manager_id: Optional[int] = None

class UserLogin(BaseModel):
    work_mail: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    role: UserRole
    points: Optional[int] = 0
    manager_id: Optional[int] = None
    reports_to_id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    work_mail: Optional[str] = None

# ============================================================================
# PROJECT SCHEMAS
# ============================================================================

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "Planned"
    start_date: Optional[dt_date] = None
    end_date: Optional[dt_date] = None
    budget: Optional[float] = 0
    progress: Optional[float] = 0
    estimated_revenue: Optional[float] = 0
    actual_revenue: Optional[float] = 0
    actual_cost: Optional[float] = 0
    profit: Optional[float] = 0

class ProjectCreate(ProjectBase):
    manager_id: Optional[int] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[dt_date] = None
    end_date: Optional[dt_date] = None
    budget: Optional[float] = None
    progress: Optional[float] = None
    estimated_revenue: Optional[float] = None
    actual_revenue: Optional[float] = None
    actual_cost: Optional[float] = None
    profit: Optional[float] = None
    manager_id: Optional[int] = None

class ProjectResponse(ProjectBase):
    id: int
    manager_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    manager: Optional[UserResponse] = None
    financial_entries: List["FinancialEntryResponse"] = []

    model_config = ConfigDict(from_attributes=True)

# ============================================================================
# TASK SCHEMAS
# ============================================================================

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[TaskStatus] = TaskStatus.TODO
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    deadline: Optional[dt_date] = None
    estimated_hours: Optional[float] = 0
    actual_hours: Optional[float] = 0

class TaskCreate(TaskBase):
    project_id: int
    assignee_ids: Optional[List[int]] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    deadline: Optional[dt_date] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    project_id: Optional[int] = None
    assignee_ids: Optional[List[int]] = None
    status_request: Optional[TaskStatus] = None

# Minimal Task Schema for nested responses (e.g., in TimesheetResponse)
class TaskSimple(BaseModel):
    id: int
    title: str
    model_config = ConfigDict(from_attributes=True)

class TaskResponse(TaskBase):
    id: int
    project_id: int
    status_request: Optional[TaskStatus] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    assignees: Optional[List[UserResponse]] = []
    project: Optional["ProjectResponse"] = None

    model_config = ConfigDict(from_attributes=True)

# Task response with project name for all_tasks endpoint
class TaskWithProjectResponse(TaskResponse):
    project_name: Optional[str] = None

# ============================================================================
# TIMESHEET SCHEMAS
# ============================================================================

class TimesheetBase(BaseModel):
    hours: float
    description: Optional[str] = None
    date: Optional[dt_date] = None

class TimesheetCreate(TimesheetBase):
    task_id: int

class TimesheetResponse(TimesheetBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: UserResponse
    task: Optional[TaskSimple] = None

    @field_serializer('date', when_used='json')
    def serialize_date(self, value: Optional[dt_date]) -> Optional[str]:
        """Serialize date to ISO format string for JSON response."""
        return value.isoformat() if value else None

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={dt_date: lambda v: v.isoformat() if v else None},
    )

# ============================================================================
# FINANCIAL ENTRY SCHEMAS
# ============================================================================

class FinancialEntryCreate(BaseModel):
    entry_type: FinancialEntryType
    amount: float
    description: Optional[str] = None
    project_id: int
    entry_date: Optional[dt_date] = None

class FinancialEntryResponse(BaseModel):
    id: int
    entry_type: FinancialEntryType
    description: Optional[str] = None
    amount: float
    project_id: int
    entry_date: Optional[dt_date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_serializer('entry_date', when_used='json')
    def serialize_entry_date(self, value: Optional[dt_date]) -> Optional[str]:
        """Serialize date to ISO format string for JSON response."""
        return value.isoformat() if value else None

    model_config = ConfigDict(from_attributes=True)

# ============================================================================
# FINANCIAL DOCUMENT SCHEMAS
# ============================================================================

class FinancialDocumentCreate(BaseModel):
    doc_type: DocumentType
    partner_name: str
    document_number: str
    amount: float
    state: Optional[str] = "Draft"
    project_id: Optional[int] = None

class FinancialDocumentResponse(BaseModel):
    id: int
    doc_type: DocumentType
    partner_name: str
    document_number: str
    amount: float
    state: str
    project_id: Optional[int] = None
    created_by_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    project: Optional["ProjectResponse"] = None
    created_by: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)
