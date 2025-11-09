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

export const tasksAPI = {
  getTasks: async (projectId, includeProjectName = false) => {
    const params = {}
    if (projectId) {
      params.project_id = projectId
    }
    if (includeProjectName) {
      params.include_project_name = true
    }
    const response = await api.get('/tasks/', { params })
    return response.data
  },
  
  createTask: async (taskData) => {
    const response = await api.post('/tasks/', taskData)
    return response.data
  },
  
  updateTask: async (taskId, taskData) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, taskData)
      return response.data
    } catch (error) {
      // Handle 202 Accepted for status requests
      if (error.response?.status === 202) {
        return error.response.data
      }
      throw error
    }
  },
  
  requestStatusUpdate: async (taskId, newStatus) => {
    // Special method for team members to request status changes
    try {
      const response = await api.put(`/tasks/${taskId}`, { status: newStatus })
      return response.data
    } catch (error) {
      // Handle 202 Accepted - this is expected for status requests
      if (error.response?.status === 202) {
        return error.response.data
      }
      throw error
    }
  },
  
  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`)
    return response.data
  },
  
  createTimesheet: async (taskId, timesheetData) => {
    const response = await api.post('/timesheets/', {
      ...timesheetData,
      task_id: taskId,
    })
    return response.data
  },
  
  getTimesheets: async (projectId) => {
    const response = await api.get('/timesheets/', { params: { project_id: projectId } })
    return response.data
  },
}

export const statsAPI = {
  getDashboardStats: async () => {
    const response = await api.get('/stats/dashboard')
    return response.data
  },
}

export const financeAPI = {
  linkEntry: async (entryData) => {
    const response = await api.post('/finance/link_entry', entryData)
    return response.data
  },
}

export const documentsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/documents/', { params })
    return response.data
  },
  
  create: async (documentData) => {
    const response = await api.post('/documents/', documentData)
    return response.data
  },
}

export const usersAPI = {
  listAll: async () => {
    const response = await api.get('/users/list_all')
    return response.data
  },
  
  getManagers: async () => {
    const response = await api.get('/users/list_all')
    // Filter for PROJECT_MANAGER role on frontend
    return response.data.filter(user => user.role === 'PROJECT_MANAGER')
  },
  
  getTeamMembers: async () => {
    const response = await api.get('/users/list_all')
    // Filter for TEAM_MEMBER role on frontend
    return response.data.filter(user => user.role === 'TEAM_MEMBER')
  },
}

export const analyticsAPI = {
  getFinanceAnalytics: async () => {
    const response = await api.get('/finance/analytics')
    return response.data
  },
}

export default api



