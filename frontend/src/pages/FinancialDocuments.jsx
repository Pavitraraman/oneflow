import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { documentsAPI, projectsAPI } from '../services/api'

const FinancialDocuments = () => {
  const [documents, setDocuments] = useState([])
  const [filteredDocuments, setFilteredDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [projects, setProjects] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  const [documentFormData, setDocumentFormData] = useState({
    doc_type: 'SALES_ORDER',
    partner_name: '',
    document_number: '',
    amount: '',
    state: 'Draft',
    project_id: '',
  })

  const documentTypes = [
    { value: 'ALL', label: 'All Documents' },
    { value: 'SALES_ORDER', label: 'Sales Orders' },
    { value: 'PURCHASE_ORDER', label: 'Purchase Orders' },
    { value: 'CUSTOMER_INVOICE', label: 'Customer Invoices' },
    { value: 'VENDOR_BILL', label: 'Vendor Bills' },
    { value: 'EXPENSE', label: 'Expenses' },
  ]

  useEffect(() => {
    fetchDocuments()
    fetchProjects()
  }, [])

  useEffect(() => {
    let filtered = documents
    
    // Apply type filter
    if (activeFilter !== 'ALL') {
      filtered = filtered.filter(doc => doc.doc_type === activeFilter)
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(doc => 
        doc.partner_name.toLowerCase().includes(query) ||
        doc.document_number.toLowerCase().includes(query)
      )
    }
    
    setFilteredDocuments(filtered)
  }, [activeFilter, documents, searchQuery])
  
  // Calculate Net Revenue and Net Cost per project
  const calculateProjectFinancials = () => {
    const projectFinancials = {}
    
    documents.forEach(doc => {
      if (!doc.project_id) return
      
      const projectId = doc.project_id
      if (!projectFinancials[projectId]) {
        projectFinancials[projectId] = {
          revenue: 0,
          cost: 0,
          projectName: doc.project?.name || 'Unknown'
        }
      }
      
      // Revenue document types
      if (doc.doc_type === 'SALES_ORDER' || doc.doc_type === 'CUSTOMER_INVOICE') {
        projectFinancials[projectId].revenue += doc.amount
      }
      // Cost document types
      else if (doc.doc_type === 'PURCHASE_ORDER' || doc.doc_type === 'VENDOR_BILL' || doc.doc_type === 'EXPENSE') {
        projectFinancials[projectId].cost += doc.amount
      }
    })
    
    return projectFinancials
  }

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await documentsAPI.getAll()
      setDocuments(data)
      setFilteredDocuments(data)
    } catch (err) {
      setError('Failed to load documents. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const data = await projectsAPI.getAll()
      setProjects(data)
    } catch (err) {
      console.error('Failed to load projects:', err)
    }
  }

  const handleFilterChange = (filter) => {
    setActiveFilter(filter)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setDocumentFormData(prev => ({
      ...prev,
      [name]: name === 'amount' || name === 'project_id' 
        ? (value === '' ? '' : (name === 'amount' ? parseFloat(value) : parseInt(value)))
        : value
    }))
    setCreateError('')
  }

  const handleCreateDocument = async (e) => {
    e.preventDefault()
    setCreateError('')
    setIsCreating(true)

    try {
      if (!documentFormData.partner_name || !documentFormData.document_number || !documentFormData.amount) {
        throw new Error('Please fill in all required fields')
      }

      const documentData = {
        ...documentFormData,
        amount: parseFloat(documentFormData.amount),
        project_id: documentFormData.project_id ? parseInt(documentFormData.project_id) : null,
      }

      await documentsAPI.create(documentData)
      
      setIsCreateModalOpen(false)
      setDocumentFormData({
        doc_type: 'SALES_ORDER',
        partner_name: '',
        document_number: '',
        amount: '',
        state: 'Draft',
        project_id: '',
      })
      fetchDocuments()
    } catch (err) {
      setCreateError(err.response?.data?.detail || err.message || 'Failed to create document. Please try again.')
      console.error(err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
    setDocumentFormData({
      doc_type: 'SALES_ORDER',
      partner_name: '',
      document_number: '',
      amount: '',
      state: 'Draft',
      project_id: '',
    })
    setCreateError('')
  }

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '₹0.00'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getDocTypeLabel = (docType) => {
    const labels = {
      'SALES_ORDER': 'Sales Order',
      'PURCHASE_ORDER': 'Purchase Order',
      'CUSTOMER_INVOICE': 'Customer Invoice',
      'VENDOR_BILL': 'Vendor Bill',
      'EXPENSE': 'Expense',
    }
    return labels[docType] || docType
  }

  const getStateColor = (state) => {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Confirmed': 'bg-blue-100 text-blue-800',
      'Paid': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
    }
    return colors[state] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Documents</h1>
          <p className="text-gray-600">Manage all financial documents (SO, PO, Invoices, Bills, Expenses)</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6 transition-shadow duration-200 hover:shadow-xl">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by partner name or document number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {documentTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleFilterChange(type.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeFilter === type.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Project Financial Summary */}
        {Object.keys(calculateProjectFinancials()).length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 transition-shadow duration-200 hover:shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Project Financial Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(calculateProjectFinancials()).map(([projectId, financials]) => {
                const netRevenue = financials.revenue - financials.cost
                return (
                  <div key={projectId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-2">{financials.projectName}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Net Revenue:</span>
                        <span className={`font-semibold ${netRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(netRevenue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Revenue:</span>
                        <span className="text-green-600">{formatCurrency(financials.revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Cost:</span>
                        <span className="text-red-600">{formatCurrency(financials.cost)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600">
            Showing {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-150 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            Create New Document
          </button>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-shadow duration-200 hover:shadow-xl">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No documents found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Partner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      State
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {doc.document_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getDocTypeLabel(doc.doc_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.partner_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(doc.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStateColor(doc.state)}`}>
                          {doc.state}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.project ? (
                          <Link
                            to={`/projects/${doc.project.id}`}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            {doc.project.name}
                          </Link>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(doc.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Document Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create Financial Document</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {createError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateDocument} className="space-y-4">
                <div>
                  <label htmlFor="doc_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type *
                  </label>
                  <select
                    id="doc_type"
                    name="doc_type"
                    required
                    value={documentFormData.doc_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="SALES_ORDER">Sales Order</option>
                    <option value="PURCHASE_ORDER">Purchase Order</option>
                    <option value="CUSTOMER_INVOICE">Customer Invoice</option>
                    <option value="VENDOR_BILL">Vendor Bill</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="partner_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Partner Name *
                  </label>
                  <input
                    type="text"
                    id="partner_name"
                    name="partner_name"
                    required
                    value={documentFormData.partner_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Customer or Vendor name"
                  />
                </div>

                <div>
                  <label htmlFor="document_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Document Number *
                  </label>
                  <input
                    type="text"
                    id="document_number"
                    name="document_number"
                    required
                    value={documentFormData.document_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., SO-001, Invoice-100"
                  />
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
                    value={documentFormData.amount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={documentFormData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Paid">Paid</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Link to Project (Optional)
                  </label>
                  <select
                    id="project_id"
                    name="project_id"
                    value={documentFormData.project_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">None</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
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
                    disabled={isCreating}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 disabled:transform-none"
                  >
                    {isCreating ? 'Creating...' : 'Create'}
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

export default FinancialDocuments

