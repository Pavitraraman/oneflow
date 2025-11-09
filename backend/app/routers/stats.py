from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict
from app.database import get_db
from app.models import Project, Task, User, Timesheet, UserRole
from app.auth import get_current_user

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get aggregated dashboard statistics.
    Returns project and task counts grouped by status and priority.
    CRITICAL: Respects user access level - ADMIN/FINANCE see all projects;
    PROJECT_MANAGER/TEAM_MEMBER see only managed projects.
    """
    # CRITICAL: Role-based project filtering
    base_project_query = db.query(Project)
    if current_user.role not in [UserRole.ADMIN, UserRole.FINANCE]:
        # PROJECT_MANAGER and TEAM_MEMBER can only see projects they manage
        base_project_query = base_project_query.filter(Project.manager_id == current_user.id)
    
    # Total projects count (filtered by role)
    total_projects = base_project_query.count()
    
    # Projects by status (filtered by role) - create new query to avoid reuse issues
    projects_by_status_query = db.query(Project)
    if current_user.role not in [UserRole.ADMIN, UserRole.FINANCE]:
        projects_by_status_query = projects_by_status_query.filter(Project.manager_id == current_user.id)
    
    projects_by_status_result = projects_by_status_query.with_entities(
        Project.status,
        func.count(Project.id).label('count')
    ).group_by(Project.status).all()
    
    projects_by_status = {status: count for status, count in projects_by_status_result}
    
    # Total tasks count
    total_tasks = db.query(func.count(Task.id)).scalar() or 0
    
    # Tasks by status
    tasks_by_status_query = db.query(
        Task.status,
        func.count(Task.id).label('count')
    ).group_by(Task.status).all()
    
    # Convert enum to string value (TaskStatus is a str enum)
    tasks_by_status = {str(status.value): count for status, count in tasks_by_status_query}
    
    # Tasks by priority
    tasks_by_priority_query = db.query(
        Task.priority,
        func.count(Task.id).label('count')
    ).group_by(Task.priority).all()
    
    # Convert enum to string value (TaskPriority is a str enum)
    tasks_by_priority = {str(priority.value): count for priority, count in tasks_by_priority_query}
    
    # CRITICAL: Total hours logged from all timesheets
    total_hours_logged = db.query(func.sum(Timesheet.hours)).scalar() or 0.0
    
    return {
        "total_projects": total_projects,
        "projects_by_status": projects_by_status,
        "total_tasks": total_tasks,
        "tasks_by_status": tasks_by_status,
        "tasks_by_priority": tasks_by_priority,
        "total_hours_logged": float(total_hours_logged),
    }

