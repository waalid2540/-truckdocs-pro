import Layout from '../components/Layout'
import { Receipt, Plus } from 'lucide-react'

export default function Expenses() {
  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Expenses</h1>
            <p className="text-gray-600 mt-2">Track your business expenses</p>
          </div>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Expense
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">This Month</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">$0.00</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Tax Deductible</p>
            <p className="text-2xl font-bold text-green-600 mt-2">$0.00</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Expenses</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">0</p>
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-6">Recent Expenses</h2>
          <div className="text-center py-12 text-gray-500">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No expenses recorded yet</p>
            <p className="text-sm mt-2">Add your first expense to start tracking!</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
