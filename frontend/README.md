# OneFlow Frontend

React frontend with Tailwind CSS for the OneFlow application.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## Features

- **Login Page**: Authenticate with work email and password
- **Signup Page**: Create a new account with role selection
- **Protected Routes**: Automatically redirects to login if not authenticated
- **JWT Authentication**: Token-based authentication with automatic token refresh

## Environment Variables

Make sure the backend API is running on `http://localhost:8000` or update the API_BASE_URL in `src/services/api.js`.

## Project Structure

```
src/
  ├── components/      # Reusable components
  ├── context/         # React Context providers (Auth)
  ├── pages/           # Page components (Login, Signup)
  ├── services/        # API service layer
  └── App.jsx          # Main app component with routing
```

## User Roles

- `Admin`: Full system access
- `ProjectManager`: Project management access
- `TeamMember`: Basic team member access (default)
- `Finance`: Financial operations access



