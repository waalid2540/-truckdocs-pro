import { useNavigate } from 'react-router-dom';
import { X, Lock, CreditCard, Check } from 'lucide-react';

const UpgradeModal = ({ isOpen, onClose, message }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    navigate('/pricing');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md sm:w-full p-5 sm:p-8 max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition p-1 z-10"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="bg-blue-100 rounded-full p-3 sm:p-4">
              <Lock className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Trial Ended
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-2">
              {message || 'Your 7-day free trial has ended. Upgrade to continue using TruckDocs Pro.'}
            </p>

            {/* Benefits */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-left">
              <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-2 sm:mb-3 text-center">
                Unlimited Access for $19.99/month
              </h3>
              <ul className="space-y-1.5 sm:space-y-2">
                <li className="flex items-start">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-700">Unlimited document storage</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-700">Unlimited invoices & expenses</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-700">IFTA automation & reporting</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-700">Load board access</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-700">AI-powered receipt scanner</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-700">Priority support</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={handleUpgrade}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 sm:py-3.5 px-4 sm:px-6 rounded-lg transition flex items-center justify-center space-x-2 shadow-lg text-sm sm:text-base touch-manipulation"
              >
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Upgrade - $19.99/month</span>
              </button>

              <button
                onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-medium py-2.5 sm:py-2 px-4 sm:px-6 rounded-lg transition text-sm sm:text-base touch-manipulation"
              >
                Maybe Later
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-3 sm:mt-4 px-2">
              Cancel anytime. No long-term contracts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
