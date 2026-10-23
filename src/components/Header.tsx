import React, { useState, useRef } from 'react';
import { ShoppingBag, Heart, Search, Menu, X, ShieldCheck, Sparkles, Package, Smartphone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { BrandConfig } from '../types';

interface HeaderProps {
  brandConfig: BrandConfig;
  onOpenAuditModal: () => void;
  onOpenAdminPortal: () => void;
  onOpenSizeGuide: () => void;
  onOpenPaxiInfo: () => void;
  onSelectCategory: (cat: string) => void;
  activeCategory: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenWishlist: () => void;
  onOpenOrderStatus: () => void;
  onOpenAppIcon?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  brandConfig,
  onOpenAuditModal,
  onOpenAdminPortal,
  onOpenSizeGuide,
  onOpenPaxiInfo,
  onSelectCategory,
  activeCategory,
  searchQuery,
  setSearchQuery,
  onOpenWishlist,
  onOpenOrderStatus,
  onOpenAppIcon,
}) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { totalWishlistCount } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Discreet Owner Unlock: 5 clicks/taps on brand logo within 2.5s (silent, no visible counter)
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  const resetTimerRef = useRef<any>(null);

  const handleDiscreetLogoClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default touch behavior if applicable
    const now = Date.now();
    if (now - lastClickTimeRef.current < 3500) {
      clickCountRef.current += 1;
    } else {
      clickCountRef.current = 1;
    }
    lastClickTimeRef.current = now;

    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 3500);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      onOpenAdminPortal();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
      {/* Top Streetwear Ticker Announcement in Green, White, Blue & Orange */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-zinc-950 border-b border-emerald-800/40 text-[11px] font-medium text-white py-1.5 px-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-orange-500 text-white shadow-sm uppercase tracking-wider">
              HARVEST KE LASS
            </span>
            <span className="font-bold text-emerald-200 hidden sm:inline">{brandConfig.tagline}</span>
            <span className="text-zinc-300">•</span>
            <span className="text-blue-300 font-semibold flex items-center gap-1">
              PAXI PEP Delivery Nationwide (R60)
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-zinc-300">
            <button
              onClick={onOpenOrderStatus}
              className="hover:text-orange-400 text-white transition-colors flex items-center gap-1 text-[11px] font-bold"
              title="Track Manual WhatsApp Order"
            >
              <Package className="w-3.5 h-3.5 text-blue-400" />
              <span>Track Order</span>
            </button>
            <span className="text-emerald-700 hidden sm:inline">•</span>
            <button
              onClick={onOpenAuditModal}
              className="hover:text-emerald-300 transition-colors flex items-center gap-1 text-[11px] text-zinc-300"
              title="View Google Sites Brand Audit Data"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Audited Store</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Trigger & Brand Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand Logo with discreet owner multi-tap trigger (completely silent, no visible counter) */}
          <div
            onClick={handleDiscreetLogoClick}
            className="flex items-center gap-2.5 cursor-pointer select-none group relative"
            title="LASS"
          >
            <img
              src="/logo.svg"
              alt="LASS Logo"
              className="w-9 h-9 rounded-xl bg-black border border-emerald-500/80 group-hover:border-orange-500 shadow-md transition-all group-active:scale-95 object-contain"
            />

            <div className="flex flex-col">
              <span className="font-display font-black text-xl sm:text-2xl tracking-wider text-white uppercase group-hover:text-emerald-400 transition-colors leading-none">
                LASS
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Category Navigation */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-semibold ${
              activeCategory === 'all'
                ? 'text-white bg-emerald-600 shadow-sm'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
            }`}
          >
            All Pieces
          </button>
          <button
            onClick={() => onSelectCategory('2026-new-drops')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-bold ${
              activeCategory === '2026-new-drops'
                ? 'text-white bg-orange-600 shadow-sm'
                : 'text-orange-400 hover:text-white hover:bg-orange-950/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            2026 Drops
          </button>
          <button
            onClick={() => onSelectCategory('t-shirts')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-semibold ${
              activeCategory === 't-shirts'
                ? 'text-white bg-blue-600 shadow-sm'
                : 'text-zinc-300 hover:text-blue-400 hover:bg-zinc-900'
            }`}
          >
            T-Shirts (B&W)
          </button>
          <button
            onClick={() => onSelectCategory('accessories')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-semibold ${
              activeCategory === 'accessories'
                ? 'text-white bg-zinc-800'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Accessories
          </button>
          <button
            onClick={onOpenPaxiInfo}
            className="px-3 py-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-blue-950/30 transition-colors flex items-center gap-1 font-semibold"
          >
            <span>PAXI Delivery</span>
          </button>
          <button
            onClick={onOpenSizeGuide}
            className="px-3 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors font-semibold"
          >
            Size Guide
          </button>
          {onOpenAppIcon && (
            <button
              onClick={onOpenAppIcon}
              className="px-2.5 py-1.5 rounded-lg text-orange-400 hover:text-white hover:bg-orange-950/40 border border-orange-500/30 transition-colors font-bold text-xs flex items-center gap-1.5"
              title="View & Download official LASS APK app icon"
            >
              <Smartphone className="w-3.5 h-3.5 text-orange-400" />
              <span>APK Icon</span>
            </button>
          )}
        </nav>

        {/* Right Actions: Search, Track, Wishlist, Bag */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Toggle */}
          <div className="relative">
            {showSearchInput ? (
              <div className="flex items-center bg-zinc-900 border border-emerald-600/60 rounded-xl px-2.5 py-1">
                <Search className="w-4 h-4 text-emerald-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search tees, drops..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none w-32 sm:w-48"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowSearchInput(false);
                    setSearchQuery('');
                  }}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearchInput(true)}
                className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors"
                title="Search products"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Track Order */}
          <button
            onClick={onOpenOrderStatus}
            className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors hidden sm:flex items-center gap-1.5"
            title="Track WhatsApp Order"
            aria-label="Track Order"
          >
            <Package className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-bold text-zinc-200 hidden lg:inline">Track</span>
          </button>

          {/* Wishlist */}
          <button
            onClick={onOpenWishlist}
            className="relative p-2 text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors"
            title="Wishlist"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {totalWishlistCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {totalWishlistCount}
              </span>
            )}
          </button>

          {/* Cart Bag with vibrant orange counter */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-orange-500/60 rounded-xl text-white transition-all shadow-sm"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5 text-orange-400" />
            <span className="text-xs font-bold hidden sm:inline">Bag</span>
            {totalItems > 0 && (
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center shadow-md">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <button
              onClick={() => {
                onSelectCategory('all');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-lg text-left font-bold ${
                activeCategory === 'all' ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-zinc-200'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => {
                onSelectCategory('2026-new-drops');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-lg text-left font-bold flex items-center justify-between ${
                activeCategory === '2026-new-drops'
                  ? 'bg-orange-600 text-white'
                  : 'bg-zinc-900 text-orange-400 border border-orange-500/30'
              }`}
            >
              <span>2026 Drops</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                onSelectCategory('t-shirts');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-lg text-left font-bold ${
                activeCategory === 't-shirts' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-200'
              }`}
            >
              T-Shirts (B&W)
            </button>
            <button
              onClick={() => {
                onSelectCategory('accessories');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-lg text-left font-bold ${
                activeCategory === 'accessories' ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-zinc-200'
              }`}
            >
              Accessories
            </button>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-1 text-sm text-zinc-300">
            <button
              onClick={() => {
                onOpenPaxiInfo();
                setMobileMenuOpen(false);
              }}
              className="py-2 px-2 hover:bg-zinc-900 rounded text-left flex items-center justify-between text-blue-300"
            >
              <span>PAXI PEP Delivery Info</span>
              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-bold">From R60</span>
            </button>
            <button
              onClick={() => {
                onOpenOrderStatus();
                setMobileMenuOpen(false);
              }}
              className="py-2 px-2 hover:bg-zinc-900 rounded text-left flex items-center justify-between text-white font-bold"
            >
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-orange-400" />
                <span>Track Manual Order</span>
              </div>
              <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded border border-orange-500/30">
                #LASS-XXXX
              </span>
            </button>
            <button
              onClick={() => {
                onOpenSizeGuide();
                setMobileMenuOpen(false);
              }}
              className="py-2 px-2 hover:bg-zinc-900 rounded text-left text-zinc-300"
            >
              South African Size Guide
            </button>
            <button
              onClick={() => {
                onOpenAuditModal();
                setMobileMenuOpen(false);
              }}
              className="py-2 px-2 hover:bg-zinc-900 rounded text-left flex items-center gap-1.5 text-emerald-400 font-semibold"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Google Sites Brand Audit Details</span>
            </button>
            {onOpenAppIcon && (
              <button
                onClick={() => {
                  onOpenAppIcon();
                  setMobileMenuOpen(false);
                }}
                className="py-2 px-2 hover:bg-zinc-900 rounded text-left flex items-center gap-1.5 text-orange-400 font-bold"
              >
                <Smartphone className="w-4 h-4 text-orange-400" />
                <span>LASS App Icon &amp; APK Package</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
