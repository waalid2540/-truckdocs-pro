import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { FileText, Upload, Search, Download, Trash2, Eye, PenTool, CheckCircle } from 'lucide-react'
import axios from '../api/axios'
import SignaturePad from '../components/SignaturePad'

export default function Documents() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('/api/documents')
      setDocuments(response.data.documents || [])
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('document_type', 'other')
        formData.append('title', file.name)

        await axios.post('/api/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      await fetchDocuments()
      fileInputRef.current.value = ''
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload documents')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await axios.delete(`/api/documents/${id}`)
      await fetchDocuments()
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete document')
    }
  }

  const handleSignDocument = (doc) => {
    setSelectedDoc(doc)
    setShowSignaturePad(true)
  }

  const handleSaveSignature = async (signatureData) => {
    try {
      await axios.put(`/api/documents/${selectedDoc.id}`, {
        has_signature: true,
        signature_data: signatureData
      })

      await fetchDocuments()
      setSelectedDoc(null)
    } catch (error) {
      console.error('Failed to save signature:', error)
      alert('Failed to save signature')
    }
  }

  const handleViewDocument = async (doc) => {
    try {
      // Fetch signed URL from backend for secure access
      const response = await axios.get(`/api/documents/${doc.id}/signed-url`)
      const { signedUrl } = response.data

      // Open in new tab
      window.open(signedUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Failed to load document:', error)
      alert('Failed to load document. Please try again.')
    }
  }

  const handleDownloadDocument = async (doc) => {
    try {
      // Fetch signed URL from backend for secure access
      const response = await axios.get(`/api/documents/${doc.id}/signed-url`)
      const { signedUrl, filename } = response.data

      // Create temporary link and trigger download
      const link = document.createElement('a')
      link.href = signedUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to download document:', error)
      alert('Failed to download document. Please try again.')
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.document_type?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Documents</h1>
          <p className="text-gray-600 mt-2">Upload and manage all your documents</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Documents</h3>
            <p className="text-gray-600 mb-4">
              {uploading ? 'Uploading...' : 'Drag and drop files here, or click to browse'}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Choose Files'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Documents</h2>
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No documents {searchQuery ? 'found' : 'uploaded yet'}</p>
              <p className="text-sm mt-2">
                {searchQuery ? 'Try a different search term' : 'Upload your first document to get started!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{doc.title}</h3>
                        {doc.has_signature && (
                          <CheckCircle className="w-4 h-4 text-green-600" title="Signed" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {doc.document_type} • {new Date(doc.uploaded_at).toLocaleDateString()}
                        {doc.expiration_date && (
                          <span className="ml-2 text-orange-600">
                            • Expires: {new Date(doc.expiration_date).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSignDocument(doc)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                      title="Sign Document"
                    >
                      <PenTool className="w-5 h-5" />
                    </button>
                    {doc.file_url && (
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    )}
                    {doc.file_url && (
                      <button
                        onClick={() => handleDownloadDocument(doc)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Signature Pad Modal */}
        <SignaturePad
          isOpen={showSignaturePad}
          onClose={() => {
            setShowSignaturePad(false)
            setSelectedDoc(null)
          }}
          onSave={handleSaveSignature}
          documentTitle={selectedDoc?.title || 'Document'}
        />
      </div>
    </Layout>
  )
}
