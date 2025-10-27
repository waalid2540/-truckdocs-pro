import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, Truck, ArrowRight } from 'lucide-react'
import axios from '../api/axios'

export default function Pricing() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    const token = localStorage.getItem('token')

    if (!token) {
      // Not logged in, redirect to register
      navigate('/register')
      return
    }

    setLoading(true)

    try {
      const response = await axios.post(
        '/api/subscription/create-checkout',
        {
          tier: 'pro',
          billing_period: 'monthly'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      // Redirect to Stripe Checkout
      window.location.href = response.data.checkout_url
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
              <Truck className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">FreightHub Pro</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              One plan with unlimited everything. No hidden fees, no surprises. Cancel anytime.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-blue-600 transform hover:scale-105 transition">
              {/* Badge */}
              <div className="bg-blue-600 text-white text-center py-2 font-semibold">
                MOST POPULAR
              </div>

              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8">
                <h3 className="text-3xl font-bold text-white text-center mb-2">FreightHub Pro</h3>
                <p className="text-blue-100 text-center mb-6">Everything you need to run your business</p>

                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-6xl font-extrabold text-white">$19.99</span>
                    <span className="text-blue-100 text-2xl">/month</span>
                  </div>
                  <p className="text-blue-100 mt-3 text-lg font-semibold">7 Days FREE, then $19.99/month</p>
                  <p className="text-blue-100 mt-1 text-sm">Cancel anytime before trial ends - no charge</p>
                </div>
              </div>

              {/* Features */}
              <div className="px-8 py-10">
                <div className="mb-8">
                  <h4 className="font-bold text-lg text-gray-900 mb-4">What's Included:</h4>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Unlimited Document Storage</p>
                        <p className="text-sm text-gray-600">Upload unlimited receipts, invoices, and documents</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">OCR Receipt Scanning</p>
                        <p className="text-sm text-gray-600">Automatically extract data from receipts</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Professional Invoicing</p>
                        <p className="text-sm text-gray-600">Create unlimited invoices and track payments</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Expense Tracking</p>
                        <p className="text-sm text-gray-600">Track every expense with automatic categorization</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">IFTA Reports</p>
                        <p className="text-sm text-gray-600">Automatic fuel tax calculations and quarterly reports</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Load Board Access</p>
                        <p className="text-sm text-gray-600">Find and book high-paying loads</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">AI Business Assistant</p>
                        <p className="text-sm text-gray-600">Get instant answers to tax and regulation questions</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Digital Signatures</p>
                        <p className="text-sm text-gray-600">Sign documents electronically</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">24/7 Customer Support</p>
                        <p className="text-sm text-gray-600">Get help whenever you need it</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Mobile Access</p>
                        <p className="text-sm text-gray-600">Manage your business from anywhere</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-8 py-5 rounded-lg hover:bg-blue-700 font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Loading...' : (
                    <>
                      Start 7-Day Free Trial
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="mt-6 space-y-2 text-center text-sm text-gray-600">
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold">Start with 7 days FREE</span>
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    Credit card required (charged after trial)
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    Cancel anytime before day 7 - no charge
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    Auto-renews at $19.99/month after trial
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  What happens after the 7-day free trial?
                </h3>
                <p className="text-gray-600">
                  Your credit card will be <strong>automatically charged $19.99</strong> when your 7-day trial ends.
                  If you cancel before day 7, you won't be charged anything. After that, you'll continue to be charged
                  $19.99 every month until you cancel.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow border-2 border-blue-200 bg-blue-50">
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Do I need a credit card to start the trial?
                </h3>
                <p className="text-gray-600">
                  <strong>Yes, a credit card is required</strong> to start your free trial. This ensures seamless access
                  after your trial ends. You won't be charged during the 7-day trial period, and you can cancel anytime
                  before the trial ends with no charge.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Is there really unlimited storage?
                </h3>
                <p className="text-gray-600">
                  Yes! Upload as many documents, receipts, and invoices as you need. No limits on storage or number of uploads.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Can I cancel my subscription?
                </h3>
                <p className="text-gray-600">
                  Absolutely! You can cancel your subscription anytime from your account settings. You'll have access until
                  the end of your current billing period.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Do you offer refunds?
                </h3>
                <p className="text-gray-600">
                  Yes! If you're not satisfied within the first 30 days, contact us for a full refund—no questions asked.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600">
                  We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure
                  payment processor Stripe.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join 1,000+ drivers who trust FreightHub Pro
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-blue-600 px-10 py-4 rounded-lg hover:bg-gray-100 font-bold text-lg shadow-xl transition inline-flex items-center gap-2"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  )
}
