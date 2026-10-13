import React, { useState } from 'react';
import { X, Ruler, HelpCircle, Check, Info } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 't-shirts',
}) => {
  const [activeTab, setActiveTab] = useState<'t-shirts' | 'hoodies' | 'accessories'>(
    initialCategory === 'accessories' ? 'accessories' : 't-shirts'
  );
  const [measurementUnit, setMeasurementUnit] = useState<'cm' | 'inches'>('cm');

  if (!isOpen) return null;

  const tShirtSizes = [
    { size: 'S', chestCm: '96 - 101', chestIn: '38 - 40', lengthCm: '70', lengthIn: '27.5', shoulderCm: '44', shoulderIn: '17.3' },
    { size: 'M', chestCm: '102 - 107', chestIn: '40 - 42', lengthCm: '72', lengthIn: '28.3', shoulderCm: '46', shoulderIn: '18.1' },
    { size: 'L', chestCm: '108 - 113', chestIn: '42.5 - 44.5', lengthCm: '74', lengthIn: '29.1', shoulderCm: '48', shoulderIn: '18.9' },
    { size: 'XL', chestCm: '114 - 119', chestIn: '45 - 47', lengthCm: '76', lengthIn: '29.9', shoulderCm: '50', shoulderIn: '19.7' },
    { size: '2XL', chestCm: '120 - 126', chestIn: '47.5 - 49.5', lengthCm: '78', lengthIn: '30.7', shoulderCm: '53', shoulderIn: '20.8' },
    { size: '3XL', chestCm: '127 - 134', chestIn: '50 - 52.8', lengthCm: '80', lengthIn: '31.5', shoulderCm: '56', shoulderIn: '22.0' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-white">
                Official Size &amp; Fit Guide
              </h2>
              <p className="text-xs text-zinc-400">
                LASS Brand Clothes • South African Streetwear Sizing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & Unit Switcher */}
        <div className="px-5 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3 bg-zinc-950">
          <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('t-shirts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 't-shirts'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Printed T-Shirts
            </button>
            <button
              onClick={() => setActiveTab('hoodies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'hoodies'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Hoodies &amp; Sweaters
            </button>
            <button
              onClick={() => setActiveTab('accessories')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'accessories'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Caps &amp; Bags
            </button>
          </div>

          {/* Unit Toggle */}
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <span className="text-zinc-400">Unit:</span>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 flex">
              <button
                onClick={() => setMeasurementUnit('cm')}
                className={`px-2.5 py-1 rounded text-xs font-bold ${
                  measurementUnit === 'cm'
                    ? 'bg-white text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                CM
              </button>
              <button
                onClick={() => setMeasurementUnit('inches')}
                className={`px-2.5 py-1 rounded text-xs font-bold ${
                  measurementUnit === 'inches'
                    ? 'bg-white text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                IN
              </button>
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {activeTab === 't-shirts' ? (
            <div className="space-y-4">
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
          ) : activeTab === 'hoodies' ? (
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-3">
              <HelpCircle className="w-8 h-8 text-blue-400 mx-auto" />
              <h4 className="font-bold text-white text-sm">Hoodies &amp; Winter Drop Sizing</h4>
              <p className="text-zinc-400 max-w-md mx-auto">
                Specific garment chest measurements for upcoming 2026 hoodies will be published with the official drop. We recommend sizing matching your standard t-shirt size.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-3">
              <Check className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-white text-sm">One-Size Streetwear Accessories</h4>
              <p className="text-zinc-400 max-w-md mx-auto">
                All caps and beanies feature adjustable rear straps (54cm - 62cm circumference) to fit comfortably.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs uppercase tracking-wider"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
