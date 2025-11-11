import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import axios from '../api/axios'
import { User, CreditCard, Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Settings</h1>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <Tab
                active={activeTab === 'profile'}
                onClick={() => setActiveTab('profile')}
                icon={User}
                label="Profile"
              />
              <Tab
                active={activeTab === 'subscription'}
                onClick={() => setActiveTab('subscription')}
                icon={CreditCard}
                label="Subscription"
              />
              <Tab
                active={activeTab === 'notifications'}
                onClick={() => setActiveTab('notifications')}
                icon={Bell}
                label="Notifications"
              />
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && <ProfileTab user={user} />}
            {activeTab === 'subscription' && <SubscriptionTab user={user} />}
            {activeTab === 'notifications' && <NotificationsTab />}
          </div>
        </div>
      </div>
    </Layout>
  )
}

function Tab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-600 hover:text-gray-800'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  )
}

function ProfileTab({ user }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-gray-700 font-medium mb-2">Full Name</label>
        <input
          type="text"
          defaultValue={user?.full_name}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <div>
        <label className="block text-gray-700 font-medium mb-2">Email</label>
        <input
          type="email"
          defaultValue={user?.email}
          disabled
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
        />
      </div>
      <div>
        <label className="block text-gray-700 font-medium mb-2">Phone</label>
        <input
          type="tel"
          defaultValue={user?.phone}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <div>
        <label className="block text-gray-700 font-medium mb-2">Company Name</label>
        <input
          type="text"
          defaultValue={user?.company_name}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
        Save Changes
      </button>
    </div>
  )
}

function SubscriptionTab({ user }) {
  const navigate = useNavigate()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await axios.get('/api/stripe/subscription-status')
      setSubscription(response.data)
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    try {
      const response = await axios.post('/api/stripe/create-checkout-session')
      if (response.data.url) {
        window.location.href = response.data.url
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      alert('Failed to start subscription. Please try again.')
    }
  }

  const handleManageBilling = async () => {
    try {
      setLoading(true)
      const response = await axios.post('/api/stripe/create-portal-session')
      if (response.data.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = response.data.url
      } else {
        alert('Failed to open billing portal. Please contact support.')
      }
    } catch (error) {
      console.error('Failed to create portal session:', error)
      const errorMessage = error.response?.data?.message || error.message
      alert(`Error: ${errorMessage}\n\nPlease contact support if this continues.`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading subscription...</p>
      </div>
    )
  }

  const trialEndsDate = subscription?.trialEnd ? new Date(subscription.trialEnd) : null
  const daysLeft = trialEndsDate ? Math.ceil((trialEndsDate - new Date()) / (1000 * 60 * 60 * 24)) : 7
  const periodEndDate = subscription?.periodEnd ? new Date(subscription.periodEnd) : null

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-blue-900">FreightHub Pro</h3>
            <p className="text-blue-700">$19.99/month</p>
          </div>
          <div className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold">
            {subscription?.status === 'trialing' ? '7-Day Trial' : subscription?.status === 'active' ? 'Active' : 'No Subscription'}
          </div>
        </div>

        {subscription?.status === 'trialing' && (
          <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
            <p className="font-semibold text-gray-800">
              Your free trial ends in {daysLeft} days
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Trial ends: {trialEndsDate?.toLocaleDateString()}
            </p>
          </div>
        )}

        {subscription?.status === 'active' && (
          <div className="bg-white rounded-lg p-4">
            <p className="font-semibold text-gray-800">Subscription Active</p>
            <p className="text-sm text-gray-600 mt-1">
              Next billing date: {periodEndDate?.toLocaleDateString()}
            </p>
            {subscription?.cancelAtPeriodEnd && (
              <p className="text-sm text-orange-600 mt-2 font-semibold">
                Your subscription will cancel on {periodEndDate?.toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {!subscription?.hasSubscription && (
          <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500">
            <p className="font-semibold text-gray-800">
              No active subscription
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Start your 7-day free trial to access all features
            </p>
          </div>
        )}
      </div>

      {/* Features Included */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-bold text-lg mb-4">Your Plan Includes:</h4>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> AI Document Assistant (GPT-4)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> OCR Receipt Scanner
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Digital Signature + PDF Export
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Unlimited IFTA Reports
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Unlimited Invoices & Expenses
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> All Future Updates
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {!subscription?.hasSubscription && (
          <button
            onClick={handleSubscribe}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-lg hover:from-green-700 hover:to-emerald-700 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
          >
            🚀 Start 7-Day FREE Trial
          </button>
        )}

        {(subscription?.status === 'trialing' || subscription?.status === 'active') && (
          <div className="space-y-3">
            <button
              onClick={handleManageBilling}
              className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Manage Billing & Payment Method
            </button>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-bold text-gray-800 mb-2">Need to cancel?</h4>
              <p className="text-sm text-gray-600 mb-3">
                Click "Manage Billing" above to access Stripe Customer Portal where you can:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mb-3">
                <li>• Cancel your subscription</li>
                <li>• Update payment method</li>
                <li>• View invoices & receipts</li>
                <li>• Download payment history</li>
              </ul>
              <p className="text-xs text-gray-500 italic">
                If you cancel, you'll keep access until the end of your billing period.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function NotificationsTab() {
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3">
        <input type="checkbox" className="w-5 h-5" defaultChecked />
        <span>Email notifications for invoices</span>
      </label>
      <label className="flex items-center gap-3">
        <input type="checkbox" className="w-5 h-5" defaultChecked />
        <span>IFTA report reminders</span>
      </label>
      <label className="flex items-center gap-3">
        <input type="checkbox" className="w-5 h-5" />
        <span>Weekly summary emails</span>
      </label>
    </div>
  )
}
