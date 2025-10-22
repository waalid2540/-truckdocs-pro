import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Truck, CheckCircle, Clock, XCircle, Package, MapPin } from 'lucide-react'
import axios from '../api/axios'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800'
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('driver') // 'driver' or 'broker'
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    fetchBookings()
  }, [activeTab, filterStatus])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const endpoint = activeTab === 'driver' ? '/api/bookings/my/driver' : '/api/bookings/my/broker'
      const params = filterStatus ? `?status=${filterStatus}` : ''

      const response = await axios.get(`${endpoint}${params}`)
      setBookings(response.data.bookings || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (bookingId) => {
    const rateConNumber = prompt('Enter rate confirmation number:')
    if (!rateConNumber) return

    try {
      await axios.put(`/api/bookings/${bookingId}/confirm`, {
        rate_confirmation_number: rateConNumber
      })
      alert('Booking confirmed!')
      fetchBookings()
    } catch (error) {
      console.error('Error confirming booking:', error)
      alert('Failed to confirm booking')
    }
  }

  const handleReject = async (bookingId) => {
    const reason = prompt('Reason for rejection (optional):')

    try {
      await axios.put(`/api/bookings/${bookingId}/reject`, { reason })
      alert('Booking rejected')
      fetchBookings()
    } catch (error) {
      console.error('Error rejecting booking:', error)
      alert('Failed to reject booking')
    }
  }

  const handlePickup = async (bookingId) => {
    const bolNumber = prompt('Enter BOL number:')
    if (!bolNumber) return

    try {
      await axios.put(`/api/bookings/${bookingId}/pickup`, {
        bol_number: bolNumber
      })
      alert('Marked as picked up!')
      fetchBookings()
    } catch (error) {
      console.error('Error marking pickup:', error)
      alert('Failed to mark as picked up')
    }
  }

  const handleDeliver = async (bookingId) => {
    try {
      await axios.put(`/api/bookings/${bookingId}/deliver`, {})
      alert('Marked as delivered!')
      fetchBookings()
    } catch (error) {
      console.error('Error marking delivery:', error)
      alert('Failed to mark as delivered')
    }
  }

  const handleComplete = async (bookingId) => {
    const paymentDate = prompt('Enter payment date (YYYY-MM-DD):')
    if (!paymentDate) return

    try {
      await axios.put(`/api/bookings/${bookingId}/complete`, {
        payment_date: paymentDate
      })
      alert('Booking completed!')
      fetchBookings()
    } catch (error) {
      console.error('Error completing booking:', error)
      alert('Failed to complete booking')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Bookings</h1>
          <p className="text-gray-600 mt-2">Track and manage your load bookings</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b flex">
            <button
              onClick={() => setActiveTab('driver')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'driver'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                As Driver
              </div>
            </button>
            <button
              onClick={() => setActiveTab('broker')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'broker'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                As Broker
              </div>
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 border-b">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-4 py-2"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Bookings List */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No bookings found</p>
                <p className="text-sm mt-2">
                  {activeTab === 'driver'
                    ? 'Book loads from the Load Board to see them here'
                    : 'Bookings for your loads will appear here'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Route */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-green-600" />
                            <span className="font-semibold">{booking.origin_city}, {booking.origin_state}</span>
                          </div>
                          <span className="text-gray-400">→</span>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-red-600" />
                            <span className="font-semibold">{booking.destination_city}, {booking.destination_state}</span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="capitalize">{booking.equipment_type?.replace('_', ' ')}</span>
                          <span>Pickup: {formatDate(booking.pickup_date)}</span>
                          {booking.load_number && <span>Load #{booking.load_number}</span>}
                          {booking.rate_confirmation_number && (
                            <span>RC #: {booking.rate_confirmation_number}</span>
                          )}
                        </div>

                        {/* Contact Info */}
                        {activeTab === 'driver' && booking.broker_company_name && (
                          <div className="text-sm text-gray-600">
                            Broker: <span className="font-medium">{booking.broker_company_name}</span>
                          </div>
                        )}
                        {activeTab === 'broker' && booking.driver_name && (
                          <div className="text-sm text-gray-600">
                            Driver: <span className="font-medium">{booking.driver_name}</span>
                            {booking.driver_phone && ` • ${booking.driver_phone}`}
                          </div>
                        )}

                        {/* BOL Info */}
                        {booking.bol_number && (
                          <div className="text-sm text-gray-600 mt-1">
                            BOL #: {booking.bol_number}
                          </div>
                        )}
                      </div>

                      <div className="text-right ml-4">
                        {/* Status */}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status]}`}>
                          {booking.status.replace('_', ' ').toUpperCase()}
                        </span>

                        {/* Rate */}
                        <div className="text-2xl font-bold text-green-600 mt-2">
                          {formatCurrency(booking.agreed_rate)}
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex flex-col gap-2">
                          {/* Driver Actions */}
                          {activeTab === 'driver' && booking.status === 'confirmed' && (
                            <button
                              onClick={() => handlePickup(booking.id)}
                              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            >
                              Mark Picked Up
                            </button>
                          )}
                          {activeTab === 'driver' && booking.status === 'in_transit' && (
                            <button
                              onClick={() => handleDeliver(booking.id)}
                              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              Mark Delivered
                            </button>
                          )}

                          {/* Broker Actions */}
                          {activeTab === 'broker' && booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleConfirm(booking.id)}
                                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => handleReject(booking.id)}
                                className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {activeTab === 'broker' && booking.status === 'delivered' && (
                            <button
                              onClick={() => handleComplete(booking.id)}
                              className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                            >
                              Complete & Pay
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
