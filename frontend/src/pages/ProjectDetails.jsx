import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import confetti from 'canvas-confetti'
import { projectsAPI, tasksAPI, financeAPI, usersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const ProjectDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [timesheets, setTimesheets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [taskError, setTaskError] = useState('')
  const [taskSuccess, setTaskSuccess] = useState('')
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [isLogTimeModalOpen, setIsLogTimeModalOpen] = useState(false)
  const [loggingTaskId, setLoggingTaskId] = useState(null)
  const [logTimeError, setLogTimeError] = useState('')
  const [isLoggingTime, setIsLoggingTime] = useState(false)
  const [logTimeSuccess, setLogTimeSuccess] = useState('')
  const [teamMembers, setTeamMembers] = useState([])
  
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    estimated_hours: '',
    assignee_ids: [],
  })

  const [timesheetFormData, setTimesheetFormData] = useState({
    hours: '',
    description: '',
  })

  const [isLinkEntryModalOpen, setIsLinkEntryModalOpen] = useState(false)
  const [linkEntryError, setLinkEntryError] = useState('')
  const [isLinkingEntry, setIsLinkingEntry] = useState(false)
  const [linkEntrySuccess, setLinkEntrySuccess] = useState('')
  
  const [financialEntryFormData, setFinancialEntryFormData] = useState({
    entry_type: 'REVENUE',
    amount: '',
    description: '',
  })

  useEffect(() => {
    fetchProjectDetails()
    fetchTasks()
    fetchTimesheets()
    fetchTeamMembers()
  }, [id])
  
  const fetchTeamMembers = async () => {
    try {
      const data = await usersAPI.getTeamMembers()
      setTeamMembers(data)
    } catch (err) {
      console.error('Failed to load team members:', err)
    }
  }

  const fetchProjectDetails = async () => {
    try {
      setLoading(true)
      const data = await projectsAPI.getById(id)
      setProject(data)
    } catch (err) {
      setError('Failed to load project details. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const data = await tasksAPI.getTasks(id)
      setTasks(data)
    } catch (err) {
      console.error('Failed to load tasks:', err)
      // Don't set error state for tasks, just log it
    }
  }

  const fetchTimesheets = async () => {
    try {
      const data = await tasksAPI.getTimesheets(id)
      setTimesheets(data)
    } catch (err) {
      console.error('Failed to load timesheets:', err)
      // Don't set error state for timesheets, just log it
    }
  }

  const handleTaskInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'assignee_ids') {
      // Handle multi-select for assignees
      const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value))
      setTaskFormData(prev => ({
        ...prev,
        assignee_ids: selectedOptions
      }))
    } else {
      setTaskFormData(prev => ({
        ...prev,
        [name]: name === 'estimated_hours' ? (value === '' ? '' : parseFloat(value)) : value
      }))
    }
    setTaskError('')
  }

  const handleSaveTask = async (e) => {
    e.preventDefault()
    setTaskError('')
    setIsCreatingTask(true)

    try {
      const taskData = {
        ...taskFormData,
        estimated_hours: taskFormData.estimated_hours ? parseFloat(taskFormData.estimated_hours) : 0,
        assignee_ids: taskFormData.assignee_ids || [],
      }

      if (editingTask) {
        // Update existing task
        await tasksAPI.updateTask(editingTask.id, taskData)
      } else {
        // Create new task
        taskData.project_id = parseInt(id)
        taskData.status = 'TODO'
        await tasksAPI.createTask(taskData)
      }
      
      // Close modal, reset form, and refresh tasks
      setIsCreateModalOpen(false)
      setEditingTask(null)
      setTaskFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        estimated_hours: '',
        assignee_ids: [],
      })
      fetchTasks()
    } catch (err) {
      setTaskError(err.response?.data?.detail || `Failed to ${editingTask ? 'update' : 'create'} task. Please try again.`)
      console.error(err)
    } finally {
      setIsCreatingTask(false)
    }
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setTaskFormData({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'MEDIUM',
      estimated_hours: task.estimated_hours || '',
      assignee_ids: task.assignees ? task.assignees.map(a => a.id) : [],
    })
    setIsCreateModalOpen(true)
  }

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.deleteTask(taskId)
        fetchTasks()
      } catch (err) {
        setTaskError(err.response?.data?.detail || 'Failed to delete task. Please try again.')
        console.error(err)
      }
    }
  }

  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
    setEditingTask(null)
    setTaskFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      estimated_hours: '',
      assignee_ids: [],
    })
    setTaskError('')
  }

  const handleOpenLogTime = (taskId) => {
    setLoggingTaskId(taskId)
    setTimesheetFormData({
      hours: '',
      description: '',
    })
    setLogTimeError('')
    setLogTimeSuccess('')
    setIsLogTimeModalOpen(true)
  }

  const handleCloseLogTimeModal = () => {
    setIsLogTimeModalOpen(false)
    setLoggingTaskId(null)
    setTimesheetFormData({
      hours: '',
      description: '',
    })
    setLogTimeError('')
    setLogTimeSuccess('')
  }

  const handleLogTimeInputChange = (e) => {
    const { name, value } = e.target
    setTimesheetFormData(prev => ({
      ...prev,
      [name]: name === 'hours' ? (value === '' ? '' : parseFloat(value)) : value
    }))
    setLogTimeError('')
    setLogTimeSuccess('')
  }

  const handleLogTime = async (e) => {
    e.preventDefault()
    setLogTimeError('')
    setLogTimeSuccess('')
    setIsLoggingTime(true)

    try {
      if (!timesheetFormData.hours || timesheetFormData.hours <= 0) {
        throw new Error('Hours must be greater than 0')
      }

      await tasksAPI.createTimesheet(loggingTaskId, {
        hours: parseFloat(timesheetFormData.hours),
        description: timesheetFormData.description || undefined,
      })
      
      setLogTimeSuccess('Time logged successfully!')
      
      // Refresh tasks to update actual_hours and refresh timesheets
      await fetchTasks()
      await fetchTimesheets()
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        handleCloseLogTimeModal()
      }, 1500)
    } catch (err) {
      setLogTimeError(err.response?.data?.detail || err.message || 'Failed to log time. Please try again.')
      console.error(err)
    } finally {
      setIsLoggingTime(false)
    }
  }

  const handleOpenLinkEntry = () => {
    setFinancialEntryFormData({
      entry_type: 'REVENUE',
      amount: '',
      description: '',
    })
    setLinkEntryError('')
    setLinkEntrySuccess('')
    setIsLinkEntryModalOpen(true)
  }

  const handleCloseLinkEntryModal = () => {
    setIsLinkEntryModalOpen(false)
    setFinancialEntryFormData({
      entry_type: 'REVENUE',
      amount: '',
      description: '',
    })
    setLinkEntryError('')
    setLinkEntrySuccess('')
  }

  const handleFinancialEntryInputChange = (e) => {
    const { name, value } = e.target
    setFinancialEntryFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? (value === '' ? '' : parseFloat(value)) : value
    }))
    setLinkEntryError('')
    setLinkEntrySuccess('')
  }

  const handleLinkEntry = async (e) => {
    e.preventDefault()
    setLinkEntryError('')
    setLinkEntrySuccess('')
    setIsLinkingEntry(true)

    try {
      if (!financialEntryFormData.amount || financialEntryFormData.amount <= 0) {
        throw new Error('Amount must be greater than 0')
      }

      await financeAPI.linkEntry({
        entry_type: financialEntryFormData.entry_type,
        amount: parseFloat(financialEntryFormData.amount),
        description: financialEntryFormData.description || undefined,
        project_id: parseInt(id),
      })
      
      setLinkEntrySuccess('Financial entry linked successfully!')
      
      // Refresh project data to update financial metrics
      await fetchProjectDetails()
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        handleCloseLinkEntryModal()
      }, 1500)
    } catch (err) {
      setLinkEntryError(err.response?.data?.detail || err.message || 'Failed to link financial entry. Please try again.')
      console.error(err)
    } finally {
      setIsLinkingEntry(false)
    }
  }

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '₹0.00'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value)
  }

  const getProgressBarColor = (progress) => {
    if (progress >= 0 && progress < 30) return 'bg-red-500'
    if (progress >= 30 && progress < 65) return 'bg-yellow-500'
    if (progress >= 65 && progress <= 100) return 'bg-green-500'
    return 'bg-gray-500'
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

  const getTaskStatusColor = (status) => {
    const colors = {
      'TODO': 'bg-gray-100 text-gray-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'IN_REVIEW': 'bg-blue-100 text-blue-800',
      'DONE': 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800',
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped = {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: [],
    }
    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    })
    return grouped
  }, [tasks])

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'TODO': 'IN_PROGRESS',
      'IN_PROGRESS': 'IN_REVIEW',
      'IN_REVIEW': 'DONE',
      'DONE': null
    }
    return statusFlow[currentStatus] || null
  }

  const handleStatusRequest = async (taskId, newStatus) => {
    try {
      setTaskError('')
      setTaskSuccess('')
      const response = await tasksAPI.requestStatusUpdate(taskId, newStatus)
      // Show success message
      setTaskSuccess('Status change request submitted successfully. Waiting for manager approval.')
      setTimeout(() => setTaskSuccess(''), 5000)
      // Refresh tasks to show the status_request
      fetchTasks()
    } catch (err) {
      if (err.response?.status === 202) {
        setTaskSuccess('Status change request submitted successfully. Waiting for manager approval.')
        fetchTasks()
      } else {
        setTaskError(err.response?.data?.detail || 'Failed to submit status change request. Please try again.')
      }
      console.error(err)
    }
  }

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result

    // If dropped outside a droppable area, do nothing
    if (!destination) {
      return
    }

    // If dropped in the same position, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const taskId = parseInt(draggableId)
    const newStatus = destination.droppableId
    const oldStatus = source.droppableId

    // TEAM_MEMBER cannot use drag-and-drop, they must use status request
    if (user?.role === 'TEAM_MEMBER') {
      setTaskError('Team members cannot directly change task status. Please use the status request button.')
      return
    }

    // If status hasn't changed, do nothing (reordering within same column not implemented yet)
    if (newStatus === oldStatus) {
      return
    }

    // Find the task being moved
    const task = tasks.find((t) => t.id === taskId)
    if (!task) {
      return
    }

    // Store the previous state for potential rollback
    const previousTasks = tasks

    // Optimistically update the UI
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t
    )
    setTasks(updatedTasks)

    // Trigger confetti if task is moved TO DONE (not already DONE)
    if (destination.droppableId === 'DONE' && source.droppableId !== 'DONE') {
      // Trigger confetti animation for 3 seconds
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)
    }

    // Update task status in backend
    try {
      await tasksAPI.updateTask(taskId, { status: newStatus })
      // Optionally refresh tasks to ensure sync
      // fetchTasks()
    } catch (err) {
      // Revert optimistic update on error by refetching
      setTasks(previousTasks)
      fetchTasks() // Refetch to ensure sync with backend
      setTaskError(err.response?.data?.detail || 'Failed to update task status. Please try again.')
      console.error('Failed to update task status:', err)
    }
  }

  const statusColumns = [
    { id: 'TODO', title: 'To Do', color: 'bg-gray-100 text-gray-800' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'IN_REVIEW', title: 'In Review', color: 'bg-blue-100 text-blue-800' },
    { id: 'DONE', title: 'Done', color: 'bg-green-100 text-green-800' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Project not found'}</p>
          <Link
            to="/projects"
            className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/projects"
            className="inline-flex items-center text-primary-600 hover:text-primary-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </Link>
        </div>

        {/* Project Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 transition-shadow duration-200 hover:shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <span
                className={`inline-block px-3 py-1 text-sm font-medium rounded ${getStatusColor(project.status)}`}
              >
                {project.status}
              </span>
            </div>
          </div>

          {project.description && (
            <p className="text-gray-600 mb-4">{project.description}</p>
          )}

          {/* Project Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Manager:</span>
              <p className="font-medium text-gray-900">
                {project.manager
                  ? `${project.manager.first_name} ${project.manager.last_name}`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Start Date:</span>
              <p className="font-medium text-gray-900">{formatDate(project.start_date)}</p>
            </div>
            <div>
              <span className="text-gray-500">End Date:</span>
              <p className="font-medium text-gray-900">{formatDate(project.end_date)}</p>
            </div>
            <div>
              <span className="text-gray-500">Progress:</span>
              <p className="font-medium text-gray-900">{project.progress || 0}%</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Project Progress</span>
              <span className="font-medium">{project.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getProgressBarColor(project.progress || 0)}`}
                style={{ width: `${project.progress || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Billing Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 transition-shadow duration-200 hover:shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Financial Summary</h2>
            <button
              onClick={handleOpenLinkEntry}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-150 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              Link Entry
            </button>
          </div>

          {/* Financial Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Estimated Revenue</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatCurrency(project.estimated_revenue)}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Actual Revenue</p>
              <p className="text-xl font-semibold text-green-700">
                {formatCurrency(project.actual_revenue)}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Actual Cost</p>
              <p className="text-xl font-semibold text-red-700">
                {formatCurrency(project.actual_cost)}
              </p>
            </div>
            <div className={`rounded-lg p-4 ${project.profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm text-gray-600 mb-1">Profit</p>
              <p className={`text-xl font-bold ${project.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(project.profit)}
              </p>
            </div>
          </div>

          {/* Financial Entries List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Entries</h3>
            {project.financial_entries && project.financial_entries.length > 0 ? (
              <div className="space-y-2">
                {project.financial_entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            entry.entry_type === 'REVENUE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {entry.entry_type}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(entry.amount)}
                        </span>
                        {entry.description && (
                          <span className="text-sm text-gray-600">{entry.description}</span>
                        )}
                      </div>
                      {entry.entry_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(entry.entry_date)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No financial entries yet. Click "Link Entry" to add one.</p>
              </div>
            )}
          </div>
        </div>

        {/* Time Log History Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 transition-shadow duration-200 hover:shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Time Log History</h2>
          {timesheets && timesheets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timesheets.map((timesheet) => (
                    <tr key={timesheet.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(timesheet.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {timesheet.user
                          ? `${timesheet.user.first_name} ${timesheet.user.last_name}`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {timesheet.task ? timesheet.task.title : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {timesheet.hours}h
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {timesheet.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No time logs yet. Log time on tasks to see history here.</p>
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 transition-shadow duration-200 hover:shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </span>
              <button
                onClick={() => {
                  setEditingTask(null)
                  setIsCreateModalOpen(true)
                }}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-150 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
              >
                Create Task
              </button>
            </div>
          </div>
          
          {taskError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded transition-all duration-200">
              {taskError}
            </div>
          )}
          {taskSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded transition-all duration-200">
              {taskSuccess}
            </div>
          )}

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No tasks found for this project.</p>
            </div>
          ) : user?.role === 'TEAM_MEMBER' ? (
            // TEAM_MEMBER view - No drag and drop, show status request buttons
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {statusColumns.map((column) => (
                <div key={column.id} className="flex flex-col">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      {column.title}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {tasksByStatus[column.id]?.length || 0} tasks
                    </span>
                  </div>
                  <div className="flex-1 min-h-[200px] rounded-lg p-3 bg-gray-50 border border-gray-200">
                    {tasksByStatus[column.id]?.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No tasks
                      </div>
                    ) : (
                      tasksByStatus[column.id].map((task) => (
                        <div
                          key={task.id}
                          className="mb-3 border border-gray-200 rounded-lg p-4 bg-white hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                        >
                          <h3 className="text-base font-semibold text-gray-900 mb-2">
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          {task.status_request && (
                            <div className="mb-2 px-2 py-1 bg-orange-100 border border-orange-300 rounded text-xs text-orange-800">
                              Status Request: {task.status_request} (Pending Approval)
                            </div>
                          )}
                          <div className="flex gap-2 flex-wrap mb-3">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority}
                            </span>
                            {task.assignees && task.assignees.length > 0 && (
                              task.assignees.map((assignee) => (
                                <span key={assignee.id} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                  {assignee.first_name} {assignee.last_name}
                                </span>
                              ))
                            )}
                            {task.estimated_hours > 0 && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                Est: {task.estimated_hours}h
                              </span>
                            )}
                            {task.actual_hours > 0 && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                Actual: {task.actual_hours}h
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {getNextStatus(task.status) && (
                              <button
                                onClick={() => handleStatusRequest(task.id, getNextStatus(task.status))}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-all duration-150 shadow-sm hover:shadow-md transform hover:scale-105"
                              >
                                Request: {getNextStatus(task.status).replace('_', ' ')}
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenLogTime(task.id)}
                              className="px-3 py-1 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700 active:bg-primary-800 transition-all duration-150 shadow-sm hover:shadow-md transform hover:scale-105"
                            >
                              Log Time
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // MANAGER/ADMIN view - With drag and drop
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {statusColumns.map((column) => (
                  <div key={column.id} className="flex flex-col">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        {column.title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {tasksByStatus[column.id]?.length || 0} tasks
                      </span>
                    </div>
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 min-h-[200px] rounded-lg p-3 transition-all duration-200 ${
                            snapshot.isDraggingOver
                              ? 'bg-blue-50 border-2 border-dashed border-primary-400 shadow-inner'
                              : 'bg-gray-50 border border-gray-200'
                          }`}
                        >
                          {tasksByStatus[column.id]?.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                              No tasks
                            </div>
                          ) : (
                            tasksByStatus[column.id].map((task, index) => (
                              <Draggable
                                key={task.id}
                                draggableId={task.id.toString()}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`mb-3 border border-gray-200 rounded-lg p-4 bg-white transition-all duration-200 ${
                                      snapshot.isDragging
                                        ? 'shadow-2xl ring-2 ring-primary-500 transform rotate-2 scale-105'
                                        : 'hover:shadow-lg hover:-translate-y-1'
                                    }`}
                                  >
                                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                                      {task.title}
                                    </h3>
                                    {task.description && (
                                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                        {task.description}
                                      </p>
                                    )}
                                    {task.status_request && (
                                      <div className="mb-2 px-2 py-1 bg-orange-100 border border-orange-300 rounded text-xs text-orange-800">
                                        Status Request: {task.status_request} (Click to approve)
                                      </div>
                                    )}
                                    <div className="flex gap-2 flex-wrap mb-3">
                                      <span
                                        className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}
                                      >
                                        {task.priority}
                                      </span>
                                      {task.assignees && task.assignees.length > 0 && (
                                        task.assignees.map((assignee) => (
                                          <span key={assignee.id} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                            {assignee.first_name} {assignee.last_name}
                                          </span>
                                        ))
                                      )}
                                      {task.estimated_hours > 0 && (
                                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                          Est: {task.estimated_hours}h
                                        </span>
                                      )}
                                      {task.actual_hours > 0 && (
                                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                          Actual: {task.actual_hours}h
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                      <button
                                        onClick={() => handleOpenLogTime(task.id)}
                                        className="px-3 py-1 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700 active:bg-primary-800 transition-all duration-150 shadow-sm hover:shadow-md transform hover:scale-105"
                                      >
                                        Log Time
                                      </button>
                                      <button
                                        onClick={() => handleEditTask(task)}
                                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 active:bg-gray-300 transition-all duration-150 shadow-sm hover:shadow-md transform hover:scale-105"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 active:bg-red-300 transition-all duration-150 shadow-sm hover:shadow-md transform hover:scale-105"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingTask ? 'Edit Task' : 'Create New Task'}
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

              {taskError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded transition-all duration-200">
                  {taskError}
                </div>
              )}
              {taskSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded transition-all duration-200">
                  {taskSuccess}
                </div>
              )}

              <form onSubmit={handleSaveTask} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={taskFormData.title}
                    onChange={handleTaskInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter task title"
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
                    value={taskFormData.description}
                    onChange={handleTaskInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter task description"
                  />
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={taskFormData.priority}
                    onChange={handleTaskInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    id="estimated_hours"
                    name="estimated_hours"
                    min="0"
                    step="0.5"
                    value={taskFormData.estimated_hours}
                    onChange={handleTaskInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label htmlFor="assignee_ids" className="block text-sm font-medium text-gray-700 mb-1">
                    Assignees (Multiple Selection)
                  </label>
                  <select
                    id="assignee_ids"
                    name="assignee_ids"
                    multiple
                    value={taskFormData.assignee_ids.map(id => id.toString())}
                    onChange={handleTaskInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[100px]"
                    size="5"
                  >
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.first_name} {member.last_name} ({member.work_mail})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Hold Ctrl (Windows) or Cmd (Mac) to select multiple assignees
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-150 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTask}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 disabled:transform-none"
                  >
                    {isCreatingTask 
                      ? (editingTask ? 'Updating...' : 'Creating...') 
                      : (editingTask ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Log Time Modal */}
      {isLogTimeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Log Time</h2>
                <button
                  onClick={handleCloseLogTimeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {logTimeError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {logTimeError}
                </div>
              )}

              {logTimeSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {logTimeSuccess}
                </div>
              )}

              <form onSubmit={handleLogTime} className="space-y-4">
                <div>
                  <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-1">
                    Hours *
                  </label>
                  <input
                    type="number"
                    id="hours"
                    name="hours"
                    required
                    min="0.1"
                    step="0.1"
                    value={timesheetFormData.hours}
                    onChange={handleLogTimeInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter hours worked"
                  />
                </div>

                <div>
                  <label htmlFor="timesheet_description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="timesheet_description"
                    name="description"
                    rows="3"
                    value={timesheetFormData.description}
                    onChange={handleLogTimeInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter description (optional)"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseLogTimeModal}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingTime}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoggingTime ? 'Logging...' : 'Log Time'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Link Financial Entry Modal */}
      {isLinkEntryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Link Financial Entry</h2>
                <button
                  onClick={handleCloseLinkEntryModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {linkEntryError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {linkEntryError}
                </div>
              )}

              {linkEntrySuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {linkEntrySuccess}
                </div>
              )}

              <form onSubmit={handleLinkEntry} className="space-y-4">
                <div>
                  <label htmlFor="entry_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Entry Type *
                  </label>
                  <select
                    id="entry_type"
                    name="entry_type"
                    required
                    value={financialEntryFormData.entry_type}
                    onChange={handleFinancialEntryInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="REVENUE">Revenue</option>
                    <option value="COST">Cost</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    required
                    min="0.01"
                    step="0.01"
                    value={financialEntryFormData.amount}
                    onChange={handleFinancialEntryInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="financial_description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    id="financial_description"
                    name="description"
                    value={financialEntryFormData.description}
                    onChange={handleFinancialEntryInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Customer Invoice #100 or Vendor Bill #201"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseLinkEntryModal}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-150 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLinkingEntry}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 disabled:transform-none"
                  >
                    {isLinkingEntry ? 'Linking...' : 'Link'}
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

export default ProjectDetails

