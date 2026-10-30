import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, Sparkles, Check, ChevronRight, ShieldCheck, Plus } from 'lucide-react';

export interface PWAInstallBannerProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ forceOpen = false, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  // Sync with forceOpen prop from App.tsx
  useEffect(() => {
    if (forceOpen) {
      setShowBanner(true);
      setShowInstructionsModal(true);
    }
  }, [forceOpen]);

  useEffect(() => {
    // Clear legacy permanent dismissal flag so users consistently receive the home screen icon prompt
    try {
      localStorage.removeItem('lass_pwa_dismissed');
    } catch {}

    // Detect platform
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone);

    // Capture beforeinstallprompt if available on Chromium
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Immediately display when browser fires installability event
      if (!isStandalone) {
        setShowBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen to global open event from Header/Footer
    const handleManualOpen = () => {
      setShowBanner(true);
      setShowInstructionsModal(true);
    };
    window.addEventListener('lass:open-install-prompt', handleManualOpen);

    // Check if dismissed in this immediate session
    let dismissedInSession = false;
    try {
      dismissedInSession = sessionStorage.getItem('lass_pwa_session_dismissed') === 'true';
    } catch {}

    // If not running as installed standalone app and not dismissed in current session,
    // prompt users after 1.5 seconds so they can easily install the home screen icon
    if (!isStandalone && !dismissedInSession) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('lass:open-install-prompt', handleManualOpen);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('lass:open-install-prompt', handleManualOpen);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowBanner(false);
          setShowInstructionsModal(false);
          if (onClose) onClose();
        }
        setDeferredPrompt(null);
      } catch {
        setShowInstructionsModal(true);
      }
    } else {
      setShowInstructionsModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowInstructionsModal(false);
    try {
      sessionStorage.setItem('lass_pwa_session_dismissed', 'true');
    } catch {}
    if (onClose) onClose();
  };

  return (
    <>
      {/* Floating Bottom Pop-Up Banner */}
      {showBanner && !showInstructionsModal && (
        <aside
          role="complementary"
          aria-label="Install mobile app"
          className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-[420px] z-50 animate-in slide-in-from-bottom-5 fade-in duration-300"
        >
          <div className="bg-zinc-950/95 border-2 border-emerald-500/70 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-emerald-950/60 backdrop-blur-xl relative overflow-hidden">
            {/* Ambient street glows */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/25 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex items-start gap-3.5">
              {/* App Icon */}
              <div className="relative shrink-0">
                <img
                  src="/icon-192.png"
                  alt="LASS App Icon"
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border-2 border-emerald-500/90 object-cover bg-black shadow-lg shadow-emerald-500/30"
                />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border border-black items-center justify-center text-[9px] font-black text-black">
                    ✓
                  </span>
                </span>
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-[10px] font-black text-orange-400 uppercase tracking-wider">
                    <Sparkles className="w-2.5 h-2.5" />
                    Install App
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400">Home Screen Icon</span>
                </div>

                <h4 className="font-display font-black text-sm sm:text-base text-white tracking-wide mt-1 leading-snug">
                  Add LASS to Your Phone
                </h4>

                <p className="text-[11px] sm:text-xs text-zinc-300 mt-1 leading-relaxed">
                  Install the official app on your home screen for quick 1-tap launch, offline streetwear browsing, and fast WhatsApp ordering.
                </p>

                {/* Quick actions */}
                <div className="flex items-center gap-2 mt-3 pt-1 border-t border-zinc-800/80">
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-orange-500/25 active:scale-95"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>{deferredPrompt ? 'Add to Home Screen (1-Tap)' : isIOS ? 'Install on iPhone' : 'Install on Phone'}</span>
                  </button>

                  <button
                    onClick={handleDismiss}
                    className="px-3 py-2.5 text-zinc-400 hover:text-white text-xs font-semibold rounded-xl hover:bg-zinc-900 transition-colors"
                  >
                    Later
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="absolute top-0 right-0 p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
                aria-label="Close install prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Interactive Step-by-Step Instructions Modal (iOS, Android & Desktop) */}
      {showInstructionsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={handleDismiss}
        >
          <div
            className="bg-zinc-950 border-2 border-emerald-500/70 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 text-left relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top highlight glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-4 relative">
              <div className="flex items-center gap-3">
                <img
                  src="/icon-192.png"
                  alt="LASS App"
                  className="w-13 h-13 rounded-2xl border-2 border-emerald-500/80 object-cover bg-black shadow-md shadow-emerald-500/20"
                />
                <div>
                  <h3 className="font-display font-black text-base sm:text-lg text-white">
                    {isIOS ? 'Install on iPhone / iPad' : isAndroid ? 'Install on Android' : 'Install LASS App'}
                  </h3>
                  <p className="text-xs text-emerald-400 font-semibold">
                    Home Screen Shortcut &bull; Full Screen Experience
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700"
                aria-label="Close instructions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Platform Instructions */}
            {isIOS ? (
              <div className="space-y-3 text-xs text-zinc-300">
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Tap the Safari Share Icon</strong>
                    <span className="text-zinc-400 text-[11px] leading-relaxed">
                      Tap the <Share className="w-3.5 h-3.5 text-blue-400 inline mx-0.5" /> <strong>Share</strong> button at the bottom of Safari (or top right on iPad).
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Choose "Add to Home Screen"</strong>
                    <span className="text-zinc-400 text-[11px] leading-relaxed">
                      Scroll down in the share sheet and tap <Plus className="w-3.5 h-3.5 text-orange-400 inline mx-0.5" /> <strong>"Add to Home Screen"</strong>.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Tap "Add" in Top Right</strong>
                    <span className="text-zinc-400 text-[11px] leading-relaxed">
                      Confirm by tapping <strong>Add</strong>. The official LASS app icon will now appear on your iPhone home screen!
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-zinc-300">
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Open Browser Menu</strong>
                    <span className="text-zinc-400 text-[11px] leading-relaxed">
                      Tap the three dots (<strong>⋮</strong>) in the top-right corner of Google Chrome.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Select "Install App"</strong>
                    <span className="text-zinc-400 text-[11px] leading-relaxed">
                      Tap <Download className="w-3.5 h-3.5 text-emerald-400 inline mx-0.5" /> <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Launch Like a Native App</strong>
                    <span className="text-zinc-400 text-[11px] leading-relaxed">
                      LASS will launch in standalone full-screen mode directly from your Android home screen!
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Button */}
            <div className="pt-2">
              <button
                onClick={handleDismiss}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition-all"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
