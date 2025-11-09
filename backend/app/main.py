import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, projects, tasks, stats, timesheets, finance, documents, users
from app.database import engine, Base
from app.models import User, Project, Task, Timesheet, FinancialEntry, FinancialDocument  # Import models to ensure tables are created

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create database tables
logger.info("Initializing database tables...")
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Error creating database tables: {str(e)}")
    raise

app = FastAPI(title="OneFlow API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(stats.router, prefix="/stats", tags=["Stats"])
app.include_router(timesheets.router, prefix="/timesheets", tags=["Timesheets"])
app.include_router(finance.router, prefix="/finance", tags=["Finance"])
app.include_router(documents.router, prefix="/documents", tags=["Documents"])
app.include_router(users.router, prefix="/users", tags=["Users"])

@app.get("/")
def read_root():
    return {"message": "OneFlow API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}



