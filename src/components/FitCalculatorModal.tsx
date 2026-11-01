import React, { useState, useMemo } from 'react';
import { X, Ruler, Sparkles, Check, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import {
  calculateStreetwearSize,
  FitSilhouette,
  saveSizePreference,
  getSavedSizePreference,
} from '../utils/sizeCalculator';

interface FitCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySize: (size: string) => void;
  currentSelectedSize?: string;
}

export const FitCalculatorModal: React.FC<FitCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplySize,
  currentSelectedSize,
}) => {
  const [heightCm, setHeightCm] = useState(176);
  const [weightKg, setWeightKg] = useState(76);
  const [fitPreference, setFitPreference] = useState<FitSilhouette>('relaxed');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');

  // Compute recommendation in real time
  const result = useMemo(() => {
    return calculateStreetwearSize({ heightCm, weightKg, fitPreference });
  }, [heightCm, weightKg, fitPreference]);

  if (!isOpen) return null;

  const handleApply = () => {
    saveSizePreference(result.recommendedSize);
    onApplySize(result.recommendedSize);
    onClose();
  };

  // Height conversion helpers for imperial display
  const heightFeetInches = () => {
    const totalInches = Math.round(heightCm / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}ft ${inches}in`;
  };

  const weightLbs = () => {
    return `${Math.round(weightKg * 2.20462)} lbs`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Streetwear Fit Calculator"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <Sparkles className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-lg text-white">
                  Streetwear Fit Calculator
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Smart Sizing
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Calibrated for LASS 180–200gsm Heavyweight Combed Cotton
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            aria-label="Close calculator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Unit Toggle */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
              Your Body Measurements
            </span>
            <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[11px]">
              <button
                type="button"
                onClick={() => setUnitSystem('metric')}
                className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                  unitSystem === 'metric' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Metric (cm/kg)
              </button>
              <button
                type="button"
                onClick={() => setUnitSystem('imperial')}
                className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                  unitSystem === 'imperial' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Imperial (ft/lbs)
              </button>
            </div>
          </div>

          {/* Height Slider */}
          <div className="space-y-2 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-white flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-blue-400" />
                <span>Height</span>
              </label>
              <div className="text-right">
                <span className="font-display font-black text-sm text-white font-mono">
                  {heightCm} cm
                </span>
                {unitSystem === 'imperial' && (
                  <span className="text-[11px] text-zinc-400 font-mono ml-1.5">
                    ({heightFeetInches()})
                  </span>
                )}
              </div>
            </div>

            <input
              type="range"
              min="150"
              max="205"
              step="1"
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              className="w-full accent-orange-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />

            {/* Quick Height Chips */}
            <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
              {[160, 170, 178, 185, 195].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHeightCm(h)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    heightCm === h ? 'bg-orange-500/20 text-orange-400 font-bold' : 'hover:text-zinc-300'
                  }`}
                >
                  {h}cm
                </button>
              ))}
            </div>
          </div>

          {/* Weight Slider */}
          <div className="space-y-2 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Body Weight</span>
              </label>
              <div className="text-right">
                <span className="font-display font-black text-sm text-white font-mono">
                  {weightKg} kg
                </span>
                {unitSystem === 'imperial' && (
                  <span className="text-[11px] text-zinc-400 font-mono ml-1.5">
                    ({weightLbs()})
                  </span>
                )}
              </div>
            </div>

            <input
              type="range"
              min="48"
              max="130"
              step="1"
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="w-full accent-emerald-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />

            {/* Quick Weight Chips */}
            <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
              {[55, 68, 76, 88, 105].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWeightKg(w)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    weightKg === w ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'hover:text-zinc-300'
                  }`}
                >
                  {w}kg
                </button>
              ))}
            </div>
          </div>

          {/* Streetwear Silhouette Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-white">
              Preferred Streetwear Fit Silhouette
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'fitted' as FitSilhouette,
                  title: 'Fitted',
                  desc: 'Snug & tailored',
                },
                {
                  id: 'relaxed' as FitSilhouette,
                  title: 'Kasi Relaxed',
                  desc: 'Signature drape',
                  badge: 'Standard',
                },
                {
                  id: 'oversized' as FitSilhouette,
                  title: 'Oversized',
                  desc: '90s drop shoulder',
                },
              ].map((sil) => {
                const isSelected = fitPreference === sil.id;

                return (
                  <button
                    key={sil.id}
                    type="button"
                    onClick={() => setFitPreference(sil.id)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'bg-orange-500/15 border-orange-500 shadow-md ring-1 ring-orange-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-bold text-xs block">{sil.title}</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5 leading-tight">{sil.desc}</span>
                    {sil.badge && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-orange-400 block mt-1">
                        {sil.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* LIVE RECOMMENDATION RESULT CARD */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-orange-950/40 via-zinc-900 to-emerald-950/30 border border-orange-500/50 shadow-xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Recommended Size
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>{result.confidenceScore}% Match</span>
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-display font-black text-4xl sm:text-5xl text-white tracking-tight">
                Size {result.recommendedSize}
              </span>
              <span className="text-xs text-zinc-400">
                Chest {result.chestWidthCm} cm &bull; Length {result.totalLengthCm} cm
              </span>
            </div>

            <p className="text-xs text-zinc-200 leading-relaxed">
              {result.silhouetteNote}
            </p>

            <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
              <span>
                {result.fabricDrapeAdvice} If you prefer an even roomier streetwear look, consider Size {result.alternativeSize}.
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleApply}
            className="w-full py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 transition-transform active:scale-95"
          >
            <span>Apply Size {result.recommendedSize} to Product</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
