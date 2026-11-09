import React from 'react';
import { LogOut, ShoppingBag, ArrowLeft, Sparkles } from 'lucide-react';
import { BrandConfig } from '../types';

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onStay: () => void;
  onExit: () => void;
  brandConfig: BrandConfig;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
  isOpen,
  onStay,
  onExit,
  brandConfig,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onStay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-modal-title"
    >
      <div
        className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center my-auto transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-orange-500/50 flex items-center justify-center text-orange-400 mb-4 shadow-lg shadow-orange-500/10">
          <img
            src="/logo.svg"
            alt="LASS Logo"
            className="w-10 h-10 object-contain"
          />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider mb-2">
          <Sparkles className="w-3 h-3" />
          <span>Harvest Ke LASS</span>
        </div>

        <h3
          id="exit-modal-title"
          className="font-display font-black text-xl sm:text-2xl text-white tracking-tight"
        >
          Exit LASS Store?
        </h3>

        <p className="text-xs text-zinc-400 mt-2 mb-6 leading-relaxed">
          Are you sure you want to leave? Your shopping bag items and calibrated fit preferences will be saved for when you return.
        </p>

        {/* Action Buttons: Stay and Exit */}
        <div className="w-full space-y-2.5">
          <button
            type="button"
            onClick={onStay}
            className="w-full py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all active:scale-95"
            autoFocus
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Stay in Store</span>
          </button>

          <button
            type="button"
            onClick={onExit}
            className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-zinc-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit App</span>
          </button>
        </div>
      </div>
    </div>
  );
};
