from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum, Text, Date, Float, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

# Many-to-Many relationship table for Task Assignments
task_assignments = Table(
    'task_assignments',
    Base.metadata,
    Column('task_id', Integer, ForeignKey('tasks.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True)
)

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    PROJECT_MANAGER = "PROJECT_MANAGER"
    TEAM_MEMBER = "TEAM_MEMBER"
    FINANCE = "FINANCE"

class TaskStatus(str, enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    IN_REVIEW = "IN_REVIEW"
    DONE = "DONE"

class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class FinancialEntryType(str, enum.Enum):
    REVENUE = "REVENUE"
    COST = "COST"

class DocumentType(str, enum.Enum):
    SALES_ORDER = "SALES_ORDER"
    PURCHASE_ORDER = "PURCHASE_ORDER"
    CUSTOMER_INVOICE = "CUSTOMER_INVOICE"
    VENDOR_BILL = "VENDOR_BILL"
    EXPENSE = "EXPENSE"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    work_mail = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.TEAM_MEMBER)
    points = Column(Integer, default=0)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Reporting manager (for projects)
    reports_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Manager hierarchy (who they report to)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    managed_projects = relationship("Project", back_populates="manager", foreign_keys="Project.manager_id")
    assigned_tasks = relationship("Task", secondary=task_assignments, back_populates="assignees")
    timesheets = relationship("Timesheet", back_populates="user")
    financial_documents = relationship("FinancialDocument", back_populates="created_by", foreign_keys="FinancialDocument.created_by_id")
    # Reporting structure
    manager = relationship("User", remote_side=[id], foreign_keys=[manager_id], backref="direct_reports")
    reports_to = relationship("User", remote_side=[id], foreign_keys=[reports_to_id], backref="team_members")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="Planned")
    start_date = Column(Date)
    end_date = Column(Date)
    budget = Column(Float, default=0)
    progress = Column(Float, default=0)
    estimated_revenue = Column(Float, default=0)
    actual_revenue = Column(Float, default=0)
    actual_cost = Column(Float, default=0)
    profit = Column(Float, default=0)
    manager_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    manager = relationship("User", back_populates="managed_projects", foreign_keys=[manager_id])
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    financial_entries = relationship("FinancialEntry", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("FinancialDocument", back_populates="project", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(SQLEnum(TaskStatus), nullable=False, default=TaskStatus.TODO)
    priority = Column(SQLEnum(TaskPriority), nullable=False, default=TaskPriority.MEDIUM)
    deadline = Column(Date)
    estimated_hours = Column(Float, default=0)
    actual_hours = Column(Float, default=0)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    status_request = Column(SQLEnum(TaskStatus), nullable=True)  # Status change request from team members
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignees = relationship("User", secondary=task_assignments, back_populates="assigned_tasks")
    timesheets = relationship("Timesheet", back_populates="task", cascade="all, delete-orphan")

class Timesheet(Base):
    __tablename__ = "timesheets"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    hours = Column(Float, nullable=False)
    description = Column(Text)
    date = Column(Date, server_default=func.current_date(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    task = relationship("Task", back_populates="timesheets")
    user = relationship("User", back_populates="timesheets")

class FinancialEntry(Base):
    __tablename__ = "financial_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_type = Column(SQLEnum(FinancialEntryType), nullable=False)
    description = Column(Text)
    amount = Column(Float, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    entry_date = Column(Date, server_default=func.current_date())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="financial_entries")

class FinancialDocument(Base):
    __tablename__ = "financial_documents"

    id = Column(Integer, primary_key=True, index=True)
    doc_type = Column(SQLEnum(DocumentType), nullable=False)
    partner_name = Column(String, nullable=False)
    document_number = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    state = Column(String, default="Draft")
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="documents")
    created_by = relationship("User", back_populates="financial_documents", foreign_keys=[created_by_id])