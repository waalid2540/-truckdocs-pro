/**
 * DIGITAL SIGNATURE PAD PAGE
 *
 * Features:
 * - Canvas-based signature drawing
 * - Clear and redo functionality
 * - Document type selection
 * - PDF generation with signature
 * - Branded PDF export with driver info
 */

import { useState, useRef, useEffect } from 'react'
import { PenTool, Download, Trash2, FileText, Calendar, User, Truck, Building } from 'lucide-react'
import Layout from '../components/Layout'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function SignaturePad() {
  const { user } = useAuth()
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Document form state
  const [documentData, setDocumentData] = useState({
    documentType: 'Daily Vehicle Inspection Report',
    documentContent: '',
    driverName: user?.full_name || '',
    truckNumber: user?.truck_number || '',
    companyName: user?.company_name || '',
    date: new Date().toISOString().split('T')[0]
  })

  /**
   * Initialize canvas on mount
   */
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.strokeStyle = '#1e40af' // Blue-900
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }, [])

  /**
   * Handle mouse/touch down - start drawing
   */
  const startDrawing = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')

    ctx.beginPath()

    // Get coordinates (handle both mouse and touch)
    const x = (e.clientX || e.touches[0].clientX) - rect.left
    const y = (e.clientY || e.touches[0].clientY) - rect.top

    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  /**
   * Handle mouse/touch move - draw line
   */
  const draw = (e) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')

    // Get coordinates (handle both mouse and touch)
    const x = (e.clientX || e.touches[0].clientX) - rect.left
    const y = (e.clientY || e.touches[0].clientY) - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()

    setHasSignature(true)
  }

  /**
   * Handle mouse/touch up - stop drawing
   */
  const stopDrawing = () => {
    setIsDrawing(false)
  }

  /**
   * Clear signature canvas
   */
  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  /**
   * Generate PDF with signature
   */
  const generatePDF = async () => {
    if (!hasSignature) {
      alert('Please add your signature first')
      return
    }

    if (!documentData.documentContent.trim()) {
      alert('Please enter document content')
      return
    }

    setGenerating(true)

    try {
      // Convert canvas to base64 image
      const canvas = canvasRef.current
      const signatureData = canvas.toDataURL('image/png')

      // Prepare data for API
      const pdfData = {
        documentType: documentData.documentType,
        documentContent: documentData.documentContent,
        signatureData,
        driverInfo: {
          driverName: documentData.driverName,
          truckNumber: documentData.truckNumber,
          companyName: documentData.companyName,
          date: documentData.date
        }
      }

      // Call API to generate PDF
      const response = await axios.post('/api/signature/generate-pdf', pdfData, {
        responseType: 'blob' // Important for PDF download
      })

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${documentData.documentType.replace(/\s+/g, '-')}-${Date.now()}.pdf`
      link.click()

      // Cleanup
      window.URL.revokeObjectURL(url)

      alert('PDF generated successfully!')

    } catch (error) {
      console.error('PDF generation error:', error)
      alert(error.response?.data?.error || 'Failed to generate PDF')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <PenTool className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Digital Signature</h1>
          </div>
          <p className="text-gray-600">
            Sign documents digitally and export as professional PDF files
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Document Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Document Details</h2>

            <form className="space-y-4">
              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Document Type
                </label>
                <select
                  value={documentData.documentType}
                  onChange={(e) => setDocumentData({ ...documentData, documentType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Daily Vehicle Inspection Report">Daily Vehicle Inspection Report</option>
                  <option value="Log Summary">Log Summary</option>
                  <option value="Incident Report">Incident Report</option>
                  <option value="Maintenance Log">Maintenance Log</option>
                  <option value="Delivery Confirmation">Delivery Confirmation</option>
                  <option value="Custom Document">Custom Document</option>
                </select>
              </div>

              {/* Driver Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Driver Name
                </label>
                <input
                  type="text"
                  value={documentData.driverName}
                  onChange={(e) => setDocumentData({ ...documentData, driverName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>

              {/* Truck Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Truck Number
                </label>
                <input
                  type="text"
                  value={documentData.truckNumber}
                  onChange={(e) => setDocumentData({ ...documentData, truckNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Truck #"
                />
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Company Name
                </label>
                <input
                  type="text"
                  value={documentData.companyName}
                  onChange={(e) => setDocumentData({ ...documentData, companyName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Company name"
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
                  value={documentData.date}
                  onChange={(e) => setDocumentData({ ...documentData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Document Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Content
                </label>
                <textarea
                  value={documentData.documentContent}
                  onChange={(e) => setDocumentData({ ...documentData, documentContent: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="8"
                  placeholder="Enter the main content of your document here..."
                />
              </div>
            </form>
          </div>

          {/* Right: Signature Canvas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Your Signature</h2>

            {/* Canvas */}
            <div className="mb-4">
              <canvas
                ref={canvasRef}
                width={500}
                height={250}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="border-2 border-gray-300 rounded-lg cursor-crosshair w-full touch-none"
                style={{ touchAction: 'none' }}
              />
              <p className="text-sm text-gray-500 mt-2">
                Draw your signature above using mouse or touchscreen
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={clearSignature}
                disabled={!hasSignature}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Clear Signature
              </button>

              <button
                onClick={generatePDF}
                disabled={!hasSignature || generating || !documentData.documentContent.trim()}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Generate & Download PDF
                  </>
                )}
              </button>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Fill in document details on the left</li>
                <li>Draw your signature in the canvas above</li>
                <li>Click "Generate & Download PDF" to export</li>
                <li>Your signed PDF will be downloaded automatically</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
