import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle token expiration and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Only redirect if not already on login/signup page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login'
      }
    }
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message)
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData)
    return response.data
  },
  
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile')
    return response.data
  },
}

export const projectsAPI = {
  getAll: async (status) => {
    const params = status ? { status } : {}
    const response = await api.get('/projects/', { params })
    return response.data
  },
  
  getById: async (id) => {
    const response = await api.get(`/projects/${id}`)
    return response.data
  },
  
  create: async (projectData) => {
    const response = await api.post('/projects/', projectData)
    return response.data
  },
  
  update: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData)
    return response.data
  },
  
  delete: async (id) => {
    const response = await api.delete(`/projects/${id}`)
    return response.data
  },
}

export default api



