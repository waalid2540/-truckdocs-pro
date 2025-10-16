import { Check, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">One Simple Price</h1>
          <p className="text-blue-200 text-lg">Everything you need to manage your trucking business</p>
          <div className="mt-4 inline-block bg-green-500 text-white px-4 py-2 rounded-full font-semibold">
            7-Day Free Trial • Cancel Anytime
          </div>
        </div>

        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-xl shadow-2xl p-10 ring-4 ring-yellow-400">
            <div className="text-center">
              <span className="bg-yellow-400 text-yellow-900 text-sm font-bold px-4 py-2 rounded-full">
                BEST VALUE
              </span>
              <h3 className="text-3xl font-bold mt-6">TruckDocs Pro</h3>
              <p className="text-gray-600 mt-2">Complete document management for truck drivers</p>
              <div className="mt-8">
                <span className="text-5xl font-bold text-blue-600">$19.99</span>
                <span className="text-gray-600 text-xl">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Billed monthly • Cancel anytime</p>
            </div>

            <ul className="mt-10 space-y-4">
              {[
                'AI Document Assistant (GPT-4)',
                'OCR Receipt Scanner with auto-fill',
                'Digital Signature + PDF Export',
                'Unlimited IFTA Reports',
                'Unlimited Invoices & Expenses',
                'Unlimited Document Storage',
                'Mobile & Desktop Access',
                'Email Support',
                'All Future Updates Included'
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/register"
              className="mt-10 block bg-blue-600 text-white text-center py-4 rounded-lg hover:bg-blue-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Start Your Free 7-Day Trial
            </Link>

            <p className="text-center text-sm text-gray-500 mt-4">
              No credit card required for trial
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link to="/login" className="text-blue-200 hover:text-white">
            Already have an account? Log in
          </Link>
        </div>

        {/* Testimonials */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Mike Johnson', role: 'Owner-Operator', text: 'Saves me 5 hours every week on paperwork!' },
            { name: 'Sarah Martinez', role: 'Fleet Owner', text: 'Best investment for my trucking business.' },
            { name: 'David Lee', role: 'Independent Driver', text: 'The AI assistant is a game changer!' }
          ].map((testimonial, index) => (
            <div key={index} className="bg-white/10 backdrop-blur rounded-lg p-6">
              <p className="text-white italic">"{testimonial.text}"</p>
              <p className="text-blue-200 mt-4 font-semibold">{testimonial.name}</p>
              <p className="text-blue-300 text-sm">{testimonial.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PricingCard({ name, price, description, features, popular }) {
  return (
    <div className={`bg-white rounded-lg shadow-xl p-8 ${popular ? 'ring-4 ring-yellow-400' : ''}`}>
      {popular && (
        <span className="bg-yellow-400 text-yellow-900 text-sm font-bold px-3 py-1 rounded-full">
          MOST POPULAR
        </span>
      )}
      <h3 className="text-2xl font-bold mt-4">{name}</h3>
      <p className="text-gray-600 mt-2">{description}</p>
      <div className="mt-6">
        <span className="text-4xl font-bold">${price}</span>
        <span className="text-gray-600">/month</span>
      </div>
      <ul className="mt-8 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-500" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/register"
        className="mt-8 block bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 font-medium"
      >
        Get Started
      </Link>
    </div>
  )
}
