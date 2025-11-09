from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, UserRole
from app.schemas import UserResponse
from app.auth import get_current_user

router = APIRouter()

@router.get("/list_all", response_model=List[UserResponse])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a list of all users.
    CRITICAL: Only accessible by users with ADMIN role.
    Returns first_name, last_name, work_mail, and role for each user.
    """
    # CRITICAL: Restrict access to ADMIN only
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access this endpoint"
        )
    
    # Get all users
    users = db.query(User).all()
    return users


