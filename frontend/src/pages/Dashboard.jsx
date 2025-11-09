import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { statsAPI, usersAPI } from '../services/api'

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [usersFetched, setUsersFetched] = useState(false)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  useEffect(() => {
    // Only fetch users if auth is not loading, user is loaded, has ADMIN role, and hasn't been fetched yet
    if (!authLoading && user && user.role === 'ADMIN' && !usersFetched) {
      setUsersFetched(true)
      fetchUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await statsAPI.getDashboardStats()
      setStats(data)
    } catch (err) {
      setError('Failed to load dashboard statistics. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setUsersLoading(true)
      setUsersError('')
      const data = await usersAPI.listAll()
      setUsers(data || [])
    } catch (err) {
      setUsersError('Failed to load users. Please try again.')
      console.error('Error fetching users:', err)
      setUsersFetched(false) // Reset to allow retry
    } finally {
      setUsersLoading(false)
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
            onClick={fetchDashboardStats}
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
        {/* Welcome Message */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.first_name}!
              </h1>
              <p className="text-gray-600 mt-2">Here's an overview of your projects and tasks</p>
            </div>
            {/* User Points Card */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-lg p-4 min-w-[150px] hover:shadow-xl transition-all duration-200 transform hover:scale-105">
              <p className="text-sm font-medium text-white mb-1">Your Points</p>
              <p className="text-3xl font-bold text-white">
                {user?.points || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Projects Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {stats?.total_projects || 0}
                </p>
              </div>
              <div className="bg-primary-100 rounded-full p-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <Link
              to="/projects"
              className="mt-4 inline-block text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all projects →
            </Link>
          </div>

          {/* Total Tasks Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {stats?.total_tasks || 0}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <Link
              to="/projects"
              className="mt-4 inline-block text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all tasks →
            </Link>
          </div>

          {/* Total Hours Logged Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours Logged</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {stats?.total_hours_logged?.toFixed(1) || '0.0'}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Across all projects
            </p>
          </div>
        </div>

        {/* Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Projects by Status */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects by Status</h3>
            {stats?.projects_by_status && Object.keys(stats.projects_by_status).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.projects_by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(status)}`}>
                      {status}
                    </span>
                    <span className="text-lg font-bold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No projects yet</p>
            )}
          </div>

          {/* Tasks by Status */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Status</h3>
            {stats?.tasks_by_status && Object.keys(stats.tasks_by_status).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.tasks_by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`px-3 py-1 text-sm font-medium rounded ${getTaskStatusColor(status)}`}>
                      {status}
                    </span>
                    <span className="text-lg font-bold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No tasks yet</p>
            )}
          </div>

          {/* Tasks by Priority */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Priority</h3>
            {stats?.tasks_by_priority && Object.keys(stats.tasks_by_priority).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.tasks_by_priority).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <span className={`px-3 py-1 text-sm font-medium rounded ${getPriorityColor(priority)}`}>
                      {priority}
                    </span>
                    <span className="text-lg font-bold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No tasks yet</p>
            )}
          </div>
        </div>

         {/* User Management Section - Admin Only */}
         {user?.role === 'ADMIN' && (
           <div className="mt-8">
             <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">User Management</h2>
              {usersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading users...</p>
                </div>
              ) : usersError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{usersError}</p>
                  <button
                    onClick={() => {
                      setUsersFetched(false)
                      fetchUsers()
                    }}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          First Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                      </tr>
                    </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                       {users.length > 0 ? (
                         users.map((u) => (
                           <tr key={u.id} className="hover:bg-blue-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {u.first_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {u.last_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {u.work_mail}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {u.role}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard

