import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, ArrowRight, Truck, MessageSquare, ShieldCheck, Flame, SlidersHorizontal, Grid, Columns, Package, CreditCard } from 'lucide-react';
import { Product, BrandConfig, SubmittedOrder } from './types';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { INITIAL_BRAND_CONFIG } from './data/brandConfig';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { SizeGuideModal } from './components/SizeGuideModal';
import { PaxiDeliveryInfoModal } from './components/PaxiDeliveryInfoModal';
import { BrandStorySection } from './components/BrandStorySection';
import { BrandAuditModal } from './components/BrandAuditModal';
import { AdminPortalModal } from './components/AdminPortalModal';
import { WishlistModal } from './components/WishlistModal';
import { OrderStatusModal } from './components/OrderStatusModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { AppIconModal } from './components/AppIconModal';
import { PaymentStatusPage } from './components/PaymentStatusPage';
import { SearchAndFilters, SortOption } from './components/SearchAndFilters';

const PRODUCTS_STORAGE_KEY = 'lass_products_catalog_v1';
const BRAND_CONFIG_STORAGE_KEY = 'lass_brand_config_v1';

function MainShopContent() {
  // Brand Configuration state with localStorage persistence
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(() => {
    try {
      const saved = localStorage.getItem(BRAND_CONFIG_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_BRAND_CONFIG;
    } catch {
      return INITIAL_BRAND_CONFIG;
    }
  });

  // Product catalogue state with localStorage persistence
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        // If saved catalogue still contains old placeholders or generated images, upgrade with real website clothing photos
        const needsWebsitePhotosUpgrade = parsed.some((p) =>
          p.images?.some((img) => img.includes('unsplash.com') || img.includes('/src/assets/images/')) || p.isPlaceholderPhoto
        );
        if (needsWebsitePhotosUpgrade) {
          const upgraded = parsed.map((p) => {
            const fresh = INITIAL_PRODUCTS.find((init) => init.id === p.id);
            if (fresh) {
              return {
                ...p,
                images: fresh.images,
                isPlaceholderPhoto: false,
              };
            }
            return {
              ...p,
              isPlaceholderPhoto: false,
            };
          });
          localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(upgraded));
          return upgraded;
        }
        return parsed;
      }
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Filter & Search state
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPrintType, setSelectedPrintType] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<'all' | 'under-250' | '250-280' | '300-plus'>('all');

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState<boolean>(false);
  const [isPaxiInfoOpen, setIsPaxiInfoOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState<boolean>(false);
  const [hasOwnerUnlocked, setHasOwnerUnlocked] = useState<boolean>(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [isOrderStatusOpen, setIsOrderStatusOpen] = useState<boolean>(false);
  const [isAppIconOpen, setIsAppIconOpen] = useState<boolean>(false);
  const [isInstallAppOpen, setIsInstallAppOpen] = useState<boolean>(false);
  const [orderStatusRef, setOrderStatusRef] = useState<string>('');

  // PayFast Return / Cancel Route State
  const [paymentView, setPaymentView] = useState<{
    mode: 'return' | 'cancel';
    orderId: string;
  } | null>(() => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const orderId =
      params.get('orderId') ||
      params.get('m_payment_id') ||
      params.get('order_id') ||
      params.get('reference') ||
      '';
    if (path.includes('/payment/return') || params.get('payment') === 'return') {
      return { mode: 'return', orderId };
    }
    if (path.includes('/payment/cancel') || params.get('payment') === 'cancel') {
      return { mode: 'cancel', orderId };
    }
    return null;
  });

  // Layout view options (1 or 2 cols on mobile)
  const [mobileCols, setMobileCols] = useState<1 | 2>(2);

  const { isCartOpen, setIsCartOpen } = useCart();

  const handleOpenOwnerPortal = () => {
    setHasOwnerUnlocked(true);
    setIsAdminPortalOpen(true);
  };

  // Discreet owner access via URL hash, query param, or Alt+O keyboard shortcut
  useEffect(() => {
    const checkHashAndParams = () => {
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (
        hash === '#owner' ||
        hash === '#admin' ||
        hash === '#portal' ||
        params.get('owner') === 'true' ||
        params.get('admin') === 'true'
      ) {
        handleOpenOwnerPortal();
      }
    };
    checkHashAndParams();
    window.addEventListener('hashchange', checkHashAndParams);
    window.addEventListener('popstate', checkHashAndParams);

    // Keyboard shortcut for owner: Alt + O
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        handleOpenOwnerPortal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkHashAndParams);
      window.removeEventListener('popstate', checkHashAndParams);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Save config changes
  const handleUpdateBrandConfig = (newConfig: BrandConfig) => {
    setBrandConfig(newConfig);
    try {
      localStorage.setItem(BRAND_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.warn(e);
    }
  };

  // Save products changes
  const handleUpdateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(newProducts));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleResetToDefault = () => {
    setProducts(INITIAL_PRODUCTS);
    setBrandConfig(INITIAL_BRAND_CONFIG);
    localStorage.removeItem(PRODUCTS_STORAGE_KEY);
    localStorage.removeItem(BRAND_CONFIG_STORAGE_KEY);
  };

  // Filtered and Sorted Products
  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Only published items
        if (product.status === 'draft') return false;

        // Category filter
        if (activeCategory !== 'all' && product.category !== activeCategory) {
          return false;
        }

        // Print Type filter
        if (selectedPrintType !== 'all' && product.printType !== selectedPrintType) {
          return false;
        }

        // Price range filter
        if (priceRange === 'under-250' && product.price >= 250) return false;
        if (priceRange === '250-280' && (product.price < 250 || product.price > 280)) return false;
        if (priceRange === '300-plus' && product.price < 300) return false;

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = product.name.toLowerCase().includes(q);
          const matchDesc = product.description.toLowerCase().includes(q);
          const matchSku = product.sku.toLowerCase().includes(q);
          const matchPrint = product.printType?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchSku && !matchPrint) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'price-asc') return a.price - b.price;
        if (sortOption === 'price-desc') return b.price - a.price;
        if (sortOption === 'newest') {
          if (a.isNewDrop && !b.isNewDrop) return -1;
          if (!a.isNewDrop && b.isNewDrop) return 1;
          return 0;
        }
        // default: featured
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
      });
  }, [products, activeCategory, selectedPrintType, priceRange, searchQuery, sortOption]);

  // Dynamic category counts
  const categoriesList = useMemo(() => {
    const published = products.filter((p) => p.status === 'published');
    return [
      { id: 'all', label: 'All Pieces', count: published.length },
      {
        id: '2026-new-drops',
        label: '2026 Drops',
        count: published.filter((p) => p.category === '2026-new-drops').length,
      },
      {
        id: 't-shirts',
        label: 'T-Shirts (B&W)',
        count: published.filter((p) => p.category === 't-shirts').length,
      },
      {
        id: 'accessories',
        label: 'Accessories',
        count: published.filter((p) => p.category === 'accessories').length,
      },
    ];
  }, [products]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <Header
        brandConfig={brandConfig}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenAdminPortal={handleOpenOwnerPortal}
        onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
        onOpenPaxiInfo={() => setIsPaxiInfoOpen(true)}
        onOpenOrderStatus={() => {
          setOrderStatusRef('');
          setIsOrderStatusOpen(true);
        }}
        onSelectCategory={setActiveCategory}
        activeCategory={activeCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenAppIcon={() => setIsAppIconOpen(true)}
        onOpenInstallApp={() => setIsInstallAppOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {paymentView ? (
          <PaymentStatusPage
            orderId={paymentView.orderId}
            mode={paymentView.mode}
            brandConfig={brandConfig}
            onContinueShopping={() => {
              setPaymentView(null);
              window.history.pushState({}, '', '/');
            }}
            onOpenTrackOrder={(ref) => {
              setPaymentView(null);
              window.history.pushState({}, '', '/');
              setOrderStatusRef(ref);
              setIsOrderStatusOpen(true);
            }}
          />
        ) : (
          <>
            {/* HERO SECTION: Green, White, Blue, Orange and Black Streetwear Palette */}
            <section className="relative rounded-3xl overflow-hidden border border-emerald-800/40 bg-gradient-to-br from-emerald-950 via-zinc-950 to-blue-950 p-6 sm:p-10 lg:p-14 mb-10 shadow-2xl">
          {/* Streetwear ambient gradients & graphics */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-black tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>South African Streetwear Drop</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display text-white tracking-tight uppercase leading-[1.05]">
              Harvest Ke <span className="text-orange-400">LASS</span>
            </h1>

            <p className="text-base sm:text-lg text-emerald-100 font-medium max-w-2xl leading-relaxed">
              {brandConfig.manifesto}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setActiveCategory('2026-new-drops');
                  const el = document.getElementById('catalog-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-orange-500/25 transition-transform active:scale-95"
              >
                <span>Shop 2026 Drops (R300)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setActiveCategory('t-shirts');
                  const el = document.getElementById('catalog-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-colors shadow-lg shadow-blue-900/30"
              >
                Pocket &amp; Back Prints (R250 - R280)
              </button>
            </div>

            {/* Reassurance Badges in Green, White, Blue, Orange */}
            <div className="pt-4 border-t border-emerald-900/40 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-zinc-300">
              <button
                onClick={() => {
                  setOrderStatusRef('');
                  setIsOrderStatusOpen(true);
                }}
                className="flex items-center gap-1.5 hover:text-orange-300 text-orange-400 font-bold transition-colors"
                title="Track your order status"
              >
                <Package className="w-4 h-4 text-orange-400" />
                <span>Track Manual Order (#LASS-XXXX)</span>
              </button>
              <button
                onClick={() => setIsPaxiInfoOpen(true)}
                className="flex items-center gap-1.5 hover:text-white text-blue-300 font-medium transition-colors"
              >
                <Truck className="w-4 h-4 text-blue-400" />
                <span>PAXI PEP Pickup (R60)</span>
              </button>
              <button
                onClick={() => setIsAuditModalOpen(true)}
                className="flex items-center gap-1.5 hover:text-white text-emerald-300 font-medium transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Audited Google Sites Prices</span>
              </button>
              <button
                onClick={() => setIsAppIconOpen(true)}
                className="flex items-center gap-1.5 hover:text-white text-orange-400 font-bold transition-colors"
                title="View & Download official LASS APK app icon"
              >
                <img
                  src="/icon-192.png"
                  alt="APK Icon"
                  className="w-4 h-4 rounded-md border border-orange-500/60 object-contain"
                />
                <span>Official APK Icon (512px)</span>
              </button>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <CreditCard className="w-4 h-4 text-orange-400" />
                <span>Pay In-App (Card &amp; Capitec Pay)</span>
              </div>
            </div>
          </div>
        </section>

        {/* CATALOGUE CONTROLS & FILTERING SECTION */}
        <section id="catalog-section" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="font-display font-black text-2xl text-white uppercase tracking-tight">
                Streetwear Catalogue
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Printed T-Shirts, Back Prints &amp; 2026 Releases in South African Rand (ZAR)
              </p>
            </div>

            {/* Mobile Column Grid Toggle (1-col or 2-col) */}
            <div className="flex items-center gap-2 sm:hidden self-end">
              <span className="text-[11px] text-zinc-500">View:</span>
              <button
                onClick={() => setMobileCols(1)}
                className={`p-1.5 rounded-lg border text-xs ${
                  mobileCols === 1
                    ? 'bg-zinc-800 text-orange-400 border-zinc-700'
                    : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                }`}
                title="Single column"
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMobileCols(2)}
                className={`p-1.5 rounded-lg border text-xs ${
                  mobileCols === 2
                    ? 'bg-zinc-800 text-orange-400 border-zinc-700'
                    : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                }`}
                title="Double column"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filtering and Sorting Component */}
          <SearchAndFilters
            categories={categoriesList}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            sortOption={sortOption}
            onSelectSort={setSortOption}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            totalResults={filteredAndSortedProducts.length}
            selectedPrintType={selectedPrintType}
            setSelectedPrintType={setSelectedPrintType}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
          />

          {/* Product Grid */}
          {filteredAndSortedProducts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="font-bold text-white text-base">No pieces match your filters</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Try clearing your search query or selecting "All Pieces" to browse the full LASS collection.
              </p>
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setSelectedPrintType('all');
                  setPriceRange('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div
              className={`grid gap-4 sm:gap-6 ${
                mobileCols === 1
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}
            >
              {filteredAndSortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Brand Ethos and Origin Story Section */}
        <BrandStorySection
          brandConfig={brandConfig}
          onExploreClick={() => {
            const el = document.getElementById('catalog-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
          </>
        )}
      </main>

      {/* Footer (No client-visible admin links) */}
      <Footer
        brandConfig={brandConfig}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
        onOpenPaxiInfo={() => setIsPaxiInfoOpen(true)}
        onOpenOrderStatus={() => {
          setOrderStatusRef('');
          setIsOrderStatusOpen(true);
        }}
        onOpenAdminPortal={handleOpenOwnerPortal}
        onOpenAppIcon={() => setIsAppIconOpen(true)}
        onOpenInstallApp={() => setIsInstallAppOpen(true)}
      />

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        brandConfig={brandConfig}
        onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
        onOpenPaxiInfo={() => setIsPaxiInfoOpen(true)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        brandConfig={brandConfig}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        brandConfig={brandConfig}
        onTrackOrder={(ref) => {
          setOrderStatusRef(ref);
          setIsOrderStatusOpen(true);
        }}
      />

      <OrderStatusModal
        isOpen={isOrderStatusOpen}
        onClose={() => setIsOrderStatusOpen(false)}
        brandConfig={brandConfig}
        initialOrderRef={orderStatusRef}
      />

      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        initialCategory={selectedProduct?.category || activeCategory}
      />

      <PaxiDeliveryInfoModal
        isOpen={isPaxiInfoOpen}
        onClose={() => setIsPaxiInfoOpen(false)}
        brandConfig={brandConfig}
      />

      <BrandAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        brandConfig={brandConfig}
      />

      <AdminPortalModal
        isOpen={isAdminPortalOpen}
        onClose={() => setIsAdminPortalOpen(false)}
        brandConfig={brandConfig}
        onUpdateBrandConfig={handleUpdateBrandConfig}
        products={products}
        onUpdateProducts={handleUpdateProducts}
        onResetToDefault={handleResetToDefault}
      />

      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        products={products}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      <AppIconModal
        isOpen={isAppIconOpen}
        onClose={() => setIsAppIconOpen(false)}
        brandConfig={brandConfig}
      />

      {/* Floating Owner Quick Bar (Only visible once owner unlocks via 5 taps on the L mark) */}
      {hasOwnerUnlocked && !isAdminPortalOpen && (
        <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 bg-zinc-950/95 border-2 border-emerald-500 rounded-full pl-3.5 pr-2 py-1.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-black text-white uppercase tracking-wider">
            Owner Active
          </span>
          <button
            onClick={() => setIsAdminPortalOpen(true)}
            className="text-[11px] font-black text-orange-400 hover:text-orange-300 px-2.5 py-1 rounded-full bg-orange-500/15 hover:bg-orange-500/25 transition-colors shadow-sm"
          >
            Open Portal
          </button>
          <button
            onClick={() => setHasOwnerUnlocked(false)}
            className="text-[11px] font-bold text-zinc-400 hover:text-rose-400 px-2 py-1 transition-colors"
            title="Lock and return to customer view"
          >
            Lock
          </button>
        </div>
      )}

      {/* PWA Install Banner */}
      <PWAInstallBanner
        forceOpen={isInstallAppOpen}
        onClose={() => setIsInstallAppOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <MainShopContent />
      </WishlistProvider>
    </CartProvider>
  );
}
