import React, { useState, useMemo } from 'react';
import { X, Search, MapPin, Check, Building2, Truck, Sparkles, Navigation } from 'lucide-react';
import { PAXI_BRANCHES, PaxiBranch, SA_PROVINCES, searchPaxiBranches } from '../data/paxiBranches';

interface PaxiStoreLocatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBranch: (branch: PaxiBranch) => void;
  selectedBranchCode?: string;
}

export const PaxiStoreLocatorModal: React.FC<PaxiStoreLocatorModalProps> = ({
  isOpen,
  onClose,
  onSelectBranch,
  selectedBranchCode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('All Provinces');

  const filteredBranches = useMemo(() => {
    return searchPaxiBranches(searchQuery, selectedProvince);
  }, [searchQuery, selectedProvince]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="PAXI PEP Store Locator"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <MapPin className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-lg text-white">
                  PAXI PEP Store Locator
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Nationwide
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Search by city, town, or mall to select your nearest PEP Store pickup point
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            aria-label="Close store locator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Province Filter Bar */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by city, town, mall or code (e.g. Soweto, Pretoria, Menlyn, P4021)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-zinc-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Province Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {SA_PROVINCES.map((prov) => (
              <button
                key={prov}
                onClick={() => setSelectedProvince(prov)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors text-xs ${
                  selectedProvince === prov
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700'
                }`}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter & Info */}
        <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Found <strong className="text-white">{filteredBranches.length}</strong> PEP Store pickup points
          </span>
          <span className="text-[11px] text-blue-300 flex items-center gap-1">
            <Truck className="w-3 h-3 text-blue-400" />
            PAXI SMS tracking sent to your phone on dispatch
          </span>
        </div>

        {/* Store Branches List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredBranches.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <MapPin className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-bold text-white">No PEP Stores found matching "{searchQuery}"</p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Try searching by broader city name (e.g. "Johannesburg", "Durban", "Cape Town") or select "All Provinces".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedProvince('All Provinces');
                }}
                className="mt-2 px-3 py-1.5 rounded-xl bg-zinc-800 text-white font-bold text-xs hover:bg-zinc-700"
              >
                Reset Search
              </button>
            </div>
          ) : (
            filteredBranches.map((branch) => {
              const isSelected = selectedBranchCode === branch.code;

              return (
                <div
                  key={branch.code}
                  onClick={() => {
                    onSelectBranch(branch);
                    onClose();
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-orange-500/15 border-orange-500/80 shadow-md ring-1 ring-orange-500'
                      : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-white">
                        {branch.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded font-mono font-black text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        {branch.code}
                      </span>
                      {branch.isPopular && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          Popular Hub
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-300 leading-snug">
                      {branch.address}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-0.5">
                      <span className="font-semibold text-white">{branch.city}</span>
                      <span>•</span>
                      <span>{branch.province}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBranch(branch);
                        onClose();
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-zinc-800 hover:bg-orange-500 hover:text-white text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </>
                      ) : (
                        <span>Select Branch</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info note */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between text-xs text-zinc-400">
          <span>Can't find your exact store? You can also type your custom PEP branch code.</span>
          <button
            onClick={onClose}
            className="text-xs text-white font-bold hover:underline"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
