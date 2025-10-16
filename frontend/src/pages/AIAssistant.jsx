/**
 * AI ASSISTANT PAGE
 *
 * Features:
 * - Generate trucking documents using AI
 * - Voice-to-text input support
 * - Pre-made templates
 * - Download as PDF
 * - Copy to clipboard
 */

import { useState, useEffect } from 'react'
import { Sparkles, Mic, MicOff, Download, Copy, FileText } from 'lucide-react'
import Layout from '../components/Layout'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function AIAssistant() {
  const { user } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [generatedText, setGeneratedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  // Fetch pre-made templates
  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/ai/templates')
      setTemplates(response.data.templates)
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  // Generate document using AI
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a command or select a template')
      return
    }

    setLoading(true)
    setGeneratedText('')

    try {
      const response = await axios.post('/api/ai/generate', {
        prompt,
        context: {
          driverName: user?.full_name,
          truckNumber: user?.truck_number,
          companyName: user?.company_name
        }
      })

      setGeneratedText(response.data.text)
    } catch (error) {
      console.error('Failed to generate:', error)
      alert(error.response?.data?.error || 'Failed to generate document')
    } finally {
      setLoading(false)
    }
  }

  // Voice-to-text using Web Speech API
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input not supported in your browser')
      return
    }

    const recognition = new window.webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setListening(true)
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setPrompt(transcript)
      setListening(false)
    }

    recognition.onerror = () => {
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognition.start()
  }

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText)
    alert('Copied to clipboard!')
  }

  // Download as text file (PDF export can be added later)
  const downloadAsFile = () => {
    const blob = new Blob([generatedText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `truckdocs-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Use a template
  const useTemplate = (template) => {
    setPrompt(template.prompt)
    setSelectedTemplate(template)
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">AI Document Assistant</h1>
          </div>
          <p className="text-gray-600">
            Generate inspection reports, log summaries, and compliance documents instantly
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Templates */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quick Templates
            </h2>
            <div className="space-y-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => useTemplate(template)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <h3 className="font-semibold text-sm">{template.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Generator */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input Area */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Your Command</h2>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Type or speak your command... e.g., 'Create my daily inspection report' or 'Summarize today's log'"
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />

                {/* Voice Button */}
                <button
                  onClick={startListening}
                  disabled={listening}
                  className={`absolute bottom-3 right-3 p-2 rounded-lg transition-colors ${
                    listening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  title="Voice input"
                >
                  {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Document
                  </>
                )}
              </button>
            </div>

            {/* Output Area */}
            {generatedText && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Generated Document</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                    <button
                      onClick={downloadAsFile}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                    {generatedText}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
