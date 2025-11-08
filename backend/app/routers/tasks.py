from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app.models import Task, Project, User
from app.schemas import TaskCreate, TaskUpdate, TaskResponse
from app.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new task"""
    # Verify project exists
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify assignee exists if provided
    if task.assignee_id:
        assignee = db.query(User).filter(User.id == task.assignee_id).first()
        if not assignee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignee not found"
            )
    
    new_task = Task(**task.model_dump())
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    # Reload with relationships
    new_task = db.query(Task).options(
        joinedload(Task.assignee),
        joinedload(Task.project)
    ).filter(Task.id == new_task.id).first()
    
    return new_task

@router.get("/", response_model=List[TaskResponse])
def get_tasks(
    project_id: Optional[int] = Query(None, alias="project_id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all tasks, optionally filtered by project_id"""
    query = db.query(Task).options(
        joinedload(Task.assignee),
        joinedload(Task.project)
    )
    
    if project_id:
        query = query.filter(Task.project_id == project_id)
    
    tasks = query.all()
    return tasks

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single task by ID"""
    task = db.query(Task).options(
        joinedload(Task.assignee),
        joinedload(Task.project)
    ).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return task

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a task"""
    task = db.query(Task).options(
        joinedload(Task.assignee),
        joinedload(Task.project)
    ).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Update only provided fields
    update_data = task_update.model_dump(exclude_unset=True)
    
    # Verify project exists if project_id is being updated
    if "project_id" in update_data:
        project = db.query(Project).filter(Project.id == update_data["project_id"]).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
    
    # Verify assignee exists if assignee_id is being updated
    if "assignee_id" in update_data and update_data["assignee_id"]:
        assignee = db.query(User).filter(User.id == update_data["assignee_id"]).first()
        if not assignee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignee not found"
            )
    
    for field, value in update_data.items():
        setattr(task, field, value)
    
    db.commit()
    db.refresh(task)
    
    # Reload with relationships
    task = db.query(Task).options(
        joinedload(Task.assignee),
        joinedload(Task.project)
    ).filter(Task.id == task_id).first()
    
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

