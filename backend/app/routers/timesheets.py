from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models import Timesheet, Task, User, UserRole, Project
from app.schemas import TimesheetCreate, TimesheetResponse
from app.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=TimesheetResponse, status_code=status.HTTP_201_CREATED)
def create_timesheet(
    timesheet: TimesheetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new timesheet entry.
    Automatically updates the related Task's actual_hours by adding the new hours.
    """
    # Verify task exists
    task = db.query(Task).filter(Task.id == timesheet.task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Validate hours
    if timesheet.hours <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hours must be greater than 0"
        )
    
    # Create timesheet entry
    new_timesheet = Timesheet(
        task_id=timesheet.task_id,
        user_id=current_user.id,  # Use current authenticated user
        hours=timesheet.hours,
        description=timesheet.description,
        date=timesheet.date if timesheet.date else date.today()
    )
    
    db.add(new_timesheet)
    
    # CRITICAL: Update task's actual_hours by adding the new hours
    task.actual_hours = (task.actual_hours or 0) + timesheet.hours
    
    db.commit()
    db.refresh(new_timesheet)
    
    # Load relationships for response
    new_timesheet = db.query(Timesheet).options(
        joinedload(Timesheet.task),
        joinedload(Timesheet.user)
    ).filter(Timesheet.id == new_timesheet.id).first()
    
    return new_timesheet

@router.get("/", response_model=List[TimesheetResponse])
def get_timesheets(
    task_id: Optional[int] = Query(None, alias="task_id", description="Filter by task ID"),
    user_id: Optional[int] = Query(None, alias="user_id", description="Filter by user ID"),
    project_id: Optional[int] = Query(None, alias="project_id", description="Filter by project ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get timesheets with role-based visibility.
    - Admin/Finance: See all timesheets
    - Project Manager: See timesheets for projects they manage
    - Team Member: See only their own timesheet entries
    """
    query = db.query(Timesheet).options(
        joinedload(Timesheet.task).joinedload(Task.project),
        joinedload(Timesheet.user)
    )
    
    # Role-based filtering
    if current_user.role == UserRole.TEAM_MEMBER:
        # Team members can only see their own timesheets
        query = query.filter(Timesheet.user_id == current_user.id)
    elif current_user.role == UserRole.PROJECT_MANAGER:
        # Project managers can see timesheets for projects they manage
        # Need to join Task and Project to filter by manager_id
        query = query.join(Task, Timesheet.task_id == Task.id).join(
            Project, Task.project_id == Project.id
        ).filter(Project.manager_id == current_user.id)
    # ADMIN and FINANCE can see all timesheets (no additional filtering)
    
    # Apply additional filters if provided
    if task_id:
        query = query.filter(Timesheet.task_id == task_id)
    
    if user_id:
        query = query.filter(Timesheet.user_id == user_id)
    
    if project_id:
        # Filter by project_id through the task relationship
        # Only join if not already joined (for PROJECT_MANAGER case)
        if current_user.role != UserRole.PROJECT_MANAGER:
            query = query.join(Task, Timesheet.task_id == Task.id)
        query = query.filter(Task.project_id == project_id)
    
    timesheets = query.order_by(Timesheet.date.desc(), Timesheet.created_at.desc()).all()
    return timesheets

