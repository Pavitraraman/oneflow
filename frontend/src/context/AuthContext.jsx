import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
      // Verify token is still valid by fetching profile
      authAPI.getProfile()
        .then((userData) => {
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
        })
        .catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (work_mail, password) => {
    try {
      const response = await authAPI.login({ work_mail, password })
      localStorage.setItem('token', response.access_token)
      
      const userData = await authAPI.getProfile()
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      
      return { success: true }
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.'
      
      if (error.response) {
        // Handle 401 unauthorized and 422 validation errors
        if (error.response.status === 401) {
          errorMessage = error.response.data?.detail || 'Incorrect email or password'
        } else if (error.response.status === 422) {
          const errors = error.response.data?.detail
          if (Array.isArray(errors)) {
            errorMessage = errors.map(e => `${e.loc?.join('.')}: ${e.msg}`).join(', ')
          } else {
            errorMessage = error.response.data?.detail || errorMessage
          }
        } else {
          errorMessage = error.response.data?.detail || errorMessage
        }
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData)
      // Auto-login after signup
      const loginResponse = await authAPI.login({
        work_mail: userData.work_mail,
        password: userData.password
      })
      localStorage.setItem('token', loginResponse.access_token)
      
      const profileData = await authAPI.getProfile()
      setUser(profileData)
      localStorage.setItem('user', JSON.stringify(profileData))
      
      return { success: true }
    } catch (error) {
      // Handle validation errors (422) and other errors
      let errorMessage = 'Signup failed. Please try again.'
      
      if (error.response) {
        // Handle 422 validation errors (Pydantic validation)
        if (error.response.status === 422) {
          const errors = error.response.data?.detail
          if (Array.isArray(errors)) {
            errorMessage = errors.map(e => `${e.loc?.join('.')}: ${e.msg}`).join(', ')
          } else {
            errorMessage = error.response.data?.detail || errorMessage
          }
        } else {
          errorMessage = error.response.data?.detail || errorMessage
        }
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}



