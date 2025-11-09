import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Projects from './pages/Projects'
import ProjectDetails from './pages/ProjectDetails'
import Dashboard from './pages/Dashboard'
import FinancialDocuments from './pages/FinancialDocuments'
import Analytics from './pages/Analytics'
import AllTasks from './pages/AllTasks'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center px-4 text-xl font-bold text-primary-600">
                OneFlow
              </Link>
              <div className="flex space-x-4">
                <Link
                  to="/"
                  className="flex items-center px-3 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-all duration-150"
                >
                  Dashboard
                </Link>
                <Link
                  to="/projects"
                  className="flex items-center px-3 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-all duration-150"
                >
                  Projects
                </Link>
                <Link
                  to="/documents"
                  className="flex items-center px-3 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-all duration-150"
                >
                  Financials
                </Link>
                <Link
                  to="/analytics"
                  className="flex items-center px-3 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-all duration-150"
                >
                  Analytics
                </Link>
                <Link
                  to="/all-tasks"
                  className="flex items-center px-3 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-all duration-150"
                >
                  All Tasks
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 font-medium">
                {user?.first_name} {user?.last_name}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-700 hover:text-primary-600 px-3 py-1 rounded-md hover:bg-gray-50 transition-all duration-150"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Layout>
                  <Projects />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProjectDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <Layout>
                  <FinancialDocuments />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/all-tasks"
            element={
              <ProtectedRoute>
                <Layout>
                  <AllTasks />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App



