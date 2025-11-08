# OneFlow Backend

FastAPI backend with JWT authentication and role-based access control.

## Setup

1. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up PostgreSQL database:**
   - Create a database named `oneflow_db`
   - Update the `DATABASE_URL` in `.env` file

4. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and update the following:
   - `DATABASE_URL`: PostgreSQL connection string
   - `SECRET_KEY`: A secret key for JWT token signing (generate a secure random string)
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time (default: 30)

5. **Run the application:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

   The API will be available at `http://localhost:8000`

6. **API Documentation:**
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

## User Roles

- `Admin`: Full system access
- `ProjectManager`: Project management access
- `TeamMember`: Basic team member access
- `Finance`: Financial operations access

## API Endpoints

### Authentication
- `POST /auth/signup` - Create a new user account
- `POST /auth/login` - Login and get access token
- `GET /auth/profile` - Get current user profile (requires authentication)

## Environment Variables

- `DATABASE_URL`: PostgreSQL database connection string
- `SECRET_KEY`: Secret key for JWT token signing
- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time in minutes



