import React, { useState, useMemo } from 'react';
import { X, Ruler, HelpCircle, Check, Info, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import {
  calculateStreetwearSize,
  FitSilhouette,
  saveSizePreference,
  getSavedSizePreference,
} from '../utils/sizeCalculator';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  onSelectSize?: (size: string) => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 't-shirts',
  onSelectSize,
}) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 't-shirts' | 'hoodies' | 'accessories'>(
    'calculator'
  );
  const [measurementUnit, setMeasurementUnit] = useState<'cm' | 'inches'>('cm');

  // Calculator state
  const [heightCm, setHeightCm] = useState(176);
  const [weightKg, setWeightKg] = useState(76);
  const [fitPreference, setFitPreference] = useState<FitSilhouette>('relaxed');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const calcResult = useMemo(() => {
    return calculateStreetwearSize({ heightCm, weightKg, fitPreference });
  }, [heightCm, weightKg, fitPreference]);

  if (!isOpen) return null;

  const handleApplyCalculatedSize = () => {
    saveSizePreference(calcResult.recommendedSize);
    if (onSelectSize) {
      onSelectSize(calcResult.recommendedSize);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const tShirtSizes = [
    { size: 'S', chestCm: '96 - 101', chestIn: '38 - 40', lengthCm: '70', lengthIn: '27.5', shoulderCm: '44', shoulderIn: '17.3' },
    { size: 'M', chestCm: '102 - 107', chestIn: '40 - 42', lengthCm: '72', lengthIn: '28.3', shoulderCm: '46', shoulderIn: '18.1' },
    { size: 'L', chestCm: '108 - 113', chestIn: '42.5 - 44.5', lengthCm: '74', lengthIn: '29.1', shoulderCm: '48', shoulderIn: '18.9' },
    { size: 'XL', chestCm: '114 - 119', chestIn: '45 - 47', lengthCm: '76', lengthIn: '29.9', shoulderCm: '50', shoulderIn: '19.7' },
    { size: '2XL', chestCm: '120 - 126', chestIn: '47.5 - 49.5', lengthCm: '78', lengthIn: '30.7', shoulderCm: '53', shoulderIn: '20.8' },
    { size: '3XL', chestCm: '127 - 134', chestIn: '50 - 52.8', lengthCm: '80', lengthIn: '31.5', shoulderCm: '56', shoulderIn: '22.0' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Official Size and Fit Guide"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center border border-orange-500/20">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-lg text-white">
                  Size &amp; Fit Guide
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Kasi Sizing
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                LASS Brand Clothes • Heavyweight 200gsm Combed Cotton
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-5 pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3 bg-zinc-950">
          <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'calculator'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fit Calculator</span>
            </button>

            <button
              onClick={() => setActiveTab('t-shirts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 't-shirts'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              T-Shirt Dimensions
            </button>

            <button
              onClick={() => setActiveTab('hoodies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'hoodies'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Hoodies &amp; Drops
            </button>

            <button
              onClick={() => setActiveTab('accessories')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'accessories'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Accessories
            </button>
          </div>

          {/* Unit Toggle (only relevant for dimension table) */}
          {activeTab === 't-shirts' && (
            <div className="flex items-center gap-2 self-end sm:self-auto text-xs shrink-0">
              <span className="text-zinc-400">Unit:</span>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 flex">
                <button
                  onClick={() => setMeasurementUnit('cm')}
                  className={`px-2.5 py-1 rounded text-xs font-bold ${
                    measurementUnit === 'cm' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  CM
                </button>
                <button
                  onClick={() => setMeasurementUnit('inches')}
                  className={`px-2.5 py-1 rounded text-xs font-bold ${
                    measurementUnit === 'inches' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  IN
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content View */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* TAB 1: INTERACTIVE FIT CALCULATOR */}
          {activeTab === 'calculator' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Height */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-white flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-blue-400" />
                      <span>Height:</span>
                    </label>
                    <span className="font-display font-black text-sm text-white font-mono">
                      {heightCm} cm
                    </span>
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
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>150 cm</span>
                    <span>178 cm</span>
                    <span>205 cm</span>
                  </div>
                </div>

                {/* Weight */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Weight:</span>
                    </label>
                    <span className="font-display font-black text-sm text-white font-mono">
                      {weightKg} kg
                    </span>
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
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>48 kg</span>
                    <span>76 kg</span>
                    <span>130 kg</span>
                  </div>
                </div>
              </div>

              {/* Silhouette Preference */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white">
                  Fit Drape Silhouette:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'fitted' as FitSilhouette, label: 'Fitted', desc: 'Closer to body' },
                    { id: 'relaxed' as FitSilhouette, label: 'Kasi Relaxed', desc: 'Signature street drape' },
                    { id: 'oversized' as FitSilhouette, label: 'Oversized', desc: '90s boxy cut' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFitPreference(s.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        fitPreference === s.id
                          ? 'bg-orange-500/20 border-orange-500 text-white font-bold ring-1 ring-orange-500/50'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className="block text-xs">{s.label}</span>
                      <span className="block text-[10px] text-zinc-400 mt-0.5">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommendation Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-orange-950/40 via-zinc-900 to-emerald-950/30 border border-orange-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black text-orange-400">
                      Calculated Fit
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                      {calcResult.confidenceScore}% Match
                    </span>
                  </div>
                  <div className="font-display font-black text-3xl sm:text-4xl text-white">
                    Size {calcResult.recommendedSize}
                  </div>
                  <p className="text-xs text-zinc-300">
                    Chest {calcResult.chestWidthCm} cm &bull; Length {calcResult.totalLengthCm} cm &bull; {calcResult.silhouetteNote}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleApplyCalculatedSize}
                  className={`px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 ${
                    savedSuccess
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20 active:scale-95'
                  }`}
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Saved Size {calcResult.recommendedSize}!</span>
                    </>
                  ) : (
                    <>
                      <span>Save &amp; Apply Size {calcResult.recommendedSize}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: T-SHIRT DIMENSION TABLE */}
          {activeTab === 't-shirts' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="overflow-x-auto rounded-2xl border border-zinc-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 text-zinc-300 font-bold border-b border-zinc-800">
                      <th className="p-3">Size</th>
                      <th className="p-3">Chest ({measurementUnit})</th>
                      <th className="p-3">Body Length ({measurementUnit})</th>
                      <th className="p-3">Shoulder Width ({measurementUnit})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {tShirtSizes.map((row) => (
                      <tr key={row.size} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="p-3 font-bold text-white font-mono">{row.size}</td>
                        <td className="p-3 text-zinc-300">
                          {measurementUnit === 'cm' ? row.chestCm : row.chestIn}
                        </td>
                        <td className="p-3 text-zinc-300">
                          {measurementUnit === 'cm' ? row.lengthCm : row.lengthIn}
                        </td>
                        <td className="p-3 text-zinc-300">
                          {measurementUnit === 'cm' ? row.shoulderCm : row.shoulderIn}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 space-y-1">
                <strong className="text-emerald-400 block font-bold">Fit Recommendation:</strong>
                <p>
                  LASS printed tees feature a true-to-size streetwear cut. If you prefer a loose, relaxed oversized drape, order one size up.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: HOODIES */}
          {activeTab === 'hoodies' && (
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-3 animate-in fade-in">
              <HelpCircle className="w-8 h-8 text-blue-400 mx-auto" />
              <h4 className="font-bold text-white text-sm">Hoodies &amp; Winter Drop Sizing</h4>
              <p className="text-zinc-400 max-w-md mx-auto">
                Specific garment chest measurements for upcoming 2026 hoodies will be published with the official drop. We recommend sizing matching your standard t-shirt size.
              </p>
            </div>
          )}

          {/* TAB 4: ACCESSORIES */}
          {activeTab === 'accessories' && (
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-3 animate-in fade-in">
              <Check className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-white text-sm">One-Size Streetwear Accessories</h4>
              <p className="text-zinc-400 max-w-md mx-auto">
                All bucket hats and beanies feature flexible circumference (54cm - 62cm) to fit comfortably.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400">
          <span>Need custom sizing advice? WhatsApp Kutlwano directly.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
