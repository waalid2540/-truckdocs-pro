import { useState, useEffect } from 'react'
import axios from 'axios'
import { Truck, FileText, DollarSign, Fuel, TrendingUp, Receipt, Bell, AlertCircle, Calendar, CheckCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboard()
    fetchReminders()
  }, [])

  const fetchDashboard = async () => {
    try {
      console.log('Fetching dashboard data...')
      const response = await axios.get('/api/user/dashboard')
      console.log('Dashboard data:', response.data)
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
      console.error('Error details:', error.response?.data || error.message)
      // Don't show error, just use default stats
      setStats({
        documents: { count: 0 },
        invoices: { total: 0, paid: 0, unpaid: 0 },
        expenses: { count: 0, total: 0 },
        ifta: { count: 0, gallons: 0, cost: 0 }
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchReminders = async () => {
    try {
      const response = await axios.get('/api/reminders/upcoming')
      setReminders(response.data.reminders || [])
    } catch (error) {
      console.error('Failed to fetch reminders:', error)
      setReminders([])
    }
  }

  const handleCompleteReminder = async (id) => {
    try {
      await axios.put(`/api/reminders/${id}/complete`)
      // Remove from list
      setReminders(reminders.filter(r => r.id !== id))
    } catch (error) {
      console.error('Failed to complete reminder:', error)
    }
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your overview.</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={FileText}
                label="Documents"
                value={stats?.documents?.count || 0}
                color="bg-blue-500"
                link="/documents"
              />
              <StatCard
                icon={DollarSign}
                label="Unpaid Invoices"
                value={`$${(stats?.invoices?.unpaid || 0).toFixed(2)}`}
                color="bg-green-500"
                link="/invoices"
              />
              <StatCard
                icon={Receipt}
                label="Monthly Expenses"
                value={`$${(stats?.expenses?.total || 0).toFixed(2)}`}
                color="bg-red-500"
                link="/expenses"
              />
              <StatCard
                icon={Fuel}
                label="IFTA Records"
                value={stats?.ifta?.count || 0}
                color="bg-purple-500"
                link="/ifta"
              />
            </div>

            {/* Reminders & Notifications */}
            {reminders.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-500" />
                  Upcoming Reminders
                </h2>
                <div className="space-y-3">
                  {reminders.slice(0, 4).map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onComplete={handleCompleteReminder}
                    />
                  ))}
                </div>
                {reminders.length > 4 && (
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    + {reminders.length - 4} more reminders
                  </p>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <ActionButton to="/ai-assistant" label="AI Assistant" />
                <ActionButton to="/receipt-scanner" label="Scan Receipt" />
                <ActionButton to="/signature" label="Sign Document" />
                <ActionButton to="/ifta" label="IFTA Report" />
              </div>
            </div>

            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Welcome to TruckDocs Pro!</h3>
              <p className="text-blue-100">
                Your all-in-one document management system with AI-powered features, OCR scanning, digital signatures, and automated reminders.
              </p>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

function StatCard({ icon: Icon, label, value, color, link }) {
  return (
    <Link to={link} className="block">
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">{label}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
          </div>
          <div className={`${color} p-3 rounded-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </Link>
  )
}

function ActionButton({ to, label }) {
  return (
    <Link
      to={to}
      className="bg-blue-600 text-white py-3 px-6 rounded-lg text-center hover:bg-blue-700 transition-colors font-medium"
    >
      {label}
    </Link>
  )
}

function ReminderCard({ reminder, onComplete }) {
  const daysUntil = Math.ceil((new Date(reminder.due_date) - new Date()) / (1000 * 60 * 60 * 24))

  const priorityColors = {
    high: 'border-l-red-500 bg-red-50',
    medium: 'border-l-yellow-500 bg-yellow-50',
    low: 'border-l-blue-500 bg-blue-50'
  }

  const priorityIcons = {
    high: AlertCircle,
    medium: Calendar,
    low: Bell
  }

  const Icon = priorityIcons[reminder.priority] || Bell

  return (
    <div className={`border-l-4 ${priorityColors[reminder.priority]} p-4 rounded-r-lg flex items-start justify-between gap-4`}>
      <div className="flex items-start gap-3 flex-1">
        <Icon className={`w-5 h-5 mt-0.5 ${reminder.priority === 'high' ? 'text-red-600' : reminder.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'}`} />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{reminder.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
          <p className="text-xs text-gray-500 mt-2">
            Due: {new Date(reminder.due_date).toLocaleDateString()}
            {daysUntil >= 0 && ` (in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'})`}
          </p>
        </div>
      </div>
      <button
        onClick={() => onComplete(reminder.id)}
        className="text-green-600 hover:text-green-700 flex-shrink-0"
        title="Mark as complete"
      >
        <CheckCircle className="w-5 h-5" />
      </button>
    </div>
  )
}
