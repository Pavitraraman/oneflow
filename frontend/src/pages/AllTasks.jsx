import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { tasksAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const AllTasks = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [groupedTasks, setGroupedTasks] = useState({})

  useEffect(() => {
    fetchAllTasks()
  }, [])

  useEffect(() => {
    // Group tasks by project name
    const grouped = {}
    tasks.forEach(task => {
      const projectName = task.project_name || 'Unassigned'
      if (!grouped[projectName]) {
        grouped[projectName] = []
      }
      grouped[projectName].push(task)
    })
    setGroupedTasks(grouped)
  }, [tasks])

  const fetchAllTasks = async () => {
    try {
      setLoading(true)
      setError('')
      // Use consolidated endpoint with include_project_name flag
      const data = await tasksAPI.getTasks(null, true)
      setTasks(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load tasks. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading all tasks...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAllTasks}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">All Tasks</h1>
        
        {Object.keys(groupedTasks).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No tasks found.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTasks).map(([projectName, projectTasks]) => (
              <div key={projectName} className="bg-white rounded-lg shadow-lg p-6 transition-shadow duration-200 hover:shadow-xl mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {projectName} ({projectTasks.length} {projectTasks.length === 1 ? 'task' : 'tasks'})
                </h2>
                <div className="space-y-3">
                  {projectTasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getTaskStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            {task.assignees && task.assignees.length > 0 && (
                              <div>
                                <span className="font-medium">Assignees: </span>
                                <span>{task.assignees.map(a => `${a.first_name} ${a.last_name}`).join(', ')}</span>
                              </div>
                            )}
                            {task.estimated_hours > 0 && (
                              <div>
                                <span className="font-medium">Est. Hours: </span>
                                <span>{task.estimated_hours}h</span>
                              </div>
                            )}
                            {task.actual_hours > 0 && (
                              <div>
                                <span className="font-medium">Actual Hours: </span>
                                <span>{task.actual_hours}h</span>
                              </div>
                            )}
                            {task.status_request && (
                              <div className="text-orange-600">
                                <span className="font-medium">Status Request: </span>
                                <span>{task.status_request}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Link
                          to={`/projects/${task.project_id}`}
                          className="ml-4 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors duration-150 hover:underline"
                        >
                          View Project →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AllTasks

