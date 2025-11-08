from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app.models import Project, User
from app.schemas import ProjectCreate, ProjectUpdate, ProjectResponse
from app.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new project"""
    # If manager_id is provided, verify the user exists
    manager_id = project.manager_id
    if manager_id:
        manager = db.query(User).filter(User.id == manager_id).first()
        if not manager:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Manager not found"
            )
    else:
        # If no manager_id provided, set current user as manager
        manager_id = current_user.id
    
    project_data = project.model_dump()
    project_data["manager_id"] = manager_id
    new_project = Project(**project_data)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    # Reload with manager relationship
    new_project = db.query(Project).options(joinedload(Project.manager)).filter(Project.id == new_project.id).first()
    return new_project

@router.get("/", response_model=List[ProjectResponse])
def get_projects(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all projects, optionally filtered by status"""
    query = db.query(Project).options(joinedload(Project.manager))
    
    if status_filter:
        query = query.filter(Project.status == status_filter)
    
    projects = query.all()
    return projects

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single project by ID"""
    project = db.query(Project).options(joinedload(Project.manager)).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a project"""
    project = db.query(Project).options(joinedload(Project.manager)).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Update only provided fields
    update_data = project_update.model_dump(exclude_unset=True)
    
    # Verify manager exists if manager_id is being updated
    if "manager_id" in update_data and update_data["manager_id"]:
        manager = db.query(User).filter(User.id == update_data["manager_id"]).first()
        if not manager:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Manager not found"
            )
    
    for field, value in update_data.items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    db.delete(project)
    db.commit()
    return None

