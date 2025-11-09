from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app.models import Project, User, UserRole
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
    # Reload with manager and financial_entries relationships
    new_project = db.query(Project).options(
        joinedload(Project.manager),
        joinedload(Project.financial_entries)
    ).filter(Project.id == new_project.id).first()
    return new_project

@router.get("/", response_model=List[ProjectResponse])
def get_projects(
    status_filter: Optional[str] = Query(None, alias="status"),
    group_by_manager: Optional[bool] = Query(False, alias="group_by_manager"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get projects with role-based access control.
    ADMIN and FINANCE: See all projects.
    PROJECT_MANAGER and TEAM_MEMBER: See only projects they manage.
    
    Optional query parameter: group_by_manager - if True, groups projects by manager name.
    """
    query = db.query(Project).options(
        joinedload(Project.manager),
        joinedload(Project.financial_entries)
    )
    
    # CRITICAL: Role-based filtering
    if current_user.role in [UserRole.ADMIN, UserRole.FINANCE]:
        # ADMIN and FINANCE can see all projects
        pass
    else:
        # PROJECT_MANAGER and TEAM_MEMBER can only see projects they manage
        query = query.filter(Project.manager_id == current_user.id)
    
    if status_filter:
        query = query.filter(Project.status == status_filter)
    
    projects = query.all()
    
    # Group by manager if requested
    if group_by_manager:
        # Return projects grouped by manager (frontend will handle display)
        # For now, we'll just return them in a structured way
        # The grouping logic is better handled on the frontend
        pass
    
    return projects

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a single project by ID with role-based access control.
    ADMIN and FINANCE: Can access any project.
    PROJECT_MANAGER and TEAM_MEMBER: Can only access projects they manage.
    """
    project = db.query(Project).options(
        joinedload(Project.manager),
        joinedload(Project.financial_entries)
    ).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # CRITICAL: Role-based access control
    if current_user.role not in [UserRole.ADMIN, UserRole.FINANCE]:
        # PROJECT_MANAGER and TEAM_MEMBER can only access projects they manage
        if project.manager_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this project"
            )
    
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a project.
    Security: Only ADMIN or the Project Manager can update a project.
    """
    project = db.query(Project).options(
        joinedload(Project.manager),
        joinedload(Project.financial_entries)
    ).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # CRITICAL: Security check - only ADMIN or Project Manager can update
    if current_user.role != UserRole.ADMIN and project.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin or the Project Manager can update this project"
        )
    
    # Update only provided fields
    update_data = project_update.model_dump(exclude_unset=True)
    
    # Verify manager exists if manager_id is being updated
    # Only ADMIN can change manager_id
    if "manager_id" in update_data and update_data["manager_id"]:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Admin can change project manager"
            )
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

