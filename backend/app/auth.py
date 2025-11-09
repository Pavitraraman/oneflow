import logging
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db, settings
from app.models import User
from app.schemas import TokenData

logger = logging.getLogger(__name__)

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password using bcrypt directly."""
    try:
        # Encode and truncate plain password to 72 bytes (bcrypt limit)
        plain_pwd_bytes = plain_password.encode('utf-8')[:72]
        
        # Encode hashed password to bytes if it's a string
        if isinstance(hashed_password, str):
            hashed_pwd_bytes = hashed_password.encode('utf-8')
        else:
            hashed_pwd_bytes = hashed_password
        
        # Verify password using bcrypt
        return bcrypt.checkpw(plain_pwd_bytes, hashed_pwd_bytes)
    except Exception as e:
        logger.error(f"Error verifying password: {str(e)}")
        return False

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt directly, ensuring 72-byte limit."""
    try:
        # Encode password to UTF-8
        pwd_bytes = password.encode('utf-8')
        
        # Truncate to 72 bytes (bcrypt's maximum input length)
        pwd_bytes = pwd_bytes[:72]
        
        # Generate a salt
        salt = bcrypt.gensalt()
        
        # Hash the password with the salt
        hashed = bcrypt.hashpw(pwd_bytes, salt)
        
        # Return the decoded hash as a string
        return hashed.decode('utf-8')
    except Exception as e:
        logger.error(f"Error hashing password: {str(e)}")
        raise ValueError(f"Failed to hash password: {str(e)}")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    try:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        return encoded_jwt
    except Exception as e:
        logger.error(f"Error creating access token: {str(e)}")
        raise ValueError(f"Failed to create access token: {str(e)}")

def authenticate_user(db: Session, work_mail: str, password: str):
    """Authenticate a user by email and password."""
    try:
        user = db.query(User).filter(User.work_mail == work_mail).first()
        if not user:
            logger.debug(f"User not found: {work_mail}")
            return False
        if not verify_password(password, user.hashed_password):
            logger.debug(f"Invalid password for user: {work_mail}")
            return False
        return user
    except Exception as e:
        logger.error(f"Error authenticating user: {str(e)}")
        return False

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get the current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        logger.warning("No token provided")
        raise credentials_exception
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        work_mail: str = payload.get("sub")
        if work_mail is None:
            logger.warning("Token payload missing 'sub' field")
            raise credentials_exception
        token_data = TokenData(work_mail=work_mail)
    except JWTError as e:
        logger.warning(f"JWT decode error: {str(e)}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Error decoding token: {str(e)}")
        raise credentials_exception
    
    user = db.query(User).filter(User.work_mail == token_data.work_mail).first()
    if user is None:
        logger.warning(f"User not found for token: {token_data.work_mail}")
        raise credentials_exception
    return user