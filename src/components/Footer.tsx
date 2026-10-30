import React from 'react';
import { MessageSquare, Phone, Truck, ShieldCheck, Ruler, ExternalLink, Heart, Package, Smartphone, Download } from 'lucide-react';
import { BrandConfig } from '../types';

interface FooterProps {
  brandConfig: BrandConfig;
  onOpenAuditModal: () => void;
  onOpenSizeGuide: () => void;
  onOpenPaxiInfo: () => void;
  onOpenOrderStatus: () => void;
  onOpenAdminPortal?: () => void;
  onOpenAppIcon?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  brandConfig,
  onOpenAuditModal,
  onOpenSizeGuide,
  onOpenPaxiInfo,
  onOpenOrderStatus,
  onOpenAdminPortal,
  onOpenAppIcon,
}) => {
  const footerTapCountRef = React.useRef(0);
  const footerLastTapTimeRef = React.useRef(0);
  const footerResetTimerRef = React.useRef<any>(null);

  const handleFooterLogoTap = () => {
    const now = Date.now();
    if (now - footerLastTapTimeRef.current < 3500) {
      footerTapCountRef.current += 1;
    } else {
      footerTapCountRef.current = 1;
    }
    footerLastTapTimeRef.current = now;

    if (footerResetTimerRef.current) clearTimeout(footerResetTimerRef.current);
    footerResetTimerRef.current = setTimeout(() => {
      footerTapCountRef.current = 0;
    }, 3500);

    if (footerTapCountRef.current >= 3) {
      footerTapCountRef.current = 0;
      if (footerResetTimerRef.current) clearTimeout(footerResetTimerRef.current);
      if (onOpenAdminPortal) {
        onOpenAdminPortal();
      }
    }
  };
  return (
    <footer className="w-full bg-black border-t border-zinc-800 pt-12 pb-16 text-zinc-300 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div
              onClick={handleFooterLogoTap}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
              title="LASS"
            >
              <img
                src="/logo.svg"
                alt="LASS"
                className="w-9 h-9 rounded-xl bg-black border border-emerald-500/80 group-hover:border-orange-500 shadow-sm transition-all object-contain"
              />
              <span className="font-display font-black text-white text-lg tracking-wider">
                {brandConfig.brandName}
              </span>
            </div>

            <p className="text-zinc-300 text-xs leading-relaxed">
              <strong className="text-orange-400">{brandConfig.tagline}</strong> — The only Kasi wear that drives the world insane. Born from resilience, designed with courage.
            </p>

            <div className="pt-1 flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-sm" />
              <span>South African Streetwear • ZAR (R)</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-white text-xs uppercase tracking-wider text-emerald-400">
              Shopping &amp; Service
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={onOpenOrderStatus}
                  className="hover:text-orange-400 text-white font-medium transition-colors flex items-center gap-1.5"
                >
                  <Package className="w-3.5 h-3.5 text-blue-400" />
                  <span>Track Manual WhatsApp Order</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenSizeGuide}
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-zinc-300"
                >
                  <Ruler className="w-3.5 h-3.5 text-orange-400" />
                  <span>Size &amp; Fit Guide</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenPaxiInfo}
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-blue-300"
                >
                  <Truck className="w-3.5 h-3.5 text-blue-400" />
                  <span>PAXI PEP Store Delivery (R60)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenAuditModal}
                  className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 text-emerald-400"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Brand Audit Data</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('lass:open-install-prompt'))}
                  className="hover:text-orange-300 transition-colors flex items-center gap-1.5 text-orange-400 font-bold"
                >
                  <Download className="w-3.5 h-3.5 text-orange-400" />
                  <span>Install LASS Mobile App</span>
                </button>
              </li>
              {onOpenAppIcon && (
                <li>
                  <button
                    onClick={onOpenAppIcon}
                    className="hover:text-orange-300 transition-colors flex items-center gap-1.5 text-orange-400 font-bold"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-orange-400" />
                    <span>App Icon &amp; APK Package</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Audited Contacts */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-white text-xs uppercase tracking-wider text-blue-400">
              Audited Contacts
            </h4>
            <ul className="space-y-2 text-zinc-300">
              <li>
                <a
                  href={`https://wa.me/27${brandConfig.ownerWhatsApp.replace(/\D/g, '').replace(/^0/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2 text-emerald-400 font-semibold"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp: {brandConfig.displayWhatsApp}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${brandConfig.displayWhatsApp.replace(/\s+/g, '')}`}
                  className="hover:text-white transition-colors flex items-center gap-2 text-zinc-300"
                >
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Call: {brandConfig.displayWhatsApp}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${brandConfig.secondaryCallNumber.replace(/\s+/g, '')}`}
                  className="hover:text-white transition-colors flex items-center gap-2 text-zinc-400"
                >
                  <Phone className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Alt: {brandConfig.secondaryCallNumber}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Delivery & Provenance */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-white text-xs uppercase tracking-wider text-orange-400">
              Delivery Network
            </h4>
            <p className="text-zinc-300 text-xs leading-relaxed">
              Nationwide delivery through PAXI PEP counters (5–10 business days). Safe, reliable parcel collection in any township or town across South Africa.
            </p>
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
              <span className="text-emerald-400 font-bold block mb-0.5">Original Store:</span>
              <a
                href="https://sites.google.com/view/lassbrandclothes/clothes"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline flex items-center gap-1 text-zinc-200"
              >
                <span>Google Sites Catalog</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar — Completely clean with no visible admin buttons */}
        <div className="pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-400">
          <div>
            <span>&copy; {new Date().getFullYear()} {brandConfig.brandName}. All rights reserved.</span>
          </div>

          <p className="flex items-center gap-1 text-zinc-300">
            <span>Crafted for Kasi streetwear with</span>
            <Heart className="w-3 h-3 text-orange-500 fill-current inline" />
            <span>in South Africa</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
