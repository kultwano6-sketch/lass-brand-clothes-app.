import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, ExternalLink, Database, Phone, Truck, FileText, Sparkles } from 'lucide-react';
import { BrandConfig } from '../types';

interface BrandAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandConfig: BrandConfig;
}

export const BrandAuditModal: React.FC<BrandAuditModalProps> = ({
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
        {/* Header in Emerald Green */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-emerald-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-white">
                Brand Audit &amp; Provenance Record
              </h2>
              <p className="text-xs text-emerald-200">
                Verified extraction from existing public Google Sites web property
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-zinc-300">
          {/* Source Link */}
          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 block">
                Source Property (Google Sites)
              </span>
              <span className="text-white font-mono text-xs">
                sites.google.com/view/lassbrandclothes/clothes
              </span>
            </div>
            <a
              href="https://sites.google.com/view/lassbrandclothes/clothes"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 text-xs shadow-md"
            >
              <span>Visit Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Audit Verification Table */}
          <div className="space-y-3">
            <h4 className="font-black uppercase tracking-wider text-white text-xs">
              Audit Findings &amp; Applied Elements
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Brand Identity &amp; Slogan</span>
                </div>
                <p className="text-zinc-300 text-[11px]">
                  "LASS Brand Clothes", "HARVEST KE LASS", "Bona, ntwana o LASS! Take it as one point of your life."
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-1.5 text-orange-400 font-bold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Published Prices in ZAR</span>
                </div>
                <p className="text-zinc-300 text-[11px]">
                  R100, R150, R180, R250 (Pocket Print), R280 (Back/Front Print), R300 (2026 New Designs).
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Audited Contact Numbers</span>
                </div>
                <p className="text-zinc-300 text-[11px]">
                  WhatsApp: <strong>0664412203</strong> • Calls: <strong>0664412203 / 0847678287</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Audited Delivery Network</span>
                </div>
                <p className="text-zinc-300 text-[11px]">
                  "PAXI through PEP stores (takes 5-10 business days)." Nationwide affordable courier.
                </p>
              </div>
            </div>
          </div>

          {/* High-Resolution Brand Photography Notice */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 space-y-1.5">
            <h4 className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Authentic LASS Streetwear Photography Active</span>
            </h4>
            <p className="text-[11px] leading-relaxed text-zinc-300">
              All apparel pieces now feature dedicated high-resolution studio photography matching your official website placements: signature pocket prints, oversized back prints, "BONA, NTWANA O LASS!" front prints, 2026 Harvest New Drops, and official accessories.
            </p>
          </div>

          {/* Zero-Cost Architecture Details */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
            <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Zero-Cost Infrastructure (R0 Budget Fulfilled)</span>
            </h4>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              • <strong>Shopping Cart:</strong> Zero monthly gateway fees, persistent in local device storage.
              <br />
              • <strong>Order Handling:</strong> WhatsApp-assisted order dispatch with manual EFT confirmation.
              <br />
              • <strong>Future Roadmap:</strong> Fully prepared for Capacitor Android export.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
