import Layout from '../components/Layout'
import { Fuel, Plus, Download } from 'lucide-react'

export default function IFTA() {
  const currentYear = new Date().getFullYear()
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">IFTA Management</h1>
            <p className="text-gray-600 mt-2">Track fuel purchases and generate quarterly reports</p>
          </div>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Fuel Purchase
          </button>
        </div>

        {/* Current Quarter */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white mb-8">
          <h2 className="text-xl font-bold mb-2">Current Quarter: {currentYear}-Q{currentQuarter}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div>
              <p className="text-purple-200 text-sm">Total Gallons</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Total Cost</p>
              <p className="text-2xl font-bold">$0.00</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Records</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
          <button className="mt-4 bg-white text-purple-600 px-6 py-2 rounded-lg hover:bg-purple-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Generate Report
          </button>
        </div>

        {/* Recent Records */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-6">Recent Fuel Purchases</h2>
          <div className="text-center py-12 text-gray-500">
            <Fuel className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No fuel purchases recorded yet</p>
            <p className="text-sm mt-2">Add your first fuel purchase to start IFTA tracking!</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
