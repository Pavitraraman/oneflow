import logging
import traceback
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, settings
from app.models import User, UserRole
from app.schemas import UserCreate, UserResponse, Token, UserLogin
from app.auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_current_user
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user account.
    Returns UserResponse with 201 status code on success.
    """
    try:
        logger.info(f"Signup attempt for email: {user_data.work_mail}")
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.work_mail == user_data.work_mail).first()
        if existing_user:
            logger.warning(f"Email already registered: {user_data.work_mail}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Validate password confirmation
        if user_data.password != user_data.confirm_password:
            logger.warning("Password confirmation mismatch")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match"
            )
        
        # Validate password strength (basic validation)
        if len(user_data.password) < 8:
            logger.warning("Password too short")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long"
            )
        
        # Validate and set role
        role = user_data.role if user_data.role else UserRole.TEAM_MEMBER
        logger.debug(f"Creating user with role: {role}")
        
        # Create new user
        # The actual fix for the 72-byte limit is inside this get_password_hash function
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            work_mail=user_data.work_mail,
            hashed_password=hashed_password,
            role=role
        )
        
        # Add and commit to database
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"User created successfully: {new_user.id}")
        
        # Convert SQLAlchemy model to Pydantic schema explicitly
        user_response = UserResponse.model_validate(new_user)
        return user_response
        
    except HTTPException:
        # Re-raise HTTP exceptions (they're intentional)
        raise
    except Exception as e:
        # Log the full traceback for debugging
        logger.error(f"Unexpected error during signup: {str(e)}")
        traceback.print_exc()
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    try:
        logger.info(f"Login attempt for email: {user_credentials.work_mail}")
        user = authenticate_user(db, user_credentials.work_mail, user_credentials.password)
        if not user:
            logger.warning(f"Login failed for email: {user_credentials.work_mail}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": user.work_mail}, expires_delta=access_token_expires
        )
        logger.info(f"Login successful for user: {user.work_mail}")
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during login: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to authenticate user"
        )

@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    try:
        # Convert SQLAlchemy model to Pydantic schema explicitly
        user_response = UserResponse.model_validate(current_user)
        return user_response
    except Exception as e:
        logger.error(f"Error serializing user profile: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user profile"
        )