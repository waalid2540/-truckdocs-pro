/**
 * RECEIPT SCANNER PAGE
 *
 * Features:
 * - Upload receipt image or capture from camera
 * - OCR text extraction using Tesseract.js
 * - Auto-fill expense form with extracted data
 * - Edit and save extracted data as expense
 * - Real-time preview of uploaded image
 */

import { useState, useRef } from 'react'
import { Camera, Upload, Scan, CheckCircle, AlertCircle, DollarSign, Calendar, Building, Tag } from 'lucide-react'
import Layout from '../components/Layout'
import axios from 'axios'

export default function ReceiptScanner() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [error, setError] = useState(null)

  // Extracted data state
  const [formData, setFormData] = useState({
    amount: '',
    date: '',
    vendor: '',
    category: 'fuel',
    description: '',
    notes: ''
  })

  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  /**
   * Handle file selection from file input
   */
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      setImagePreview(URL.createObjectURL(file))
      setScanned(false)
      setError(null)
    }
  }

  /**
   * Handle camera capture (mobile devices)
   */
  const handleCameraCapture = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      setImagePreview(URL.createObjectURL(file))
      setScanned(false)
      setError(null)
    }
  }

  /**
   * Scan receipt and extract data using OCR
   */
  const handleScanReceipt = async () => {
    if (!selectedImage) {
      setError('Please select an image first')
      return
    }

    setScanning(true)
    setError(null)

    try {
      // Create FormData to send image
      const formDataToSend = new FormData()
      formDataToSend.append('receiptImage', selectedImage)

      // Call OCR API
      const response = await axios.post('/api/ocr/scan-receipt', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const { parsedData, extractedText } = response.data

      // Auto-fill form with extracted data
      setFormData({
        amount: parsedData.amount || '',
        date: parsedData.date || new Date().toISOString().split('T')[0],
        vendor: parsedData.vendor || '',
        category: parsedData.category || 'fuel',
        description: parsedData.description || '',
        notes: `Scanned from receipt. Raw text: ${extractedText.substring(0, 200)}...`
      })

      setScanned(true)
      setScanning(false)

    } catch (error) {
      console.error('Scan error:', error)
      setError(error.response?.data?.error || 'Failed to scan receipt')
      setScanning(false)
    }
  }

  /**
   * Save extracted data as expense
   */
  const handleSaveExpense = async () => {
    try {
      // In demo mode, just show success
      alert('Expense saved successfully!\n\n' + JSON.stringify(formData, null, 2))

      // Reset form
      setSelectedImage(null)
      setImagePreview(null)
      setScanned(false)
      setFormData({
        amount: '',
        date: '',
        vendor: '',
        category: 'fuel',
        description: '',
        notes: ''
      })

    } catch (error) {
      console.error('Save error:', error)
      setError('Failed to save expense')
    }
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Scan className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Receipt Scanner</h1>
          </div>
          <p className="text-gray-600">
            Upload or capture a receipt image to automatically extract expense data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Upload & Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Upload Receipt</h2>

            {/* Upload Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => fileInputRef.current.click()}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Choose from Files
              </button>

              <button
                onClick={() => cameraInputRef.current.click()}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Take Photo
              </button>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
              />
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Preview:</h3>
                <img
                  src={imagePreview}
                  alt="Receipt preview"
                  className="w-full border-2 border-gray-300 rounded-lg"
                />
              </div>
            )}

            {/* Scan Button */}
            {selectedImage && !scanned && (
              <button
                onClick={handleScanReceipt}
                disabled={scanning}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {scanning ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Scanning...
                  </>
                ) : (
                  <>
                    <Scan className="w-5 h-5" />
                    Scan Receipt
                  </>
                )}
              </button>
            )}

            {/* Status Messages */}
            {scanned && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-800">Scan Complete!</h4>
                  <p className="text-sm text-green-700">Data extracted and auto-filled in the form</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800">Error</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Extracted Data Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Expense Details</h2>

            <form className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Vendor/Store
                </label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Store name"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="fuel">Fuel</option>
                  <option value="food">Food</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="tolls">Tolls</option>
                  <option value="parking">Parking</option>
                  <option value="lodging">Lodging</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveExpense}
                disabled={!formData.amount || !formData.date || !formData.vendor}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Save Expense
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
}
