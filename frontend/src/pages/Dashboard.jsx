import { useState, useEffect } from 'react'
import axios from '../api/axios'
import { Truck, FileText, DollarSign, Fuel, TrendingUp, Receipt, Bell, AlertCircle, Calendar, CheckCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { Link } from 'react-router-dom'
import DocumentAlerts from '../components/DocumentAlerts'

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
      <div className="p-8 bg-gray-50 min-h-screen">
        {/* Hero Section */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">TruckDocs Pro</h1>
              <p className="text-blue-100 text-lg">Enterprise Document Management & Freight Marketplace</p>
            </div>
            <div className="hidden md:block">
              <Truck className="w-20 h-20 text-blue-300 opacity-50" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-6 text-gray-600 text-lg">Loading your dashboard...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6" />
              <span>{error}</span>
            </div>
          </div>
        ) : (
          <>
            {/* Primary Stats Grid - Enhanced */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={FileText}
                label="Total Documents"
                value={stats?.documents?.count || 0}
                trend="+12%"
                trendUp={true}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
                link="/documents"
              />
              <StatCard
                icon={DollarSign}
                label="Pending Revenue"
                value={`$${(stats?.invoices?.unpaid || 0).toLocaleString()}`}
                trend="+8%"
                trendUp={true}
                color="bg-gradient-to-br from-green-500 to-green-600"
                link="/invoices"
              />
              <StatCard
                icon={Receipt}
                label="Monthly Expenses"
                value={`$${(stats?.expenses?.total || 0).toLocaleString()}`}
                trend="-5%"
                trendUp={false}
                color="bg-gradient-to-br from-orange-500 to-orange-600"
                link="/expenses"
              />
              <StatCard
                icon={Fuel}
                label="IFTA Records"
                value={stats?.ifta?.count || 0}
                trend="+15"
                trendUp={true}
                color="bg-gradient-to-br from-purple-500 to-purple-600"
                link="/ifta"
              />
            </div>

            {/* Load Board Stats - New Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Link to="/load-board" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-700">Available Loads</h3>
                  <Truck className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-2">247</p>
                <p className="text-sm text-gray-500">Active freight opportunities</p>
              </Link>

              <Link to="/my-bookings" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-700">Active Bookings</h3>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-2">12</p>
                <p className="text-sm text-gray-500">Loads in progress</p>
              </Link>

              <Link to="/post-load" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border-l-4 border-indigo-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-700">Post New Load</h3>
                  <TrendingUp className="w-8 h-8 text-indigo-500" />
                </div>
                <p className="text-2xl font-bold text-indigo-600 mb-2">Start Posting</p>
                <p className="text-sm text-gray-500">Connect with carriers nationwide</p>
              </Link>
            </div>

            {/* Document Expiration Alerts */}
            <div className="mb-8">
              <DocumentAlerts />
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

            {/* Quick Actions - Enterprise Style */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <ActionButton to="/ai-assistant" label="AI Assistant" icon="🤖" />
                <ActionButton to="/receipt-scanner" label="Scan Receipt" icon="📸" />
                <ActionButton to="/signature" label="Sign Document" icon="✍️" />
                <ActionButton to="/ifta" label="IFTA Report" icon="⛽" />
              </div>
            </div>

            {/* Enterprise Features Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-3">AI-Powered Automation</h3>
                <p className="text-blue-100 mb-4">
                  Streamline your operations with intelligent document processing, OCR scanning, and automated compliance tracking.
                </p>
                <Link to="/ai-assistant" className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                  Try AI Assistant
                  <TrendingUp className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl shadow-xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-3">Freight Marketplace</h3>
                <p className="text-green-100 mb-4">
                  Connect with thousands of carriers and shippers. Post loads, find freight, and manage bookings all in one platform.
                </p>
                <Link to="/load-board" className="inline-flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
                  Browse Loads
                  <Truck className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

function StatCard({ icon: Icon, label, value, color, link, trend, trendUp }) {
  return (
    <Link to={link} className="block group">
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-4">
          <div className={`${color} p-3 rounded-lg shadow-lg`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          {trend && (
            <span className={`text-sm font-semibold flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-4 h-4 ${!trendUp && 'rotate-180'}`} />
              {trend}
            </span>
          )}
        </div>
        <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </Link>
  )
}

function ActionButton({ to, label, icon }) {
  return (
    <Link
      to={to}
      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl text-center hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
    >
      <span className="text-2xl">{icon}</span>
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
