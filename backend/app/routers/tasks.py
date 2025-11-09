import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.database import get_db
from app.models import Task, Project, User, TaskStatus, UserRole, task_assignments
from app.schemas import TaskCreate, TaskUpdate, TaskResponse, TaskWithProjectResponse  # All Pydantic task schemas
from app.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new task with multiple assignees"""
    # Verify project exists
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Create task data without assignee_ids
    task_data = task.model_dump(exclude={'assignee_ids'})
    new_task = Task(**task_data)
    db.add(new_task)
    db.flush()  # Flush to get task ID
    
    # Assign users to task (many-to-many)
    if task.assignee_ids:
        assignees = db.query(User).filter(User.id.in_(task.assignee_ids)).all()
        if len(assignees) != len(task.assignee_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more assignees not found"
            )
        new_task.assignees = assignees
    
    db.commit()
    db.refresh(new_task)
    
    # Reload with relationships
    new_task = db.query(Task).options(
        joinedload(Task.assignees),
        joinedload(Task.project)
    ).filter(Task.id == new_task.id).first()
    
    return new_task

@router.get("/", response_model=List[TaskResponse])
def get_tasks(
    project_id: Optional[int] = Query(None, alias="project_id"),
    include_project_name: Optional[bool] = Query(False, alias="include_project_name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get tasks, optionally filtered by project_id.
    If no project_id is provided:
    - ADMIN/FINANCE: See all tasks
    - PROJECT_MANAGER: See tasks for their projects
    - TEAM_MEMBER: See tasks they're assigned to
    
    If include_project_name is True, returns tasks with project_name field (for all tasks view).
    """
    query = db.query(Task).options(
        joinedload(Task.assignees),
        joinedload(Task.project)
    )
    
    if project_id:
        # Filter by specific project
        query = query.filter(Task.project_id == project_id)
    else:
        # No project_id - apply role-based filtering for "all tasks" view
        if current_user.role == UserRole.TEAM_MEMBER:
            # Team members see only tasks they're assigned to
            query = query.join(task_assignments).filter(task_assignments.c.user_id == current_user.id)
        elif current_user.role == UserRole.PROJECT_MANAGER:
            # Project managers see tasks for projects they manage
            from app.models import Project
            query = query.join(Project).filter(Project.manager_id == current_user.id)
        # ADMIN and FINANCE see all tasks (no additional filter)
    
    tasks = query.all()
    
    # If include_project_name is requested, convert to TaskWithProjectResponse
    if include_project_name:
        result = []
        for task in tasks:
            task_data = TaskResponse.model_validate(task).model_dump()
            task_data['project_name'] = task.project.name if task.project else None
            result.append(TaskWithProjectResponse(**task_data))
        return result
    
    return tasks

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single task by ID"""
    task = db.query(Task).options(
        joinedload(Task.assignees),
        joinedload(Task.project)
    ).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return task

@router.put("/{task_id}", response_model=TaskResponse, status_code=status.HTTP_200_OK)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a task.
    Security: TEAM_MEMBER can only request status changes (status_request),
    while ADMIN/PROJECT_MANAGER can directly update status.
    """
    task = db.query(Task).options(
        joinedload(Task.assignees),
        joinedload(Task.project)
    ).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Update only provided fields
    update_data = task_update.model_dump(exclude_unset=True, exclude={'assignee_ids'})
    
    # Verify project exists if project_id is being updated
    if "project_id" in update_data:
        project = db.query(Project).filter(Project.id == update_data["project_id"]).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
    
    # Handle assignee_ids update (many-to-many)
    if "assignee_ids" in task_update.model_dump(exclude_unset=True):
        assignee_ids = task_update.assignee_ids
        if assignee_ids is not None:
            assignees = db.query(User).filter(User.id.in_(assignee_ids)).all()
            if len(assignees) != len(assignee_ids):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="One or more assignees not found"
                )
            task.assignees = assignees
    
    # Handle status update security
    status_update_requested = False
    if "status" in update_data:
        # TEAM_MEMBER can only request status changes, not directly update
        if current_user.role == UserRole.TEAM_MEMBER:
            # Set status_request instead of status
            task.status_request = update_data["status"]
            update_data.pop("status")  # Remove status from update_data
            status_update_requested = True
        else:
            # ADMIN, PROJECT_MANAGER, FINANCE can directly update status
            old_status = task.status
            new_status = update_data["status"]
            
            # Clear status_request if it exists (approving the request)
            if task.status_request:
                task.status_request = None
            
            # Award points when status changes TO "DONE"
            if new_status == TaskStatus.DONE and old_status != TaskStatus.DONE:
                # Award 10 points to all assignees
                for assignee in task.assignees:
                    assignee.points = (assignee.points or 0) + 10
                    db.merge(assignee)
    
    # Handle status_request (only for managers/admins to approve/deny)
    if "status_request" in update_data and current_user.role != UserRole.TEAM_MEMBER:
        # Managers/Admins can clear status_request or approve it
        if update_data["status_request"] is None:
            task.status_request = None
            update_data.pop("status_request")
        # If there's a pending status_request and manager/admin sets status, approve it
        elif task.status_request and "status" in update_data:
            # Status update will be handled above, just clear the request
            task.status_request = None
    
    # Update other fields
    for field, value in update_data.items():
        if field != "status_request":  # Already handled above
            setattr(task, field, value)
    
    db.commit()
    db.refresh(task)
    
    # Reload with relationships
    task = db.query(Task).options(
        joinedload(Task.assignees),
        joinedload(Task.project)
    ).filter(Task.id == task_id).first()
    
    # For TEAM_MEMBER status requests, we'll raise a custom exception that returns 202
    if status_update_requested:
        from fastapi.responses import JSONResponse
        task_dict = TaskResponse.model_validate(task).model_dump()
        return JSONResponse(
            status_code=status.HTTP_202_ACCEPTED,
            content={
                **task_dict,
                "message": "Status change request submitted. Waiting for manager approval."
            }
        )
    
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    db.delete(task)
    db.commit()
    return None

