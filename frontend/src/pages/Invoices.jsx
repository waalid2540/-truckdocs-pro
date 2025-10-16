import Layout from '../components/Layout'
import { DollarSign, Plus } from 'lucide-react'

export default function Invoices() {
  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Invoices</h1>
            <p className="text-gray-600 mt-2">Create and manage your invoices</p>
          </div>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Invoice
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-2">$0.00</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Outstanding</p>
            <p className="text-2xl font-bold text-yellow-600 mt-2">$0.00</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Invoices</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">0</p>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-6">Recent Invoices</h2>
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No invoices created yet</p>
            <p className="text-sm mt-2">Create your first invoice to get started!</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
