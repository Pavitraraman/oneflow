import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Projects from './pages/Projects'
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
                  className="flex items-center px-3 text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  Dashboard
                </Link>
                <Link
                  to="/projects"
                  className="flex items-center px-3 text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  Projects
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.first_name} {user?.last_name}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-700 hover:text-primary-600"
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

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to OneFlow</h1>
        <p className="text-gray-600 mb-8">Your project management dashboard</p>
        <Link
          to="/projects"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          View Projects
        </Link>
      </div>
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
            path="/projects"
            element={
              <ProtectedRoute>
                <Layout>
                  <Projects />
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



