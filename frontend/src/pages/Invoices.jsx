import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { DollarSign, Plus, X, Trash2, Check } from 'lucide-react'
import axios from '../api/axios'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [stats, setStats] = useState({
    total_paid: 0,
    total_outstanding: 0,
    total_invoices: 0
  })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
    terms: 'Payment due within 30 days',
    tax_rate: 0,
    items: [{ description: '', quantity: 1, unit_price: 0 }]
  })

  useEffect(() => {
    fetchInvoices()
    fetchStats()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await axios.get('/api/invoices')
      setInvoices(response.data.invoices || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/invoices/stats/summary')
      setStats(response.data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/invoices', formData)
      setShowModal(false)
      setFormData({
        client_name: '',
        client_email: '',
        client_phone: '',
        client_address: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        notes: '',
        terms: 'Payment due within 30 days',
        tax_rate: 0,
        items: [{ description: '', quantity: 1, unit_price: 0 }]
      })
      fetchInvoices()
      fetchStats()
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Failed to create invoice')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    try {
      await axios.delete(`/api/invoices/${id}`)
      fetchInvoices()
      fetchStats()
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('Failed to delete invoice')
    }
  }

  const handleStatusChange = async (id, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid'
    const payment_date = newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null

    try {
      await axios.put(`/api/invoices/${id}/status`, {
        status: newStatus,
        payment_date
      })
      fetchInvoices()
      fetchStats()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update invoice status')
    }
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: 0 }]
    })
  }

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = field === 'description' ? value : parseFloat(value) || 0
    setFormData({ ...formData, items: newItems })
  }

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) =>
      sum + (item.quantity * item.unit_price), 0
    )
    const tax = subtotal * (formData.tax_rate / 100)
    return (subtotal + tax).toFixed(2)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Invoices</h1>
            <p className="text-gray-600 mt-2">Create and manage your invoices</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Invoice
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {formatCurrency(stats.total_paid)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Outstanding</p>
            <p className="text-2xl font-bold text-yellow-600 mt-2">
              {formatCurrency(stats.total_outstanding)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Invoices</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {stats.total_invoices}
            </p>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-6">Recent Invoices</h2>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No invoices created yet</p>
              <p className="text-sm mt-2">Create your first invoice to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Invoice #</th>
                    <th className="text-left py-3 px-4">Client</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Due Date</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">
                        {invoice.invoice_number}
                      </td>
                      <td className="py-3 px-4">{invoice.client_name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(invoice.invoice_date)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleStatusChange(invoice.id, invoice.status)}
                          className="text-green-600 hover:text-green-800 mr-3"
                          title={invoice.status === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Create New Invoice</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Client Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Client Name *"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="border rounded-lg px-4 py-2"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Client Email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    className="border rounded-lg px-4 py-2"
                  />
                  <input
                    type="tel"
                    placeholder="Client Phone"
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    className="border rounded-lg px-4 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Client Address"
                    value={formData.client_address}
                    onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                    className="border rounded-lg px-4 py-2"
                  />
                </div>
              </div>

              {/* Invoice Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Invoice Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Invoice Date *</label>
                    <input
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                      className="border rounded-lg px-4 py-2 w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="border rounded-lg px-4 py-2 w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Line Items</h3>
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="border rounded-lg px-3 py-2 col-span-6"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="border rounded-lg px-3 py-2 col-span-2"
                      min="1"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                      className="border rounded-lg px-3 py-2 col-span-3"
                      step="0.01"
                      min="0"
                      required
                    />
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800 col-span-1"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                >
                  + Add Item
                </button>
              </div>

              {/* Tax and Notes */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
                    <input
                      type="number"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                      className="border rounded-lg px-4 py-2 w-full"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="text-right w-full">
                      <span className="text-sm text-gray-600">Total Amount</span>
                      <p className="text-2xl font-bold text-blue-600">
                        ${calculateTotal()}
                      </p>
                    </div>
                  </div>
                </div>
                <textarea
                  placeholder="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="border rounded-lg px-4 py-2 w-full"
                  rows="2"
                />
                <textarea
                  placeholder="Terms and Conditions"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  className="border rounded-lg px-4 py-2 w-full mt-2"
                  rows="2"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
