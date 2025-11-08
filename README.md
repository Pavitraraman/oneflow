# OneFlow

A project management and business operations system with authentication and role-based access control.

## Project Structure

```
oneflow/
├── backend/          # FastAPI backend
├── frontend/         # React frontend
└── README.md         # This file
```

## Phase 1: Setup & Authentication ✅

This phase includes:
- FastAPI backend with JWT authentication
- PostgreSQL/SQLite database with SQLAlchemy
- User roles: Admin, ProjectManager, TeamMember, Finance
- React frontend with Tailwind CSS
- Login and Signup pages

## Projects Module ✅

Complete Projects management system:
- Full CRUD operations for projects
- Project cards with status, progress, and budget
- Status filtering (Planned, In Progress, Completed, On Hold)
- Create/Edit project modal forms
- Progress bars and project count display
- Manager assignment and relationship tracking

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up database:
   - **Option 1 (SQLite - Default)**: No setup needed, will create `app.db` automatically
   - **Option 2 (PostgreSQL)**: Create a database named `oneflow_db` and update `DATABASE_URL` in `.env`

5. Create `.env` file (optional, defaults work for development):
   ```bash
   # Create .env file with the following content:
   DATABASE_URL=sqlite:///./app.db  # or postgresql://user:password@localhost:5432/oneflow_db
   SECRET_KEY=your-secret-key-here-change-in-production
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

6. Run the backend:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

   The API will be available at `http://localhost:8000`
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /auth/signup` - Create a new user account
- `POST /auth/login` - Login and get access token
- `GET /auth/profile` - Get current user profile (requires authentication)

### Projects
- `POST /projects/` - Create a new project
- `GET /projects/` - List all projects (optional `?status=` filter)
- `GET /projects/{id}` - Get a single project by ID
- `PUT /projects/{id}` - Update a project
- `DELETE /projects/{id}` - Delete a project

## User Roles

- **Admin**: Full system access
- **ProjectManager**: Project management access
- **TeamMember**: Basic team member access (default)
- **Finance**: Financial operations access

## Features

### Authentication
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ User registration and login
- ✅ Protected routes
- ✅ Password hashing with bcrypt
- ✅ Token expiration handling
- ✅ Responsive UI with Tailwind CSS

### Projects Management
- ✅ Full CRUD operations for projects
- ✅ Project cards with visual status indicators
- ✅ Progress bars (percentage complete)
- ✅ Budget tracking and currency formatting
- ✅ Date range (start/end dates)
- ✅ Manager assignment
- ✅ Status filtering (All, Planned, In Progress, Completed, On Hold)
- ✅ Project count display
- ✅ Create/Edit modal forms
- ✅ Delete functionality with confirmation

## Technology Stack

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- Python-JOSE (JWT)
- Passlib (password hashing)

### Frontend
- React
- React Router
- Axios
- Tailwind CSS
- Vite

## Project Structure

```
oneflow/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py      # Authentication routes
│   │   │   └── projects.py  # Projects CRUD routes
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth.py          # JWT utilities
│   │   └── main.py          # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── Projects.jsx  # Projects management page
│   │   ├── services/
│   │   │   └── api.js        # API client
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## Next Steps

Future phases will include:
- ✅ Project management features
- Task management
- Sales and purchase orders
- Expense management
- Product management
- Invoicing



