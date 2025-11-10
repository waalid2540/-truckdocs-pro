import { useState, useEffect } from 'react'
import axios from '../api/axios'
import { Truck, FileText, DollarSign, Fuel, TrendingUp, Receipt, Bell, AlertCircle, Calendar, CheckCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { Link } from 'react-router-dom'
import DocumentAlerts from '../components/DocumentAlerts'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [reminders, setReminders] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboard()
    fetchReminders()
    fetchSubscription()
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

  const fetchSubscription = async () => {
    try {
      const response = await axios.get('/api/stripe/subscription-status')
      setSubscription(response.data)
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
      setSubscription({ hasSubscription: false })
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

  // Calculate trial days remaining
  const getTrialInfo = () => {
    if (!subscription || subscription.status !== 'trialing') return null

    const trialEnd = new Date(subscription.trialEnd)
    const now = new Date()
    const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24))

    return {
      daysRemaining,
      trialEnd: trialEnd.toLocaleDateString()
    }
  }

  const trialInfo = getTrialInfo()

  // Check if user needs to subscribe
  const needsSubscription = subscription && !subscription.hasSubscription

  return (
    <Layout>
      <div className="p-12 bg-white min-h-screen">
        {/* Hero Section - PREMIUM */}
        <div className="mb-12">
          <h1 className="text-5xl font-black text-gray-900 mb-3">Dashboard</h1>
          <p className="text-xl text-gray-600 font-semibold">Complete overview of your trucking business</p>
        </div>

        {/* SUBSCRIBE NOW Banner - For users without subscription */}
        {needsSubscription && (
          <div className="mb-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-2xl p-8 text-white border-4 border-green-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <h2 className="text-3xl font-black mb-2">🚀 Start Your 7-Day FREE Trial!</h2>
                <p className="text-green-100 text-lg mb-4">
                  Get instant access to IFTA calculator, AI assistant, receipt scanner, and all premium features.
                </p>
                <ul className="space-y-2 text-green-100">
                  <li className="flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    <span className="font-semibold">7 days completely FREE - No charge until trial ends</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    <span className="font-semibold">Save $500+/quarter on IFTA taxes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    <span className="font-semibold">Only $19.99/month after trial - Cancel anytime</span>
                  </li>
                </ul>
              </div>
              <div className="flex-shrink-0">
                <Link
                  to="/subscribe"
                  className="block bg-white text-green-600 px-10 py-5 rounded-xl font-black text-xl hover:bg-green-50 transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105"
                >
                  Start Free Trial Now →
                </Link>
                <p className="text-center text-green-100 text-sm mt-3">
                  No credit card charged for 7 days
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trial Status Banner */}
        {trialInfo && (
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-2xl p-6 text-white border-4 border-blue-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Calendar className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    {trialInfo.daysRemaining === 1
                      ? '1 Day Left in Your Free Trial!'
                      : `${trialInfo.daysRemaining} Days Left in Your Free Trial!`}
                  </h3>
                  <p className="text-blue-100">
                    Your trial ends on <strong>{trialInfo.trialEnd}</strong>.
                    You'll be automatically charged $19.99/month after that.
                  </p>
                </div>
              </div>
              <Link
                to="/settings"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                Manage Subscription
              </Link>
            </div>
            <div className="mt-4 bg-white/10 rounded-lg p-4">
              <p className="text-sm text-blue-100">
                <strong>Cancel anytime before {trialInfo.trialEnd}</strong> to avoid being charged.
                No questions asked, no fees.
              </p>
            </div>
          </div>
        )}

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

            {/* Load Board Stats - PREMIUM */}
            <div className="mb-12">
              <h2 className="text-3xl font-black text-gray-900 mb-6">Freight Marketplace</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Link to="/load-board" className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8 hover:shadow-2xl hover:border-blue-500 transition-all duration-200 transform hover:-translate-y-2 group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg">
                      <Truck className="w-10 h-10 text-white" />
                    </div>
                    <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-black">LIVE</div>
                  </div>
                  <h3 className="font-black text-gray-900 text-xl mb-4 uppercase tracking-wide">Available Loads</h3>
                  <p className="text-6xl font-black text-gray-900 mb-3">247</p>
                  <p className="text-base text-gray-600 font-semibold">Active freight opportunities nationwide</p>
                </Link>

                <Link to="/my-bookings" className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8 hover:shadow-2xl hover:border-green-500 transition-all duration-200 transform hover:-translate-y-2 group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl shadow-lg">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-black">ACTIVE</div>
                  </div>
                  <h3 className="font-black text-gray-900 text-xl mb-4 uppercase tracking-wide">Active Bookings</h3>
                  <p className="text-6xl font-black text-gray-900 mb-3">12</p>
                  <p className="text-base text-gray-600 font-semibold">Loads currently in progress</p>
                </Link>

                <Link to="/post-load" className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl border-2 border-indigo-700 p-8 hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-2 hover:scale-105 group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-white/20 p-4 rounded-xl">
                      <TrendingUp className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="font-black text-white text-xl mb-4 uppercase tracking-wide">Post New Load</h3>
                  <p className="text-4xl font-black text-white mb-3">Start Posting</p>
                  <p className="text-base text-indigo-100 font-semibold">Connect with carriers nationwide</p>
                </Link>
              </div>
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
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8 hover:shadow-2xl hover:border-blue-300 transition-all duration-200 transform hover:-translate-y-2">
        <div className="flex items-center justify-between mb-6">
          <div className={`${color} p-4 rounded-xl shadow-lg`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          {trend && (
            <div className={`px-4 py-2 rounded-full text-sm font-black flex items-center gap-2 ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <TrendingUp className={`w-5 h-5 ${!trendUp && 'rotate-180'}`} />
              {trend}
            </div>
          )}
        </div>
        <p className="text-gray-600 text-base font-bold uppercase tracking-wide mb-3">{label}</p>
        <p className="text-5xl font-black text-gray-900">{value}</p>
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
