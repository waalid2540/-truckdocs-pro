import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Receipt, Plus, Trash2, Edit, X } from 'lucide-react'
import axios from '../api/axios'

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    category: 'fuel',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    vendor_name: '',
    payment_method: 'card',
    is_tax_deductible: true,
    notes: ''
  })

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const response = await axios.get('/api/expenses')
      setExpenses(response.data.expenses || [])
    } catch (error) {
      console.error('Failed to fetch expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/expenses', formData)
      setShowModal(false)
      setFormData({
        category: 'fuel',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        vendor_name: '',
        payment_method: 'card',
        is_tax_deductible: true,
        notes: ''
      })
      await fetchExpenses()
    } catch (error) {
      console.error('Failed to create expense:', error)
      alert('Failed to create expense: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    try {
      await axios.delete(`/api/expenses/${id}`)
      await fetchExpenses()
    } catch (error) {
      console.error('Failed to delete expense:', error)
      alert('Failed to delete expense')
    }
  }

  const stats = {
    thisMonth: expenses
      .filter(e => new Date(e.expense_date).getMonth() === new Date().getMonth())
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    taxDeductible: expenses
      .filter(e => e.is_tax_deductible)
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    total: expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Expenses</h1>
            <p className="text-gray-600 mt-2">Track your business expenses</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Expense
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">This Month</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">${stats.thisMonth.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Tax Deductible</p>
            <p className="text-2xl font-bold text-green-600 mt-2">${stats.taxDeductible.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Expenses</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{expenses.length}</p>
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-6">Recent Expenses</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No expenses tracked yet</p>
              <p className="text-sm mt-2">Add your first expense to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Description</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-left py-3 px-4">Vendor</th>
                    <th className="text-right py-3 px-4">Amount</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{new Date(expense.expense_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{expense.description}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">{expense.vendor_name || '-'}</td>
                      <td className="py-3 px-4 text-right font-semibold">${parseFloat(expense.amount).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Expense Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Add Expense</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        required
                      >
                        <option value="fuel">Fuel</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="food">Food</option>
                        <option value="lodging">Lodging</option>
                        <option value="tolls">Tolls</option>
                        <option value="insurance">Insurance</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Amount *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description *</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Date *</label>
                      <input
                        type="date"
                        value={formData.expense_date}
                        onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Vendor</label>
                      <input
                        type="text"
                        value={formData.vendor_name}
                        onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Method</label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="card">Card</option>
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_tax_deductible}
                        onChange={(e) => setFormData({ ...formData, is_tax_deductible: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Tax Deductible</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      rows="3"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                    >
                      Add Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
