import React, { useState } from 'react';
import { Sparkles, X, Truck, Flame } from 'lucide-react';

interface PromoBannerProps {
  onOpenDrops?: () => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ onOpenDrops }) => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('lass_promo_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    try {
      sessionStorage.setItem('lass_promo_dismissed', 'true');
    } catch {
      // Ignore
    }
  };

  return (
    <div
      role="region"
      aria-label="Promotional Announcement"
      className="w-full bg-gradient-to-r from-emerald-950 via-zinc-950 to-orange-950 border-b border-zinc-800 text-zinc-200 text-xs py-2 px-3 sm:px-4 flex items-center justify-between gap-2 z-40 transition-all select-none"
    >
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none mx-auto text-center truncate">
        <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-400 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Kasi Streetwear Movement
        </span>
        <span className="text-zinc-600 font-bold">•</span>
        <span className="font-semibold text-zinc-300 text-xs shrink-0 flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-blue-400 inline" />
          Reliable PAXI PEP Store Pickup Across South Africa
        </span>
        {onOpenDrops && (
          <>
            <span className="hidden md:inline text-zinc-600 font-bold">•</span>
            <button
              type="button"
              onClick={onOpenDrops}
              className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-bold underline underline-offset-2 transition-colors cursor-pointer shrink-0"
            >
              <Flame className="w-3 h-3 text-orange-400" />
              Explore 2026 Drops Radar
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss banner"
        className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
