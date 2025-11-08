"""
Database initialization script.
Run this script to create all database tables.

NOTE: If you encounter schema mismatch errors, delete app.db (or your database)
and re-run this script to recreate tables with the correct schema.
"""
import logging
from app.database import engine, Base
from app.models import User, Project, Task  # Import all models to register them

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    """Create all database tables."""
    logger.info("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully!")
        logger.info("Tables created: users, projects, tasks")
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        logger.error("If you see schema mismatch errors, delete app.db and re-run this script")
        raise

if __name__ == "__main__":
    init_db()



