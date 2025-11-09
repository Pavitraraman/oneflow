import { useState, useEffect, useRef } from 'react'
import { analyticsAPI } from '../services/api'

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const pieChartRef = useRef(null)
  const barChartRef = useRef(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  useEffect(() => {
    if (analyticsData && window.Chart) {
      renderCharts()
    }
    return () => {
      // Cleanup charts on unmount
      if (pieChartRef.current) {
        pieChartRef.current.destroy()
        pieChartRef.current = null
      }
      if (barChartRef.current) {
        barChartRef.current.destroy()
        barChartRef.current = null
      }
    }
  }, [analyticsData])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await analyticsAPI.getFinanceAnalytics()
      setAnalyticsData(data)
    } catch (err) {
      setError('Failed to load analytics data. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const renderCharts = () => {
    if (!window.Chart || !analyticsData) return

    // Destroy existing charts if they exist
    if (pieChartRef.current) {
      pieChartRef.current.destroy()
    }
    if (barChartRef.current) {
      barChartRef.current.destroy()
    }

    // Prepare revenue data for pie chart
    const revenueLabels = Object.keys(analyticsData.revenue_by_type).map(key => {
      // Format label for display
      return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    })
    const revenueValues = Object.values(analyticsData.revenue_by_type)
    const revenueColors = [
      'rgba(54, 162, 235, 0.8)',
      'rgba(75, 192, 192, 0.8)',
    ]

    // Pie Chart for Revenue by Type
    const pieCtx = document.getElementById('revenuePieChart')
    if (pieCtx) {
      pieChartRef.current = new window.Chart(pieCtx, {
        type: 'pie',
        data: {
          labels: revenueLabels,
          datasets: [{
            label: 'Revenue by Type',
            data: revenueValues,
            backgroundColor: revenueColors,
            borderColor: revenueColors.map(c => c.replace('0.8', '1')),
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
            },
            title: {
              display: true,
              text: 'Revenue Breakdown by Document Type'
            }
          }
        }
      })
    }

    // Bar Chart for Revenue vs Cost Comparison
    const barCtx = document.getElementById('revenueCostBarChart')
    if (barCtx) {
      barChartRef.current = new window.Chart(barCtx, {
        type: 'bar',
        data: {
          labels: ['Revenue', 'Cost'],
          datasets: [{
            label: 'Amount',
            data: [
              analyticsData.total_actual_revenue,
              analyticsData.total_actual_cost
            ],
            backgroundColor: [
              'rgba(75, 192, 192, 0.8)',
              'rgba(255, 99, 132, 0.8)'
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Total Revenue vs Total Cost'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0,
                  }).format(value)
                }
              }
            }
          }
        }
      })
    }
  }

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '₹0.00'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value)
  }

  const formatDocumentType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
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
            onClick={fetchAnalytics}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 active:bg-primary-800 transition-all duration-150 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Financial Analytics</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(analyticsData?.total_actual_revenue || 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Cost</h3>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(analyticsData?.total_actual_cost || 0)}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart - Revenue by Type */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Type</h3>
            <div className="h-80">
              <canvas id="revenuePieChart"></canvas>
            </div>
            {/* Revenue Breakdown Table */}
            {analyticsData?.revenue_by_type && Object.keys(analyticsData.revenue_by_type).length > 0 && (
              <div className="mt-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(analyticsData.revenue_by_type).map(([type, amount]) => (
                      <tr key={type}>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatDocumentType(type)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">
                          {formatCurrency(amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bar Chart - Revenue vs Cost */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Cost</h3>
            <div className="h-80">
              <canvas id="revenueCostBarChart"></canvas>
            </div>
            {/* Cost Breakdown Table */}
            {analyticsData?.cost_by_type && Object.keys(analyticsData.cost_by_type).length > 0 && (
              <div className="mt-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(analyticsData.cost_by_type).map(([type, amount]) => (
                      <tr key={type}>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatDocumentType(type)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">
                          {formatCurrency(amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Profit Summary */}
        {analyticsData && (
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Summary</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Net Profit:</span>
              <span className={`text-2xl font-bold ${
                (analyticsData.total_actual_revenue - analyticsData.total_actual_cost) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {formatCurrency(analyticsData.total_actual_revenue - analyticsData.total_actual_cost)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Analytics


