"""
Database initialization script.
Run this script to create all database tables.

NOTE: This script drops all existing tables before recreating them.
This ensures schema changes are properly applied. All data will be lost.
"""
import logging
from app.database import engine, Base
from app.models import User, Project, Task, Timesheet, FinancialEntry, FinancialDocument  # Import all models to register them

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    """Drop and recreate all database tables."""
    logger.info("Dropping existing database tables...")
    try:
        Base.metadata.drop_all(bind=engine)
        logger.info("Existing tables dropped successfully!")
    except Exception as e:
        logger.warning(f"Warning while dropping tables (may not exist): {str(e)}")
    
    logger.info("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully!")
        logger.info("Tables created: users, projects, tasks, timesheets, financial_entries, financial_documents")
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        raise

if __name__ == "__main__":
    init_db()



