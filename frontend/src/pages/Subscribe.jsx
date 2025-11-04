import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import axios from '../api/axios'
import { Check, Loader, CreditCard, Shield, Clock } from 'lucide-react'

export default function Subscribe() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkSubscriptionStatus()
  }, [])

  const checkSubscriptionStatus = async () => {
    try {
      const response = await axios.get('/api/stripe/subscription-status')
      setSubscriptionStatus(response.data)

      // If already subscribed, redirect to dashboard
      if (response.data.hasSubscription && response.data.status === 'active') {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const response = await axios.post('/api/stripe/create-checkout-session')

      // Redirect to Stripe Checkout
      if (response.data.url) {
        window.location.href = response.data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert(error.response?.data?.error || 'Failed to start checkout')
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-gray-900 mb-4">
            Start Your Free Trial
          </h1>
          <p className="text-xl text-gray-600">
            Try FreightHub Pro free for 7 days. Cancel anytime.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 text-center">
            <h2 className="text-3xl font-black mb-2">FreightHub Pro</h2>
            <p className="text-blue-100 text-lg">Complete Trucking Command Center</p>
          </div>

          {/* Price */}
          <div className="p-8 bg-gray-50 text-center border-b-2 border-gray-200">
            <div className="mb-4">
              <span className="text-5xl font-black text-gray-900">$19.99</span>
              <span className="text-xl text-gray-600">/month</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-green-100 border-2 border-green-300 px-4 py-2 rounded-full">
              <Clock className="w-5 h-5 text-green-700" />
              <span className="font-bold text-green-900">7-day FREE trial</span>
            </div>
          </div>

          {/* Features */}
          <div className="p-8">
            <h3 className="font-bold text-xl mb-6 text-gray-900">Everything included:</h3>
            <div className="space-y-4">
              <Feature text="IFTA Tax Calculator (save $500+/quarter)" />
              <Feature text="AI Receipt Scanner (never lose receipts)" />
              <Feature text="Document Storage (DOT audit ready)" />
              <Feature text="AI Assistant (24/7 DOT questions)" />
              <Feature text="Load Board (1,000+ live loads coming soon)" />
              <Feature text="Invoice Generator" />
              <Feature text="Expense Tracking" />
              <Feature text="Digital Signatures" />
              <Feature text="Cloud Backup & Sync" />
              <Feature text="Mobile App Access" />
            </div>
          </div>

          {/* CTA Button */}
          <div className="p-8 bg-gray-50">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 flex items-center justify-center gap-3 text-xl font-bold shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              {loading ? (
                <>
                  <Loader className="w-6 h-6 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <CreditCard className="w-6 h-6" />
                  Start Free Trial
                </>
              )}
            </button>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                <strong>No credit card charged for 7 days.</strong> Cancel anytime before trial ends.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Secured by Stripe</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Trusted by truck drivers nationwide</p>
          <div className="flex items-center justify-center gap-8 text-gray-400">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm">Bank-Level Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              <span className="text-sm">Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm">24/7 Support</span>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Common Questions</h3>
          <div className="space-y-6">
            <FAQ
              question="When will I be charged?"
              answer="Your 7-day free trial starts immediately. You won't be charged until day 8. Cancel anytime before then for free."
            />
            <FAQ
              question="Can I cancel anytime?"
              answer="Yes! Cancel anytime from your Settings page. No questions asked, no cancellation fees."
            />
            <FAQ
              question="What payment methods do you accept?"
              answer="We accept all major credit cards (Visa, Mastercard, Amex, Discover) through our secure payment processor, Stripe."
            />
            <FAQ
              question="Is my data secure?"
              answer="Absolutely. We use bank-level encryption and never store your credit card information. All payments are processed securely through Stripe."
            />
          </div>
        </div>
      </div>
    </Layout>
  )
}

function Feature({ text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
        <Check className="w-4 h-4 text-green-600" />
      </div>
      <span className="text-gray-700">{text}</span>
    </div>
  )
}

function FAQ({ question, answer }) {
  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h4 className="font-bold text-gray-900 mb-2">{question}</h4>
      <p className="text-gray-600">{answer}</p>
    </div>
  )
}
