import React from 'react';
import { X, Truck, PackageCheck, MapPin, Clock, ShieldCheck, ExternalLink } from 'lucide-react';
import { BrandConfig } from '../types';

interface PaxiDeliveryInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandConfig: BrandConfig;
}

export const PaxiDeliveryInfoModal: React.FC<PaxiDeliveryInfoModalProps> = ({
  isOpen,
  onClose,
  brandConfig,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header in Royal Blue & Black */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-blue-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-white">
                PAXI PEP Stores Delivery Guide
              </h2>
              <p className="text-xs text-blue-200">
                Safe, Affordable Nationwide Collection Across South Africa
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

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-zinc-300">
          {/* Audited Policy Quote */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
            <h4 className="font-bold text-sm text-emerald-300 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified Brand Delivery Policy
            </h4>
            <p className="text-xs leading-relaxed italic text-white">
              "Our delivery is PAXI through PEP stores (it takes 5 - 10 of business days)."
            </p>
            <p className="text-[11px] text-emerald-300/80 mt-1">
              Audited directly from the official LASS Brand Clothes Google Sites store.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-blue-500/40 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-sm">PAXI Standard</span>
                <span className="font-black text-lg text-orange-400 font-display">R{brandConfig.paxiStandardFee}</span>
              </div>
              <p className="text-zinc-400 text-xs">
                7–9 business days delivery to any PEP, PEP Home, or Shoezone counter.
              </p>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                Most Popular
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-sm">PAXI Express</span>
                <span className="font-black text-lg text-orange-400 font-display">R{brandConfig.paxiExpressFee}</span>
              </div>
              <p className="text-zinc-400 text-xs">
                3–5 business days faster delivery between major South African hubs.
              </p>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300">
                Faster Delivery
              </span>
            </div>
          </div>

          {/* How PAXI Works Steps */}
          <div className="space-y-3">
            <h4 className="font-black uppercase tracking-wider text-white text-xs">
              How Pickup Works at PEP
            </h4>

            <div className="space-y-2.5">
              <div className="flex gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  1
                </div>
                <div>
                  <h5 className="font-bold text-white">Specify your nearest PEP branch</h5>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    During checkout, give us the town or shopping centre name of your preferred PEP Store.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  2
                </div>
                <div>
                  <h5 className="font-bold text-white">We drop your parcel at PAXI</h5>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    LASS packs your streetwear in a tamper-proof PAXI bag and messages you the parcel reference.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  3
                </div>
                <div>
                  <h5 className="font-bold text-white">Collect with SMS PIN</h5>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    When the parcel reaches PEP, PAXI sends an SMS with your collection PIN. Show your ID and PIN at the counter.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs uppercase tracking-wider shadow-md"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
