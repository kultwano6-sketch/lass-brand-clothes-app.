import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Heart, Search, Menu, X, ShieldCheck, Sparkles, Package, Smartphone, Download, Flame } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { BrandConfig } from '../types';
import { ThemeSwitcher } from './ThemeSwitcher';
import { pushSubModalState, safeNavigateBack } from '../utils/navigation';
import { NotificationCenter } from './NotificationCenter';

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
  onOpenInstallApp?: () => void;
  onOpenCart?: () => void;
  onOpenDrops?: () => void;
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
  onOpenInstallApp,
  onOpenCart,
  onOpenDrops,
}) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { totalWishlistCount } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Close mobile drawer on Android Back button
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (mobileMenuOpen && (e.state as any)?.subModal !== 'mobile_menu') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [mobileMenuOpen]);

  const toggleMobileMenu = () => {
    if (!mobileMenuOpen) {
      pushSubModalState('mobile_menu');
      setMobileMenuOpen(true);
    } else {
      safeNavigateBack('mobile_menu', () => setMobileMenuOpen(false));
    }
  };

  const handleCartClick = () => {
    if (onOpenCart) {
      onOpenCart();
    } else {
      setIsCartOpen(true);
    }
  };

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
    <header className="sticky top-0 z-40 w-full bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 pt-[env(safe-area-inset-top,0px)]">

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Menu Trigger & Brand Identity */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={toggleMobileMenu}
            className="md:hidden min-w-[40px] min-h-[40px] flex items-center justify-center p-2 text-zinc-300 hover:text-white rounded-xl hover:bg-zinc-900 transition-colors shrink-0"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand Logo with discreet owner multi-tap trigger (completely silent, no visible counter) */}
          <div
            onClick={handleDiscreetLogoClick}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group relative shrink-0"
            title="LASS"
          >
            <img
              src="/logo.svg"
              alt="LASS Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black border border-emerald-500/80 group-hover:border-orange-500 shadow-md transition-all group-active:scale-95 object-contain shrink-0"
            />

            <span className="font-display font-black text-xl sm:text-2xl tracking-wider text-white uppercase group-hover:text-emerald-400 transition-colors leading-none shrink-0">
              LASS
            </span>
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
          {onOpenDrops && (
            <button
              onClick={onOpenDrops}
              className="px-3 py-1.5 rounded-lg text-orange-400 hover:text-white hover:bg-orange-950/40 transition-colors flex items-center gap-1 font-bold text-xs"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Drops Radar</span>
            </button>
          )}
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

        {/* Right Actions: Clean, uncluttered layout with visible Bag and Wishlist */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Desktop Search Toggle */}
          <div className="hidden md:block relative">
            {showSearchInput ? (
              <div className="flex items-center bg-zinc-900 border border-emerald-600/60 rounded-xl px-2.5 py-1">
                <Search className="w-4 h-4 text-emerald-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search tees, drops..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none w-36 lg:w-48"
                  autoFocus
                />
                <button
                  type="button"
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
                type="button"
                onClick={() => setShowSearchInput(true)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors"
                title="Search products"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Mobile Search Button (Toggles full-width overlay) */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            className="md:hidden min-w-[40px] min-h-[40px] flex items-center justify-center p-2 text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors"
            title="Search products"
            aria-label="Search"
          >
            {mobileSearchOpen ? <X className="w-5 h-5 text-orange-400" /> : <Search className="w-5 h-5" />}
          </button>

          {/* Desktop Only Utilities: Track, Notifications, Theme */}
          <button
            type="button"
            onClick={onOpenOrderStatus}
            className="min-w-[40px] min-h-[40px] p-2 text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors hidden lg:flex items-center gap-1.5"
            title="Track Order"
            aria-label="Track Order"
          >
            <Package className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-bold text-zinc-200">Track</span>
          </button>

          <div className="hidden md:flex items-center gap-1.5">
            <NotificationCenter onOpenDrops={onOpenDrops} onOpenTracking={onOpenOrderStatus} />
            <ThemeSwitcher />
          </div>

          {/* Wishlist Heart (visible on both mobile & desktop) */}
          <button
            type="button"
            onClick={onOpenWishlist}
            className="relative min-w-[40px] min-h-[40px] flex items-center justify-center p-2 text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors shrink-0"
            title="Wishlist"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {totalWishlistCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {totalWishlistCount}
              </span>
            )}
          </button>

          {/* Shopping Bag (PROMINENT, ALWAYS VISIBLE & IMPOSSIBLE TO PUSH OFF SCREEN) */}
          <button
            type="button"
            onClick={handleCartClick}
            className="relative min-h-[40px] flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl transition-all shadow-md active:scale-95 shrink-0 font-bold text-xs"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-4.5 h-4.5 text-white shrink-0" />
            <span className="hidden sm:inline">Bag</span>
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-black/40 text-white text-[11px] font-black flex items-center justify-center font-mono shrink-0">
              {totalItems}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Expandable Search Bar Overlay */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950/98 backdrop-blur-md px-3 sm:px-4 py-2.5 flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
          <div className="relative flex-1 flex items-center bg-zinc-900 border border-orange-500/70 rounded-xl px-3 py-2 shadow-inner">
            <Search className="w-4 h-4 text-orange-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search tees, drops, prints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none w-full font-medium"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-zinc-400 hover:text-white"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            className="text-xs font-bold text-zinc-400 hover:text-white px-2 py-2 shrink-0 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

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
            <div className="pt-2 border-t border-zinc-800/70 space-y-2">
              <NotificationCenter
                onOpenDrops={() => {
                  if (onOpenDrops) onOpenDrops();
                  setMobileMenuOpen(false);
                }}
                onOpenTracking={() => {
                  if (onOpenOrderStatus) onOpenOrderStatus();
                  setMobileMenuOpen(false);
                }}
                showLabel={true}
                className="w-full"
              />
              <ThemeSwitcher showLabel={true} className="w-full justify-between py-2.5 px-3" />
            </div>

            <button
              onClick={() => {
                if (onOpenInstallApp) onOpenInstallApp();
                window.dispatchEvent(new CustomEvent('lass:open-install-prompt'));
                setMobileMenuOpen(false);
              }}
              className="py-2.5 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 rounded-xl text-left flex items-center justify-between text-black font-extrabold shadow-md mt-1"
            >
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Install LASS Mobile App</span>
              </div>
              <span className="text-[10px] bg-black/20 text-black px-2 py-0.5 rounded-full font-black">
                PWA
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
