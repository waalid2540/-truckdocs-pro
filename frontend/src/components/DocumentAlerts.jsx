import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, XCircle, Bell, BellOff } from 'lucide-react'
import axios from '../api/axios'

export default function DocumentAlerts() {
  const [summary, setSummary] = useState({
    expired_count: 0,
    expiring_this_week: 0,
    expiring_this_month: 0
  })
  const [expiringDocs, setExpiringDocs] = useState([])
  const [expiredDocs, setExpiredDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('expiring') // 'expiring' or 'expired'

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const [summaryRes, expiringRes, expiredRes] = await Promise.all([
        axios.get('/api/document-alerts/summary'),
        axios.get('/api/document-alerts/expiring?days=30'),
        axios.get('/api/document-alerts/expired')
      ])

      setSummary(summaryRes.data.summary)
      setExpiringDocs(expiringRes.data.expiring_documents)
      setExpiredDocs(expiredRes.data.expired_documents)
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const snoozeAlert = async (docId, days = 7) => {
    try {
      await axios.put(`/api/document-alerts/${docId}/snooze`, { days })
      fetchAlerts() // Refresh
    } catch (error) {
      console.error('Error snoozing alert:', error)
      alert('Failed to snooze alert')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getUrgencyColor = (daysUntil) => {
    if (daysUntil <= 3) return 'bg-red-100 text-red-800 border-red-200'
    if (daysUntil <= 7) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }

  const totalAlerts = parseInt(summary.expired_count || 0) +
                      parseInt(summary.expiring_this_week || 0) +
                      parseInt(summary.expiring_this_month || 0)

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Loading alerts...</p>
      </div>
    )
  }

  if (totalAlerts === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-full">
            <Bell className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-900">All Clear!</p>
            <p className="text-sm text-green-700">No document expiration alerts at this time</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Summary Stats */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Document Alerts</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <AlertTriangle className="w-4 h-4" />
            {totalAlerts} Alert{totalAlerts !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-red-900">Expired</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{summary.expired_count}</p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-orange-600" />
              <p className="text-sm font-medium text-orange-900">This Week</p>
            </div>
            <p className="text-2xl font-bold text-orange-600">{summary.expiring_this_week}</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-5 h-5 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-900">This Month</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{summary.expiring_this_month}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('expiring')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'expiring'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Expiring Soon ({expiringDocs.length})
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'expired'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Expired ({expiredDocs.length})
          </button>
        </div>
      </div>

      {/* Document List */}
      <div className="p-6">
        {activeTab === 'expiring' ? (
          expiringDocs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No documents expiring soon</p>
          ) : (
            <div className="space-y-3">
              {expiringDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`border rounded-lg p-4 ${getUrgencyColor(doc.days_until_expiration)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{doc.title}</span>
                        <span className="text-xs px-2 py-1 bg-white rounded">
                          {doc.document_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <p>
                          Expires: <strong>{formatDate(doc.expiration_date)}</strong>
                        </p>
                        <p className="font-semibold">
                          {Math.floor(doc.days_until_expiration)} day{Math.floor(doc.days_until_expiration) !== 1 ? 's' : ''} remaining
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => snoozeAlert(doc.id, 7)}
                      className="flex items-center gap-1 px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm"
                      title="Snooze for 7 days"
                    >
                      <BellOff className="w-4 h-4" />
                      Snooze
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          expiredDocs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No expired documents</p>
          ) : (
            <div className="space-y-3">
              {expiredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-red-200 bg-red-50 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="font-semibold text-red-900">{doc.title}</span>
                        <span className="text-xs px-2 py-1 bg-white text-red-800 rounded">
                          {doc.document_type}
                        </span>
                      </div>
                      <div className="text-sm text-red-800">
                        <p>
                          Expired: <strong>{formatDate(doc.expiration_date)}</strong>
                        </p>
                        <p className="mt-1">
                          {Math.floor(doc.days_expired)} day{Math.floor(doc.days_expired) !== 1 ? 's' : ''} ago
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
