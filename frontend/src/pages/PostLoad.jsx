import { useState } from 'react'
import Layout from '../components/Layout'
import { Plus, MapPin, Truck, DollarSign, Calendar, FileText } from 'lucide-react'
import axios from '../api/axios'
import { useNavigate } from 'react-router-dom'

const EQUIPMENT_TYPES = [
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

export default function PostLoad() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Origin
    origin_city: '',
    origin_state: '',
    origin_zip: '',
    origin_address: '',

    // Destination
    destination_city: '',
    destination_state: '',
    destination_zip: '',
    destination_address: '',

    // Dates
    pickup_date: '',
    pickup_time_start: '',
    pickup_time_end: '',
    delivery_date: '',

    // Load Info
    equipment_type: 'dry_van',
    weight: '',
    length: '',
    commodity: '',
    load_number: '',

    // Pricing
    total_rate: '',
    rate_per_mile: '',
    distance_miles: '',

    // Contact
    broker_company: '',
    broker_mc_number: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',

    // Requirements
    requires_hazmat: false,
    requires_team_driver: false,
    requires_tsa: false,

    // Additional
    notes: '',
    special_instructions: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Convert empty strings to null
      const cleanData = {}
      Object.keys(formData).forEach(key => {
        cleanData[key] = formData[key] === '' ? null : formData[key]
      })

      await axios.post('/api/loads', cleanData)

      alert('Load posted successfully!')
      navigate('/my-loads')
    } catch (error) {
      console.error('Error posting load:', error)
      alert(error.response?.data?.error || 'Failed to post load')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  // Calculate rate per mile when total rate or distance changes
  const calculateRatePerMile = () => {
    if (formData.total_rate && formData.distance_miles) {
      const rpm = parseFloat(formData.total_rate) / parseFloat(formData.distance_miles)
      setFormData({ ...formData, rate_per_mile: rpm.toFixed(2) })
    }
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Post a Load</h1>
          <p className="text-gray-600 mt-2">List your freight and connect with qualified carriers</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
          {/* ORIGIN */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Origin / Pickup Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="origin_city"
                value={formData.origin_city}
                onChange={handleChange}
                placeholder="City *"
                className="border rounded-lg px-4 py-2"
                required
              />
              <select
                name="origin_state"
                value={formData.origin_state}
                onChange={handleChange}
                className="border rounded-lg px-4 py-2"
                required
              >
                <option value="">Select State *</option>
                {US_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <input
                type="text"
                name="origin_zip"
                value={formData.origin_zip}
                onChange={handleChange}
                placeholder="ZIP Code"
                className="border rounded-lg px-4 py-2"
              />
              <input
                type="text"
                name="origin_address"
                value={formData.origin_address}
                onChange={handleChange}
                placeholder="Street Address"
                className="border rounded-lg px-4 py-2"
              />
            </div>
          </div>

          {/* DESTINATION */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              Destination / Delivery Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="destination_city"
                value={formData.destination_city}
                onChange={handleChange}
                placeholder="City *"
                className="border rounded-lg px-4 py-2"
                required
              />
              <select
                name="destination_state"
                value={formData.destination_state}
                onChange={handleChange}
                className="border rounded-lg px-4 py-2"
                required
              >
                <option value="">Select State *</option>
                {US_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <input
                type="text"
                name="destination_zip"
                value={formData.destination_zip}
                onChange={handleChange}
                placeholder="ZIP Code"
                className="border rounded-lg px-4 py-2"
              />
              <input
                type="text"
                name="destination_address"
                value={formData.destination_address}
                onChange={handleChange}
                placeholder="Street Address"
                className="border rounded-lg px-4 py-2"
              />
            </div>
          </div>

          {/* DATES & TIMES */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pickup Date *</label>
                <input
                  type="date"
                  name="pickup_date"
                  value={formData.pickup_date}
                  onChange={handleChange}
                  className="border rounded-lg px-4 py-2 w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Delivery Date</label>
                <input
                  type="date"
                  name="delivery_date"
                  value={formData.delivery_date}
                  onChange={handleChange}
                  className="border rounded-lg px-4 py-2 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pickup Time Start</label>
                <input
                  type="time"
                  name="pickup_time_start"
                  value={formData.pickup_time_start}
                  onChange={handleChange}
                  className="border rounded-lg px-4 py-2 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pickup Time End</label>
                <input
                  type="time"
                  name="pickup_time_end"
                  value={formData.pickup_time_end}
                  onChange={handleChange}
                  className="border rounded-lg px-4 py-2 w-full"
                />
              </div>
            </div>
          </div>

          {/* LOAD DETAILS */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Load Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Equipment Type *</label>
                <select
                  name="equipment_type"
                  value={formData.equipment_type}
                  onChange={handleChange}
                  className="border rounded-lg px-4 py-2 w-full"
                  required
                >
                  {EQUIPMENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                name="commodity"
                value={formData.commodity}
                onChange={handleChange}
                placeholder="Commodity / Product"
                className="border rounded-lg px-4 py-2"
              />
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="Weight (lbs)"
                className="border rounded-lg px-4 py-2"
              />
              <input
                type="number"
                name="length"
                value={formData.length}
                onChange={handleChange}
                placeholder="Length (feet)"
                className="border rounded-lg px-4 py-2"
              />
              <input
                type="text"
                name="load_number"
                value={formData.load_number}
                onChange={handleChange}
                placeholder="Load #"
                className="border rounded-lg px-4 py-2"
              />
            </div>
          </div>

          {/* PRICING */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total Rate *</label>
                <input
                  type="number"
                  step="0.01"
                  name="total_rate"
                  value={formData.total_rate}
                  onChange={(e) => {
                    handleChange(e)
                    setTimeout(calculateRatePerMile, 100)
                  }}
                  placeholder="$0.00"
                  className="border rounded-lg px-4 py-2 w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Distance (miles)</label>
                <input
                  type="number"
                  name="distance_miles"
                  value={formData.distance_miles}
                  onChange={(e) => {
                    handleChange(e)
                    setTimeout(calculateRatePerMile, 100)
                  }}
                  placeholder="Miles"
                  className="border rounded-lg px-4 py-2 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rate per Mile</label>
                <input
                  type="number"
                  step="0.01"
                  name="rate_per_mile"
                  value={formData.rate_per_mile}
                  onChange={handleChange}
                  placeholder="$/mile"
                  className="border rounded-lg px-4 py-2 w-full"
                />
              </div>
            </div>
          </div>

          {/* CONTACT INFO */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="broker_company"
                value={formData.broker_company}
                onChange={handleChange}
                placeholder="Company Name"
                className="border rounded-lg px-4 py-2"
              />
              <input
                type="text"
                name="broker_mc_number"
                value={formData.broker_mc_number}
                onChange={handleChange}
                placeholder="MC Number"
                className="border rounded-lg px-4 py-2"
              />
              <input
                type="text"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                placeholder="Contact Name"
                className="border rounded-lg px-4 py-2"
              />
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                placeholder="Phone Number"
                className="border rounded-lg px-4 py-2"
              />
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                placeholder="Email Address"
                className="border rounded-lg px-4 py-2 md:col-span-2"
              />
            </div>
          </div>

          {/* REQUIREMENTS */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Special Requirements</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="requires_hazmat"
                  checked={formData.requires_hazmat}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span>Requires HAZMAT Endorsement</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="requires_team_driver"
                  checked={formData.requires_team_driver}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span>Requires Team Drivers</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="requires_tsa"
                  checked={formData.requires_tsa}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span>Requires TSA Clearance</span>
              </label>
            </div>
          </div>

          {/* NOTES */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Additional Information</h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Notes (visible to drivers)"
              rows="3"
              className="border rounded-lg px-4 py-2 w-full"
            />
            <textarea
              name="special_instructions"
              value={formData.special_instructions}
              onChange={handleChange}
              placeholder="Special Instructions"
              rows="2"
              className="border rounded-lg px-4 py-2 w-full mt-2"
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-lg font-semibold"
          >
            <Plus className="w-6 h-6" />
            {loading ? 'Posting Load...' : 'Post Load to Board'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
