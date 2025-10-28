import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Fuel, Plus, Download, X, Trash2, Camera, FileText, Eye } from 'lucide-react'
import axios from '../api/axios'

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

export default function IFTA() {
  const currentYear = new Date().getFullYear()
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
  const currentQuarterStr = `${currentYear}-Q${currentQuarter}`

  const [records, setRecords] = useState([])
  const [quarterStats, setQuarterStats] = useState({
    total_gallons: 0,
    total_cost: 0,
    total_purchases: 0
  })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [showReceiptPreview, setShowReceiptPreview] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [formData, setFormData] = useState({
    purchase_date: new Date().toISOString().split('T')[0],
    state: '',
    gallons: '',
    cost: '',
    vendor_name: '',
    receipt_number: '',
    miles_in_state: ''
  })

  useEffect(() => {
    fetchRecords()
    fetchQuarterStats()
  }, [])

  const fetchRecords = async () => {
    try {
      const response = await axios.get('/api/ifta/records')
      setRecords(response.data.records || [])
    } catch (error) {
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchQuarterStats = async () => {
    try {
      const response = await axios.get(`/api/ifta/reports/${currentQuarterStr}`)
      setQuarterStats(response.data.summary)
    } catch (error) {
      console.error('Error fetching quarter stats:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/ifta/records', {
        ...formData,
        gallons: parseFloat(formData.gallons),
        cost: parseFloat(formData.cost),
        miles_in_state: formData.miles_in_state ? parseFloat(formData.miles_in_state) : null
      })
      setShowModal(false)
      setFormData({
        purchase_date: new Date().toISOString().split('T')[0],
        state: '',
        gallons: '',
        cost: '',
        vendor_name: '',
        receipt_number: '',
        miles_in_state: ''
      })
      fetchRecords()
      fetchQuarterStats()
    } catch (error) {
      console.error('Error creating record:', error)
      alert('Failed to create fuel record')
    }
  }

  const handleGenerateReport = async () => {
    try {
      const response = await axios.get(`/api/ifta/reports/${currentQuarterStr}`)
      setReportData(response.data)
      setShowReport(true)
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report')
    }
  }

  const handleDownloadPDF = async () => {
    if (!reportData) return

    const downloadBtn = document.querySelector('[data-pdf-download]')
    if (downloadBtn) {
      downloadBtn.disabled = true
      downloadBtn.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> Generating PDF...'
    }

    try {
      const response = await axios.post(`/api/ifta/reports/${reportData.quarter}/generate-pdf`, {
        fuel_type: reportData.fuel_type || 'diesel'
      })

      // Open PDF in new tab
      window.open(response.data.pdf_url, '_blank')

      alert('✅ IFTA PDF report generated! Opening in new tab...')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to generate PDF report. Please try again.')
    } finally {
      if (downloadBtn) {
        downloadBtn.disabled = false
        downloadBtn.innerHTML = '<svg class="w-5 h-5" ...></svg> Download Official IFTA PDF Report'
      }
    }
  }

  const handleScanReceipt = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setIsScanning(true)
    try {
      const formDataObj = new FormData()
      formDataObj.append('receiptImage', file)

      const response = await axios.post('/api/ifta/scan-and-save', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const { parsedData, document } = response.data

      // Auto-fill form with extracted data AND save document ID
      setFormData(prev => ({
        ...prev,
        gallons: parsedData.gallons || prev.gallons,
        cost: parsedData.cost || prev.cost,
        state: parsedData.state || prev.state,
        vendor_name: parsedData.vendor_name || prev.vendor_name,
        receipt_number: parsedData.receipt_number || prev.receipt_number,
        purchase_date: parsedData.purchase_date ? new Date(parsedData.purchase_date).toISOString().split('T')[0] : prev.purchase_date,
        document_id: document.id // Save document ID to link receipt to IFTA record
      }))

      alert('✅ Receipt scanned and saved! Review the data and submit.')
    } catch (error) {
      console.error('Error scanning receipt:', error)
      alert('Failed to scan receipt. Please try again or enter manually.')
    } finally {
      setIsScanning(false)
    }
  }

  const handleDeleteRecord = async (recordId) => {
    if (!confirm('Are you sure you want to delete this IFTA record?')) {
      return
    }

    try {
      await axios.delete(`/api/ifta/records/${recordId}`)
      fetchRecords()
      fetchQuarterStats()
      alert('Record deleted successfully')
    } catch (error) {
      console.error('Error deleting record:', error)
      alert('Failed to delete record')
    }
  }

  const handleViewReceipt = async (record) => {
    if (record.receipt_url) {
      try {
        // Fetch signed URL from backend for secure access
        const response = await axios.get(`/api/ifta/records/${record.id}/receipt-url`)
        const { signedUrl } = response.data

        setSelectedReceipt({
          url: signedUrl, // Use signed URL instead of direct S3 URL
          filename: record.receipt_filename || 'Receipt',
          vendor: record.vendor_name,
          date: record.purchase_date
        })
        setShowReceiptPreview(true)
      } catch (error) {
        console.error('Error fetching receipt URL:', error)
        alert('Failed to load receipt. Please try again.')
      }
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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">IFTA Management</h1>
            <p className="text-gray-600 mt-2">Track fuel purchases and generate quarterly reports</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Fuel Purchase
          </button>
        </div>

        {/* Current Quarter */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white mb-8">
          <h2 className="text-xl font-bold mb-2">Current Quarter: {currentQuarterStr}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div>
              <p className="text-purple-200 text-sm">Total Gallons</p>
              <p className="text-2xl font-bold">
                {parseFloat(quarterStats.total_gallons || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Total Cost</p>
              <p className="text-2xl font-bold">{formatCurrency(quarterStats.total_cost)}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Records</p>
              <p className="text-2xl font-bold">{quarterStats.total_purchases || 0}</p>
            </div>
          </div>
          <button
            onClick={handleGenerateReport}
            className="mt-4 bg-white text-purple-600 px-6 py-2 rounded-lg hover:bg-purple-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Generate Report
          </button>
        </div>

        {/* Recent Records */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-6">Recent Fuel Purchases</h2>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Fuel className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No fuel purchases recorded yet</p>
              <p className="text-sm mt-2">Add your first fuel purchase to start IFTA tracking!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">State</th>
                    <th className="text-left py-3 px-4">Vendor</th>
                    <th className="text-left py-3 px-4">Gallons</th>
                    <th className="text-left py-3 px-4">Cost</th>
                    <th className="text-left py-3 px-4">Per Gallon</th>
                    <th className="text-left py-3 px-4">Quarter</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{formatDate(record.purchase_date)}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-blue-600">{record.state}</span>
                      </td>
                      <td className="py-3 px-4 text-sm">{record.vendor_name || '-'}</td>
                      <td className="py-3 px-4 font-mono">
                        {parseFloat(record.gallons).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {formatCurrency(record.cost)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatCurrency(record.price_per_gallon)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                          {record.quarter}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {record.receipt_url ? (
                            <button
                              onClick={() => handleViewReceipt(record)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="View receipt"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="w-6 h-6" title="No receipt"></div>
                          )}
                          <button
                            onClick={() => handleDeleteRecord(record.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Fuel Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Add Fuel Purchase</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Scan Receipt Button */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-dashed border-blue-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Scan Fuel Receipt
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Take a photo or upload your receipt to auto-fill the form
                    </p>
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleScanReceipt}
                      className="hidden"
                      disabled={isScanning}
                    />
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                      {isScanning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          Scan Receipt
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Purchase Date *</label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="border rounded-lg px-4 py-2 w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">State *</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="border rounded-lg px-4 py-2 w-full"
                    required
                  >
                    <option value="">Select State</option>
                    {US_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Gallons *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.gallons}
                    onChange={(e) => setFormData({ ...formData, gallons: e.target.value })}
                    className="border rounded-lg px-4 py-2 w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Total Cost *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="border rounded-lg px-4 py-2 w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Vendor Name</label>
                  <input
                    type="text"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    className="border rounded-lg px-4 py-2 w-full"
                    placeholder="e.g., Pilot Flying J"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Receipt Number</label>
                  <input
                    type="text"
                    value={formData.receipt_number}
                    onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                    className="border rounded-lg px-4 py-2 w-full"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Miles in State</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.miles_in_state}
                    onChange={(e) => setFormData({ ...formData, miles_in_state: e.target.value })}
                    className="border rounded-lg px-4 py-2 w-full"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {formData.gallons && formData.cost && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Price per gallon</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(parseFloat(formData.cost) / parseFloat(formData.gallons))}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && reportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-6xl w-full my-8">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold">IFTA Report - {reportData.quarter}</h2>
              <button onClick={() => setShowReport(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              {/* Summary with Tax Info */}
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 mb-6 text-white">
                <h3 className="text-lg font-bold mb-4">Quarter Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-purple-200">Total Gallons</p>
                    <p className="text-2xl font-bold">
                      {parseFloat(reportData.summary.total_gallons || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-200">Total Miles</p>
                    <p className="text-2xl font-bold">
                      {parseFloat(reportData.summary.total_miles || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-200">Average MPG</p>
                    <p className="text-2xl font-bold">
                      {reportData.summary.average_mpg || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-200">Total Cost</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(reportData.summary.total_cost)}
                    </p>
                  </div>
                </div>

                <div className="border-t border-purple-400 pt-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-purple-200">Total Tax Paid</p>
                      <p className="text-xl font-bold">{formatCurrency(reportData.summary.total_tax_paid)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-purple-200">Total Tax Owed</p>
                      <p className="text-xl font-bold">{formatCurrency(reportData.summary.total_tax_owed)}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                      <p className="text-sm text-purple-100">Net Tax {reportData.summary.net_tax_due >= 0 ? 'DUE' : 'CREDIT'}</p>
                      <p className={`text-2xl font-extrabold ${reportData.summary.net_tax_due >= 0 ? 'text-yellow-300' : 'text-green-300'}`}>
                        {formatCurrency(Math.abs(reportData.summary.net_tax_due))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {reportData.warnings && reportData.warnings.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3">Warnings & Recommendations</h3>
                  {reportData.warnings.map((warning, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg mb-3 ${
                        warning.severity === 'high' ? 'bg-red-50 border-l-4 border-red-500' :
                        warning.severity === 'medium' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
                        'bg-blue-50 border-l-4 border-blue-500'
                      }`}
                    >
                      <p className={`font-semibold ${
                        warning.severity === 'high' ? 'text-red-800' :
                        warning.severity === 'medium' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {warning.severity === 'high' ? '⚠️' : warning.severity === 'medium' ? '⚡' : 'ℹ️'} {warning.message}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        <strong>Action:</strong> {warning.action}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* By State with Tax Details */}
              <div>
                <h3 className="text-lg font-bold mb-4">State-by-State Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-3">State</th>
                        <th className="text-right py-3 px-3">Miles</th>
                        <th className="text-right py-3 px-3">Gallons</th>
                        <th className="text-right py-3 px-3">Tax Rate</th>
                        <th className="text-right py-3 px-3">Tax Paid</th>
                        <th className="text-right py-3 px-3">Tax Owed</th>
                        <th className="text-right py-3 px-3">Net Tax</th>
                        <th className="text-center py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...reportData.by_state]
                        .sort((a, b) => b.net_tax - a.net_tax)
                        .map((row) => (
                        <tr key={row.state} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-3">
                            <span className="font-semibold text-blue-600">{row.state}</span>
                            {row.state_name && (
                              <div className="text-xs text-gray-500">{row.state_name}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {row.miles_driven ? parseFloat(row.miles_driven).toLocaleString() : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {parseFloat(row.gallons_purchased || row.total_gallons).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right text-xs">
                            ${row.tax_rate ? row.tax_rate.toFixed(4) : '0.0000'}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-green-600">
                            {formatCurrency(row.tax_paid || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-blue-600">
                            {formatCurrency(row.tax_owed || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold">
                            <span className={row.net_tax > 0 ? 'text-red-600' : row.net_tax < 0 ? 'text-green-600' : 'text-gray-600'}>
                              {formatCurrency(Math.abs(row.net_tax || 0))}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {row.net_tax > 0 ? (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">DUE</span>
                            ) : row.net_tax < 0 ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">CREDIT</span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">EVEN</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 bg-gray-100 font-bold">
                        <td className="py-3 px-3">TOTALS</td>
                        <td className="py-3 px-3 text-right">
                          {parseFloat(reportData.summary.total_miles || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {parseFloat(reportData.summary.total_gallons || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-3"></td>
                        <td className="py-3 px-3 text-right text-green-600">
                          {formatCurrency(reportData.summary.total_tax_paid)}
                        </td>
                        <td className="py-3 px-3 text-right text-blue-600">
                          {formatCurrency(reportData.summary.total_tax_owed)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={reportData.summary.net_tax_due >= 0 ? 'text-red-600' : 'text-green-600'}>
                            {formatCurrency(Math.abs(reportData.summary.net_tax_due))}
                          </span>
                        </td>
                        <td className="py-3 px-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-blue-900">
                  <strong>📋 How IFTA Works:</strong> Tax OWED is calculated based on miles driven in each state. Tax PAID is from fuel purchases.
                  If you drive many miles in a state but buy little fuel there, you owe more tax. If you buy lots of fuel in a state but drive few miles, you get a credit.
                </p>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={handleDownloadPDF}
                  data-pdf-download
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-5 h-5" />
                  Download Official IFTA PDF Report
                </button>
                <button
                  onClick={() => setShowReport(false)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {showReceiptPreview && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <div>
                <h2 className="text-2xl font-bold">Receipt Preview</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedReceipt.vendor} • {formatDate(selectedReceipt.date)}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowReceiptPreview(false)
                  setSelectedReceipt(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={selectedReceipt.url}
                  alt={selectedReceipt.filename}
                  className="w-full h-auto"
                  onError={(e) => {
                    e.target.src = '/placeholder-receipt.png'
                    e.target.alt = 'Receipt not available'
                  }}
                />
              </div>

              <div className="mt-6 flex items-center justify-between">
                <a
                  href={selectedReceipt.url}
                  download={selectedReceipt.filename}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Receipt
                </a>
                <button
                  onClick={() => {
                    setShowReceiptPreview(false)
                    setSelectedReceipt(null)
                  }}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
