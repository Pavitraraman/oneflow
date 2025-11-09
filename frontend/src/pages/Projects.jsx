import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsAPI, usersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const Projects = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [groupBy, setGroupBy] = useState('none')
  const [managers, setManagers] = useState([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Planned',
    start_date: '',
    end_date: '',
    budget: '',
    progress: 0,
    manager_id: null,
  })

  const statusOptions = ['All', 'Planned', 'In Progress', 'Completed', 'On Hold']

  useEffect(() => {
    fetchProjects()
    if (user?.role === 'ADMIN') {
      fetchManagers()
    }
  }, [user])

  const fetchManagers = async () => {
    try {
      const data = await usersAPI.getManagers()
      setManagers(data)
    } catch (err) {
      console.error('Failed to load managers:', err)
    }
  }
  
  const applyFilters = () => {
    let filtered = [...projects]
    
    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query)
      )
    }
    
    setFilteredProjects(filtered)
  }

  useEffect(() => {
    applyFilters()
  }, [projects, statusFilter, searchQuery])
  
  // Group projects by manager for display
  const getGroupedProjects = () => {
    if (groupBy !== 'manager') {
      return { 'All Projects': filteredProjects }
    }
    
    const grouped = {}
    filteredProjects.forEach(project => {
      const managerName = project.manager 
        ? `${project.manager.first_name} ${project.manager.last_name}`
        : 'Unassigned'
      if (!grouped[managerName]) {
        grouped[managerName] = []
      }
      grouped[managerName].push(project)
    })
    return grouped
  }

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const data = await projectsAPI.getAll()
      setProjects(data)
      setFilteredProjects(data)
    } catch (err) {
      setError('Failed to load projects. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' || name === 'progress' 
        ? (value === '' ? '' : parseFloat(value))
        : name === 'manager_id'
        ? (value === '' ? null : parseInt(value))
        : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const submitData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : 0,
        progress: formData.progress ? parseFloat(formData.progress) : 0,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        manager_id: user?.role === 'ADMIN' 
          ? (formData.manager_id || null)
          : (formData.manager_id || user.id),
      }

      if (editingProject) {
        await projectsAPI.update(editingProject.id, submitData)
      } else {
        await projectsAPI.create(submitData)
      }

      setIsModalOpen(false)
      setEditingProject(null)
      resetForm()
      fetchProjects()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save project. Please try again.')
      console.error(err)
    }
  }

  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  const handleEdit = (project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      start_date: formatDateForInput(project.start_date),
      end_date: formatDateForInput(project.end_date),
      budget: project.budget || '',
      progress: project.progress || 0,
      manager_id: project.manager_id || user.id,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectsAPI.delete(id)
        fetchProjects()
      } catch (err) {
        setError('Failed to delete project. Please try again.')
        console.error(err)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'Planned',
      start_date: '',
      end_date: '',
      budget: '',
      progress: 0,
      manager_id: null,
    })
    setEditingProject(null)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProject(null)
    resetForm()
    setError('')
  }

  const getStatusColor = (status) => {
    const colors = {
      'Planned': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
      'On Hold': 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0.00'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0)
  }

  const getProgressBarColor = (progress) => {
    if (progress >= 0 && progress < 30) return 'bg-red-500'
    if (progress >= 30 && progress < 65) return 'bg-yellow-500'
    if (progress >= 65 && progress <= 100) return 'bg-green-500'
    return 'bg-gray-500'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              <p className="text-gray-600 mt-1">
                Total Projects: <span className="font-semibold">{projects.length}</span>
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-150 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              Create Project
            </button>
          </div>

          {/* Search and Group Controls */}
          <div className="mb-4 space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search projects by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="none">No Grouping</option>
                <option value="manager">Group By Manager</option>
              </select>
            </div>
            
            {/* Status Filters */}
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        ) : (
          /* Projects Grid - Grouped or Ungrouped */
          <div className="space-y-8">
            {Object.entries(getGroupedProjects()).map(([groupName, groupProjects]) => (
              <div key={groupName}>
                {groupBy === 'manager' && (
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {groupName} ({groupProjects.length} {groupProjects.length === 1 ? 'project' : 'projects'})
                  </h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-6 border border-gray-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(project.status)}`}
                  >
                    {project.status}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description || 'No description'}
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span className="font-medium">{project.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressBarColor(project.progress || 0)}`}
                      style={{ width: `${project.progress || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Project Details */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Budget:</span>
                    <span className="font-medium">{formatCurrency(project.budget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Start Date:</span>
                    <span>{formatDate(project.start_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>End Date:</span>
                    <span>{formatDate(project.end_date)}</span>
                  </div>
                  {project.manager && (
                    <div className="flex justify-between">
                      <span>Manager:</span>
                      <span>{project.manager.first_name} {project.manager.last_name}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-md text-sm hover:bg-primary-700 active:bg-primary-800 transition-all duration-150 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleEdit(project)}
                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200 active:bg-gray-300 transition-all duration-150 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm hover:bg-red-200 active:bg-red-300 transition-all duration-150 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                  >
                    Delete
                  </button>
                </div>
                  </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No projects found.</p>
          </div>
        )}
      </div>

           {/* Create/Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-1">
                      Progress (%)
                    </label>
                    <input
                      type="number"
                      id="progress"
                      name="progress"
                      min="0"
                      max="100"
                      value={formData.progress}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                    Budget
                  </label>
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    min="0"
                    step="0.01"
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Manager Selection - Admin Only */}
                {user?.role === 'ADMIN' && (
                  <div>
                    <label htmlFor="manager_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Project Manager
                    </label>
                    <select
                      id="manager_id"
                      name="manager_id"
                      value={formData.manager_id || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select Manager (Optional)</option>
                      {managers.map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.first_name} {manager.last_name} ({manager.work_mail})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-150 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                  >
                    {editingProject ? 'Update Project' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Projects

