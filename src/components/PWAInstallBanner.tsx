import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if user already dismissed or installed
    const dismissed = localStorage.getItem('lass_pwa_dismissed');
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone;

    if (dismissed || isStandalone) {
      return;
    }

    // Check iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If on iOS and not standalone, show after a delay
    if (isIosDevice && !isStandalone) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('lass_pwa_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-zinc-900/95 border border-emerald-500/40 rounded-3xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start gap-3">
          <img
            src="/icon-192.png"
            alt="LASS App Icon"
            className="w-11 h-11 rounded-2xl border border-emerald-500/60 object-cover shrink-0 bg-black shadow-md"
          />

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-xs sm:text-sm text-white font-display">
              Install LASS Clothes App
            </h4>
            <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug">
              Fast mobile shopping, offline browsing &amp; instant WhatsApp ordering on your home screen.
            </p>

            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-orange-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isIOS ? 'Install Guide' : 'Install App'}</span>
              </button>

              <button
                onClick={handleDismiss}
                className="px-2.5 py-1.5 text-zinc-400 hover:text-white text-xs"
              >
                Maybe Later
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-zinc-300 p-1"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4">
            <Smartphone className="w-8 h-8 text-blue-400 mx-auto" />
            <h3 className="font-bold text-base text-white">
              Install on iOS Safari
            </h3>
            <div className="text-xs text-zinc-300 space-y-2 text-left bg-black p-4 rounded-2xl border border-zinc-800">
              <p className="flex items-center gap-2">
                <span className="font-bold text-white">1.</span> Tap the <Share className="w-4 h-4 text-blue-400 inline mx-1" /> <strong>Share</strong> icon in Safari.
              </p>
              <p>
                <span className="font-bold text-white">2.</span> Scroll down and choose <strong>"Add to Home Screen"</strong>.
              </p>
              <p>
                <span className="font-bold text-white">3.</span> Tap <strong>Add</strong> in the top-right corner.
              </p>
            </div>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
