import Layout from '../components/Layout'
import { Truck, Clock, CheckCircle, Bell, Sparkles } from 'lucide-react'

export default function LoadBoardComingSoon() {
  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-3xl shadow-2xl mb-6">
            <Truck className="w-20 h-20 text-white" />
          </div>

          <h1 className="text-5xl font-black text-gray-900 mb-4">
            Load Board Coming Soon!
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            We're building the best load board for owner-operators. Launch date: <span className="font-bold text-blue-600">Week of November 18, 2025</span>
          </p>

          <div className="inline-flex items-center gap-3 bg-yellow-100 border-2 border-yellow-400 px-6 py-4 rounded-xl">
            <Clock className="w-6 h-6 text-yellow-700" />
            <span className="font-bold text-yellow-900">Coming in 2-3 weeks</span>
          </div>
        </div>

        {/* What's Coming */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-600" />
            What You'll Get
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">1,000+ Live Loads Daily</h3>
                <p className="text-gray-600">Real-time freight from DAT, Truckstop, and direct brokers</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Smart Search & Filters</h3>
                <p className="text-gray-600">Find loads by origin, destination, equipment type, and rate per mile</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">One-Click Booking</h3>
                <p className="text-gray-600">Book loads instantly and contact brokers directly</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Rate Analysis</h3>
                <p className="text-gray-600">See market rates and profitability for every route</p>
              </div>
            </div>
          </div>
        </div>

        {/* Meanwhile... */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">
            Meanwhile, Save $2,000+ This Quarter
          </h2>

          <p className="text-lg text-gray-700 mb-6">
            While we build the load board, use FreightHub Pro's powerful tools to save money and time:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <a href="/ifta" className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all border-2 border-transparent hover:border-green-500">
              <h3 className="font-bold text-xl mb-2 text-gray-900">📊 IFTA Calculator</h3>
              <p className="text-gray-600 mb-2">Calculate quarterly taxes in 2 minutes</p>
              <p className="text-green-600 font-bold">Save $500+ per quarter</p>
            </a>

            <a href="/receipt-scanner" className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all border-2 border-transparent hover:border-blue-500">
              <h3 className="font-bold text-xl mb-2 text-gray-900">📸 Receipt Scanner</h3>
              <p className="text-gray-600 mb-2">Scan fuel receipts with AI in 10 seconds</p>
              <p className="text-blue-600 font-bold">Never lose a receipt again</p>
            </a>

            <a href="/documents" className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all border-2 border-transparent hover:border-purple-500">
              <h3 className="font-bold text-xl mb-2 text-gray-900">📁 Document Storage</h3>
              <p className="text-gray-600 mb-2">Store all your trucking documents securely</p>
              <p className="text-purple-600 font-bold">Access anywhere, anytime</p>
            </a>

            <a href="/ai-assistant" className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all border-2 border-transparent hover:border-yellow-500">
              <h3 className="font-bold text-xl mb-2 text-gray-900">🤖 AI Assistant</h3>
              <p className="text-gray-600 mb-2">Get instant answers to DOT questions</p>
              <p className="text-yellow-600 font-bold">24/7 expert help</p>
            </a>
          </div>
        </div>

        {/* Notify Me */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center shadow-2xl">
          <Bell className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Get Notified When Load Board Launches</h2>
          <p className="text-blue-100 mb-6 text-lg">
            You're already signed up! We'll send you an email the moment our load board goes live.
          </p>
          <p className="text-blue-200 text-sm">
            In the meantime, explore all the other features that are saving drivers thousands of dollars per year.
          </p>
        </div>
      </div>
    </Layout>
  )
}
