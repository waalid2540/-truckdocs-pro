import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true)
      return
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(isIOSDevice)

    // Check if user has dismissed the banner before
    const dismissed = localStorage.getItem('installPromptDismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)

      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return
      }
    }

    // Listen for the beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS, show banner after 2 seconds
    if (isIOSDevice) {
      setTimeout(() => {
        setShowInstallBanner(true)
      }, 2000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
      setShowInstallBanner(false)
    } else {
      console.log('User dismissed the install prompt')
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowInstallBanner(false)
    localStorage.setItem('installPromptDismissed', Date.now().toString())
  }

  // Don't show if already installed
  if (isInstalled) return null

  // Don't show if user dismissed and it hasn't been 7 days
  if (!showInstallBanner) return null

  return (
    <>
      {/* Install Banner - Top of screen */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg animate-slide-down">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="bg-white/20 p-2 rounded-lg">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm sm:text-base">
                  Install FreightHub Pro
                </p>
                <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                  {isIOS
                    ? 'Tap Share → Add to Home Screen'
                    : 'Install on your device for quick access'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isIOS && deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 flex items-center gap-2 whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  Install
                </button>
              )}

              <button
                onClick={handleDismiss}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* iOS Instructions */}
          {isIOS && (
            <div className="mt-3 pt-3 border-t border-white/20 text-xs sm:text-sm">
              <p className="font-semibold mb-2">How to install on iPhone/iPad:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-100">
                <li>Tap the Share button (square with arrow) at the bottom</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" in the top right corner</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* Floating Install Button - Bottom right corner */}
      {!isIOS && deferredPrompt && (
        <button
          onClick={handleInstallClick}
          className="fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all hover:scale-110 flex items-center gap-2 group"
          title="Install FreightHub Pro"
        >
          <Download className="w-6 h-6" />
          <span className="hidden group-hover:inline-block text-sm font-semibold pr-2">
            Install App
          </span>
        </button>
      )}
    </>
  )
}
