import { useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { User, CreditCard, Bell } from 'lucide-react'

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
  const trialEndsDate = user?.trial_ends_at ? new Date(user.trial_ends_at) : null
  const daysLeft = trialEndsDate ? Math.ceil((trialEndsDate - new Date()) / (1000 * 60 * 60 * 24)) : 7

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-blue-900">TruckDocs Pro</h3>
            <p className="text-blue-700">$19.99/month</p>
          </div>
          <div className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold">
            {user?.subscription_status === 'trial' ? '7-Day Trial' : 'Active'}
          </div>
        </div>

        {user?.subscription_status === 'trial' && (
          <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
            <p className="font-semibold text-gray-800">
              Your free trial ends in {daysLeft} days
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Trial ends: {trialEndsDate?.toLocaleDateString()}
            </p>
          </div>
        )}

        {user?.subscription_status === 'active' && (
          <div className="bg-white rounded-lg p-4">
            <p className="font-semibold text-gray-800">Subscription Active</p>
            <p className="text-sm text-gray-600 mt-1">
              Next billing date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
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
      <div className="flex gap-4">
        {user?.subscription_status === 'trial' && (
          <button className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold">
            Subscribe Now - $19.99/month
          </button>
        )}
        {user?.subscription_status === 'active' && (
          <>
            <button className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
              Manage Billing
            </button>
            <button className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700">
              Cancel Subscription
            </button>
          </>
        )}
      </div>

      {/* Demo Mode Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Demo Mode:</strong> Stripe payment integration requires setup. Contact support for production deployment.
        </p>
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
