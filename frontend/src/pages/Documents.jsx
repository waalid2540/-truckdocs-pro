import Layout from '../components/Layout'
import { FileText, Upload, Search } from 'lucide-react'

export default function Documents() {
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
            <p className="text-gray-600 mb-4">Drag and drop files here, or click to browse</p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Choose Files
            </button>
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
                className="border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
          </div>

          <div className="text-center py-12 text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No documents uploaded yet</p>
            <p className="text-sm mt-2">Upload your first document to get started!</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
