import React, { useState } from 'react';
import {
  X,
  Download,
  Smartphone,
  ShieldCheck,
  Check,
  ExternalLink,
  Layers,
  Sparkles,
  Copy,
  Info
} from 'lucide-react';
import { BrandConfig } from '../types';

interface AppIconModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandConfig: BrandConfig;
}

export const AppIconModal: React.FC<AppIconModalProps> = ({
  isOpen,
  onClose,
  brandConfig,
}) => {
  const [activeShape, setActiveShape] = useState<'squircle' | 'circle' | 'square'>('squircle');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const iconAssets = [
    {
      title: 'Google Play & APK Master',
      res: '1024 × 1024 px',
      format: 'PNG',
      desc: 'High-res master asset for Google Play Store listing and Android packaging.',
      url: '/icon-1024.png',
      filename: 'lass-app-icon-1024x1024.png',
      badge: 'Master HD',
      color: 'border-orange-500/50 text-orange-400',
    },
    {
      title: 'Standard APK Launcher Icon',
      res: '512 × 512 px',
      format: 'PNG (Square/Squircle)',
      desc: 'Standard Android application icon for APK manifest & PWA install prompts.',
      url: '/icon-512.png',
      filename: 'lass-app-icon-512x512.png',
      badge: 'APK Standard',
      color: 'border-emerald-500/50 text-emerald-400',
    },
    {
      title: 'Android Adaptive Maskable Icon',
      res: '512 × 512 px',
      format: 'PNG (Safe-Zone)',
      desc: 'Full-bleed background designed specifically for Android 13+ adaptive circular masking without clipping.',
      url: '/icon-maskable-512.png',
      filename: 'lass-app-icon-maskable-512x512.png',
      badge: 'Adaptive Maskable',
      color: 'border-blue-500/50 text-blue-400',
    },
    {
      title: 'Mobile Launcher Drawer Icon',
      res: '192 × 192 px',
      format: 'PNG',
      desc: 'Home screen launcher tile and notification drawer resolution.',
      url: '/icon-192.png',
      filename: 'lass-app-icon-192x192.png',
      badge: 'Launcher 192',
      color: 'border-zinc-700 text-zinc-300',
    },
    {
      title: 'Apple iOS Touch Icon',
      res: '180 × 180 px',
      format: 'PNG',
      desc: 'Apple Safari iOS "Add to Home Screen" webclip icon.',
      url: '/apple-touch-icon.png',
      filename: 'apple-touch-icon.png',
      badge: 'iOS Touch',
      color: 'border-zinc-700 text-zinc-300',
    },
    {
      title: 'Vector Master Logo',
      res: 'Vector Scalable',
      format: 'SVG',
      desc: 'Resolution-independent SVG vector asset featuring brand owner LASS typography & crest.',
      url: '/logo.svg',
      filename: 'lass-brand-logo.svg',
      badge: 'Vector SVG',
      color: 'border-emerald-500/50 text-emerald-400',
    },
  ];

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(window.location.origin + '/manifest.webmanifest');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header in Emerald/Black */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-emerald-950/70 via-zinc-950 to-orange-950/50">
          <div className="flex items-center gap-3">
            <img
              src="/icon-192.png"
              alt="LASS App Icon"
              className="w-10 h-10 rounded-xl bg-black border border-emerald-500/80 shadow-md object-contain"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-lg text-white">
                  Official LASS App Icon
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40">
                  Android APK &amp; PWA
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Brand Owner LASS Typographic Emblem &bull; HARVEST KE LASS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-zinc-300">
          {/* Top Interactive Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
            {/* Left: Icon Preview with Shape Toggles */}
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/30 via-orange-500/30 to-blue-500/30 rounded-3xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity" />

                <div
                  className={`relative w-36 h-36 sm:w-44 sm:h-44 bg-black border-2 border-emerald-500/80 shadow-2xl overflow-hidden transition-all duration-300 flex items-center justify-center ${
                    activeShape === 'squircle'
                      ? 'rounded-[32px]'
                      : activeShape === 'circle'
                      ? 'rounded-full'
                      : 'rounded-xl'
                  }`}
                >
                  <img
                    src={activeShape === 'circle' ? '/icon-maskable-512.png' : '/icon-512.png'}
                    alt="LASS Brand App Icon"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Shape Switcher */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Preview Launcher Shape
                </span>
                <div className="inline-flex rounded-xl bg-black border border-zinc-800 p-1 gap-1">
                  <button
                    onClick={() => setActiveShape('squircle')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      activeShape === 'squircle'
                        ? 'bg-emerald-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Squircle (APK)
                  </button>
                  <button
                    onClick={() => setActiveShape('circle')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      activeShape === 'circle'
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Circle (Adaptive)
                  </button>
                  <button
                    onClick={() => setActiveShape('square')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      activeShape === 'square'
                        ? 'bg-orange-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Square
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Phone Screen Grid Simulator */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Android Phone Home Screen Simulation</span>
              </span>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-inner">
                {/* Phone Top Status Bar Mockup */}
                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono pb-3 border-b border-zinc-800/60">
                  <span>09:41</span>
                  <span>5G &bull; 100%</span>
                </div>

                {/* App Icons Grid */}
                <div className="grid grid-cols-4 gap-3 pt-4 text-center">
                  {/* LASS APP ICON (Highlighted) */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-12 h-12 shadow-lg border border-emerald-400 overflow-hidden ring-2 ring-emerald-500/40 ${
                        activeShape === 'squircle'
                          ? 'rounded-2xl'
                          : activeShape === 'circle'
                          ? 'rounded-full'
                          : 'rounded-xl'
                      }`}
                    >
                      <img
                        src={activeShape === 'circle' ? '/icon-maskable-512.png' : '/icon-512.png'}
                        alt="LASS Icon"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-black text-emerald-300 truncate w-14">
                      LASS
                    </span>
                  </div>

                  {/* Dummy App 1: Messages */}
                  <div className="flex flex-col items-center gap-1.5 opacity-40">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-xs">
                      SMS
                    </div>
                    <span className="text-[10px] text-zinc-500">Messages</span>
                  </div>

                  {/* Dummy App 2: WhatsApp */}
                  <div className="flex flex-col items-center gap-1.5 opacity-50">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
                      WA
                    </div>
                    <span className="text-[10px] text-zinc-500">WhatsApp</span>
                  </div>

                  {/* Dummy App 3: Camera */}
                  <div className="flex flex-col items-center gap-1.5 opacity-40">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 font-bold text-xs">
                      CAM
                    </div>
                    <span className="text-[10px] text-zinc-500">Camera</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60 text-[10px] text-zinc-400 leading-snug">
                  <strong className="text-white">Pixel-Perfect APK Alignment:</strong> Typographic logo is centered within the 70% safe zone, preventing any edge clipping on circular Pixel or Samsung OneUI app launchers.
                </div>
              </div>
            </div>
          </div>

          {/* Downloadable Assets Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-black text-sm text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-400" />
                <span>APK &amp; Web Icon Package Downloads</span>
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">
                Web &amp; Android Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {iconAssets.map((asset) => (
                <div
                  key={asset.title}
                  className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <img
                      src={asset.url}
                      alt={asset.title}
                      className="w-11 h-11 rounded-xl bg-black border border-zinc-700 shrink-0 object-contain p-0.5"
                    />
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-xs truncate">
                          {asset.title}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border ${asset.color}`}
                        >
                          {asset.badge}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 block">
                        {asset.res} &bull; {asset.format}
                      </span>
                      <p className="text-[10px] text-zinc-400 leading-tight">
                        {asset.desc}
                      </p>
                    </div>
                  </div>

                  <a
                    href={asset.url}
                    download={asset.filename}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-orange-500 hover:text-white text-zinc-300 transition-colors shrink-0 shadow-sm"
                    title={`Download ${asset.title}`}
                    aria-label={`Download ${asset.title}`}
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Android APK & WebAPK Guidelines */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
              <span>How to use these icons in your Android APK build</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-300 pl-1 leading-relaxed">
              <li>
                <strong>WebAPK / PWA (Browser Install):</strong> The web app manifest (`/manifest.webmanifest`) is already configured with standard &amp; maskable icons. Android Chrome will generate the APK automatically when users tap "Install".
              </li>
              <li>
                <strong>Google Play Store / TWA / Bubblewrap:</strong> Use <code className="bg-black px-1.5 py-0.5 rounded text-orange-400 font-mono text-[10px]">/icon-1024.png</code> for the high-res store listing and <code className="bg-black px-1.5 py-0.5 rounded text-emerald-400 font-mono text-[10px]">/icon-512.png</code> in the launcher configuration.
              </li>
              <li>
                <strong>Android Studio native wrapper:</strong> Place <code className="bg-black px-1.5 py-0.5 rounded text-blue-400 font-mono text-[10px]">icon-512.png</code> into the Asset Studio wizard to automatically generate all mipmap densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi).
              </li>
            </ul>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyManifest}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Manifest URL Copied!' : 'Copy Manifest URL'}</span>
              </button>

              <a
                href="/manifest.webmanifest"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>View Raw Manifest</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Brand Owner Verified &bull; {brandConfig.brandName}</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/icon-1024.png"
              download="lass-app-icon-1024x1024.png"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download 1024px APK Master</span>
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
