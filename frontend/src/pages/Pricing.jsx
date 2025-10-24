import { Check, Sparkles, Truck, Zap, Shield } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Pricing() {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // monthly or yearly
  const [loading, setLoading] = useState(null);

  const handleSubscribe = async (tier) => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(tier);

    try {
      const response = await axios.post(
        `${API_URL}/api/subscription/create-checkout`,
        { tier, billing_period: billingPeriod },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Redirect to Stripe Checkout
      window.location.href = response.data.checkout_url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-3 rounded-xl">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-black text-gray-900">FreightHub Pro</h1>
          </div>
          <p className="text-2xl text-gray-600 font-semibold mb-4">Complete Trucking Command Center</p>
          <p className="text-lg text-gray-500">Choose the plan that fits your business</p>

          {/* Billing Toggle */}
          <div className="mt-8 inline-flex items-center bg-gray-100 rounded-full p-2">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full font-bold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-full font-bold transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Solo Driver */}
          <PricingCard
            name="Solo Driver"
            price={billingPeriod === 'monthly' ? 19 : 199}
            period={billingPeriod}
            description="Perfect for owner-operators"
            features={[
              'Find & Book Freight Loads',
              'Digital Document Management',
              'AI Document Assistant',
              'OCR Receipt Scanner',
              'Digital Signatures',
              'Unlimited IFTA Reports',
              'Unlimited Invoices',
              'Email Support'
            ]}
            onSubscribe={() => handleSubscribe('solo')}
            loading={loading === 'solo'}
          />

          {/* Professional (Most Popular) */}
          <PricingCard
            name="Professional"
            price={billingPeriod === 'monthly' ? 29 : 299}
            period={billingPeriod}
            description="For growing operations"
            features={[
              'Everything in Solo, plus:',
              'Post Your Own Loads',
              'Broker Profile Dashboard',
              'Load Analytics & Insights',
              'Priority Email Support',
              'Advanced Expense Tracking',
              'Custom Invoice Branding',
              'API Access'
            ]}
            popular
            onSubscribe={() => handleSubscribe('professional')}
            loading={loading === 'professional'}
          />

          {/* Fleet */}
          <PricingCard
            name="Fleet Manager"
            price={billingPeriod === 'monthly' ? 49 : 499}
            period={billingPeriod}
            description="For fleet owners & carriers"
            features={[
              'Everything in Professional, plus:',
              'Multi-User Access (up to 10)',
              'Fleet Dashboard & Reports',
              'Dedicated Account Manager',
              'Priority Phone Support',
              'Custom Integrations',
              'White-Label Options',
              'SLA Guarantee'
            ]}
            onSubscribe={() => handleSubscribe('fleet')}
            loading={loading === 'fleet'}
          />
        </div>

        {/* Free Trial Notice */}
        <div className="text-center mt-12 bg-green-50 border-2 border-green-200 rounded-2xl p-8 max-w-2xl mx-auto">
          <Sparkles className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-black text-gray-900 mb-2">Start Your 14-Day Free Trial</h3>
          <p className="text-gray-600 mb-4">
            No credit card required. Cancel anytime. Full access to all features.
          </p>
          <Link
            to="/register"
            className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition-all"
          >
            Get Started Free
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <Shield className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h4 className="font-bold text-gray-900">Bank-Level Security</h4>
            <p className="text-sm text-gray-600">256-bit encryption</p>
          </div>
          <div className="text-center">
            <Zap className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h4 className="font-bold text-gray-900">99.9% Uptime</h4>
            <p className="text-sm text-gray-600">Always available</p>
          </div>
          <div className="text-center">
            <Check className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h4 className="font-bold text-gray-900">Cancel Anytime</h4>
            <p className="text-sm text-gray-600">No contracts</p>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center mt-12">
          <Link to="/login" className="text-gray-600 hover:text-gray-900 font-semibold">
            Already have an account? Log in →
          </Link>
        </div>
      </div>
    </div>
  )
}

function PricingCard({ name, price, period, description, features, popular, onSubscribe, loading }) {
  return (
    <div className={`bg-white rounded-2xl shadow-2xl p-8 border-2 transition-all hover:shadow-3xl hover:-translate-y-2 ${
      popular ? 'border-yellow-400 ring-4 ring-yellow-100' : 'border-gray-200'
    }`}>
      {popular && (
        <div className="text-center mb-4">
          <span className="bg-yellow-400 text-yellow-900 text-sm font-black px-4 py-2 rounded-full uppercase tracking-wide">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-2xl font-black text-gray-900">{name}</h3>
        <p className="text-gray-600 mt-2 font-semibold">{description}</p>

        <div className="mt-6">
          <span className="text-5xl font-black text-gray-900">${price}</span>
          <span className="text-gray-600 text-lg">/{period === 'monthly' ? 'month' : 'year'}</span>
        </div>

        {period === 'yearly' && (
          <p className="text-sm text-green-600 font-bold mt-2">
            Save ${(price / 10 * 12) - price} per year
          </p>
        )}
      </div>

      <ul className="mt-8 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-gray-700 font-medium">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSubscribe}
        disabled={loading}
        className={`mt-8 w-full py-4 rounded-xl font-black text-lg transition-all ${
          popular
            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-2xl transform hover:scale-105'
            : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-xl'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Loading...' : 'Get Started'}
      </button>

      <p className="text-center text-sm text-gray-500 mt-4">
        14-day free trial • No credit card required
      </p>
    </div>
  )
}
