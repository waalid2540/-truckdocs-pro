import { useState, useEffect } from 'react';
import { X, Clock, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TrialBanner = ({ user }) => {
  const [showBanner, setShowBanner] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.trial_ends_at) return;

    // Calculate days remaining in trial
    const trialEndDate = new Date(user.trial_ends_at);
    const today = new Date();
    const diffTime = trialEndDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    setDaysRemaining(diffDays);
  }, [user]);

  // Don't show banner if user has paid subscription
  if (!user || user.subscription_status === 'active' || user.subscription_status === 'trialing') {
    return null;
  }

  // Don't show if user manually closed it
  if (!showBanner) {
    return null;
  }

  // Show different messages based on days remaining
  const getTrialMessage = () => {
    if (daysRemaining <= 0) {
      return {
        title: '🔒 Your trial has ended',
        message: 'Upgrade now to continue using TruckDocs Pro',
        bgColor: 'bg-red-600',
        urgent: true
      };
    } else if (daysRemaining === 1) {
      return {
        title: '⏰ Last day of your free trial!',
        message: 'Upgrade today to keep all your documents and features',
        bgColor: 'bg-orange-600',
        urgent: true
      };
    } else if (daysRemaining <= 3) {
      return {
        title: `⚠️ ${daysRemaining} days left in your trial`,
        message: 'Upgrade now for only $19.99/month - Unlimited everything!',
        bgColor: 'bg-yellow-600',
        urgent: false
      };
    } else {
      return {
        title: `✨ ${daysRemaining} days left in your free trial`,
        message: 'Enjoying TruckDocs Pro? Upgrade for just $19.99/month',
        bgColor: 'bg-blue-600',
        urgent: false
      };
    }
  };

  const trialInfo = getTrialMessage();

  return (
    <div className={`${trialInfo.bgColor} text-white shadow-lg relative`}>
      <div className="max-w-7xl mx-auto px-3 py-3 sm:px-6 lg:px-8">
        {/* Mobile Layout - Stacked */}
        <div className="block sm:hidden">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start flex-1 mr-2">
              <span className="flex p-1.5 rounded-lg bg-white bg-opacity-20 flex-shrink-0">
                {trialInfo.urgent ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
              </span>
              <div className="ml-2 flex-1 min-w-0">
                <p className="font-bold text-xs leading-tight">
                  {trialInfo.title}
                </p>
                <p className="text-xs opacity-90 mt-1 leading-snug">
                  {trialInfo.message}
                </p>
              </div>
            </div>

            {!trialInfo.urgent && (
              <button
                onClick={() => setShowBanner(false)}
                className="text-white hover:text-gray-200 transition flex-shrink-0 p-1"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => navigate('/pricing')}
            className="w-full bg-white text-gray-900 px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-100 transition flex items-center justify-center space-x-2 shadow-md"
          >
            <CreditCard className="h-4 w-4" />
            <span>Upgrade Now - $19.99/mo</span>
          </button>
        </div>

        {/* Desktop Layout - Horizontal */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center flex-1">
            <span className="flex p-2 rounded-lg bg-white bg-opacity-20">
              {trialInfo.urgent ? (
                <Clock className="h-5 w-5" />
              ) : (
                <CreditCard className="h-5 w-5" />
              )}
            </span>
            <div className="ml-3 flex-1">
              <p className="font-semibold text-base">
                {trialInfo.title}
              </p>
              <p className="text-sm opacity-90 mt-0.5">
                {trialInfo.message}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/pricing')}
              className="bg-white text-gray-900 px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-100 transition flex items-center space-x-2 shadow-md whitespace-nowrap"
            >
              <CreditCard className="h-4 w-4" />
              <span>Upgrade Now</span>
            </button>

            {!trialInfo.urgent && (
              <button
                onClick={() => setShowBanner(false)}
                className="text-white hover:text-gray-200 transition"
                aria-label="Dismiss banner"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialBanner;
