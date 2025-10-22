import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Search, MapPin, Calendar, DollarSign, Truck, Star, Phone, Mail, Eye, CheckCircle } from 'lucide-react'
import axios from '../api/axios'

const EQUIPMENT_TYPES = [
  { value: '', label: 'All Equipment' },
  { value: 'dry_van', label: 'Dry Van' },
  { value: 'reefer', label: 'Reefer' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'step_deck', label: 'Step Deck' },
  { value: 'lowboy', label: 'Lowboy' },
  { value: 'tanker', label: 'Tanker' },
  { value: 'auto_carrier', label: 'Auto Carrier' },
  { value: 'power_only', label: 'Power Only' }
]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

export default function LoadBoard() {
  const [loads, setLoads] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedLoad, setSelectedLoad] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [filters, setFilters] = useState({
    origin_state: '',
    origin_city: '',
    destination_state: '',
    destination_city: '',
    equipment_type: '',
    min_rate: '',
    pickup_date_start: '',
    sort_by: 'posted_at',
    sort_order: 'DESC'
  })

  useEffect(() => {
    searchLoads()
  }, [])

  const searchLoads = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key])
      })

      const response = await axios.get(`/api/loads/search?${params}`)
      setLoads(response.data.loads || [])
    } catch (error) {
      console.error('Error searching loads:', error)
      alert('Failed to search loads')
    } finally {
      setLoading(false)
    }
  }

  const handleBookLoad = async (loadId) => {
    const load = loads.find(l => l.id === loadId)
    if (!load) return

    const confirmed = confirm(`Book this load for $${load.total_rate}?`)
    if (!confirmed) return

    try {
      await axios.post('/api/bookings', {
        load_id: loadId,
        agreed_rate: load.total_rate
      })

      alert('Load booked successfully! Waiting for broker confirmation.')
      setShowDetails(false)
      searchLoads()
    } catch (error) {
      console.error('Error booking load:', error)
      alert(error.response?.data?.error || 'Failed to book load')
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
          <h1 className="text-3xl font-bold text-gray-800">Load Board</h1>
          <p className="text-gray-600 mt-2">Find and book freight loads from verified brokers</p>
        </div>

        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Origin State</label>
              <select
                value={filters.origin_state}
                onChange={(e) => setFilters({ ...filters, origin_state: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Any State</option>
                {US_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Origin City</label>
              <input
                type="text"
                value={filters.origin_city}
                onChange={(e) => setFilters({ ...filters, origin_city: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="City name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Destination State</label>
              <select
                value={filters.destination_state}
                onChange={(e) => setFilters({ ...filters, destination_state: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Any State</option>
                {US_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Equipment</label>
              <select
                value={filters.equipment_type}
                onChange={(e) => setFilters({ ...filters, equipment_type: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                {EQUIPMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Min Rate/Mile</label>
              <input
                type="number"
                step="0.01"
                value={filters.min_rate}
                onChange={(e) => setFilters({ ...filters, min_rate: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="$0.00"
              />
            </div>
          </div>

          <button
            onClick={searchLoads}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Searching...' : 'Search Loads'}
          </button>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Available Loads ({loads.length})</h2>
            <select
              value={filters.sort_by}
              onChange={(e) => {
                setFilters({ ...filters, sort_by: e.target.value })
                setTimeout(searchLoads, 100)
              }}
              className="border rounded-lg px-3 py-2"
            >
              <option value="posted_at">Newest First</option>
              <option value="pickup_date">Pickup Date</option>
              <option value="total_rate">Highest Rate</option>
              <option value="rate_per_mile">Best Rate/Mile</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Searching loads...</p>
            </div>
          ) : loads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No loads found matching your criteria</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {loads.map((load) => (
                <div
                  key={load.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedLoad(load)
                    setShowDetails(true)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-green-600" />
                          <span className="font-semibold">{load.origin_city}, {load.origin_state}</span>
                        </div>
                        <span className="text-gray-400">→</span>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-red-600" />
                          <span className="font-semibold">{load.destination_city}, {load.destination_state}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Truck className="w-4 h-4" />
                          <span className="capitalize">{load.equipment_type.replace('_', ' ')}</span>
                        </div>
                        {load.distance_miles && (
                          <span>{load.distance_miles} miles</span>
                        )}
                        {load.weight && (
                          <span>{load.weight.toLocaleString()} lbs</span>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Pickup: {formatDate(load.pickup_date)}</span>
                        </div>
                      </div>

                      {load.broker_company_name && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Broker:</span>
                          <span className="font-medium">{load.broker_company_name}</span>
                          {load.broker_rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span>{load.broker_rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(load.total_rate)}
                      </div>
                      {load.rate_per_mile && (
                        <div className="text-sm text-gray-600">
                          {formatCurrency(load.rate_per_mile)}/mile
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedLoad(load)
                          setShowDetails(true)
                        }}
                        className="mt-2 bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load Details Modal */}
        {showDetails && selectedLoad && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-2xl font-bold">Load Details</h2>
                <button onClick={() => setShowDetails(false)} className="text-gray-500 hover:text-gray-700">
                  <Eye className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Route */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Route</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-5 h-5 text-green-600" />
                        <span className="font-semibold">Origin</span>
                      </div>
                      <p className="text-gray-700">{selectedLoad.origin_city}, {selectedLoad.origin_state} {selectedLoad.origin_zip}</p>
                      {selectedLoad.origin_address && <p className="text-sm text-gray-600">{selectedLoad.origin_address}</p>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-5 h-5 text-red-600" />
                        <span className="font-semibold">Destination</span>
                      </div>
                      <p className="text-gray-700">{selectedLoad.destination_city}, {selectedLoad.destination_state} {selectedLoad.destination_zip}</p>
                      {selectedLoad.destination_address && <p className="text-sm text-gray-600">{selectedLoad.destination_address}</p>}
                    </div>
                  </div>
                </div>

                {/* Load Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Equipment Type</p>
                    <p className="font-semibold capitalize">{selectedLoad.equipment_type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pickup Date</p>
                    <p className="font-semibold">{formatDate(selectedLoad.pickup_date)}</p>
                  </div>
                  {selectedLoad.weight && (
                    <div>
                      <p className="text-sm text-gray-600">Weight</p>
                      <p className="font-semibold">{selectedLoad.weight.toLocaleString()} lbs</p>
                    </div>
                  )}
                  {selectedLoad.distance_miles && (
                    <div>
                      <p className="text-sm text-gray-600">Distance</p>
                      <p className="font-semibold">{selectedLoad.distance_miles} miles</p>
                    </div>
                  )}
                </div>

                {/* Rate */}
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Rate</p>
                      <p className="text-3xl font-bold text-green-600">{formatCurrency(selectedLoad.total_rate)}</p>
                    </div>
                    {selectedLoad.rate_per_mile && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Per Mile</p>
                        <p className="text-xl font-semibold">{formatCurrency(selectedLoad.rate_per_mile)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Broker Info */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Broker Information</h3>
                  <div className="space-y-2">
                    {selectedLoad.broker_company_name && (
                      <p><span className="text-gray-600">Company:</span> <span className="font-medium">{selectedLoad.broker_company_name}</span></p>
                    )}
                    {selectedLoad.contact_name && (
                      <p><span className="text-gray-600">Contact:</span> {selectedLoad.contact_name}</p>
                    )}
                    {selectedLoad.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-600" />
                        <a href={`tel:${selectedLoad.contact_phone}`} className="text-blue-600 hover:underline">
                          {selectedLoad.contact_phone}
                        </a>
                      </div>
                    )}
                    {selectedLoad.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-600" />
                        <a href={`mailto:${selectedLoad.contact_email}`} className="text-blue-600 hover:underline">
                          {selectedLoad.contact_email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleBookLoad(selectedLoad.id)}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-lg font-semibold"
                >
                  <CheckCircle className="w-6 h-6" />
                  Book This Load for {formatCurrency(selectedLoad.total_rate)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
