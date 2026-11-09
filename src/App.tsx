import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, ArrowRight, Truck, MessageSquare, ShieldCheck, Flame, SlidersHorizontal, Grid, Columns, Package, CreditCard } from 'lucide-react';
import { Product, BrandConfig, SubmittedOrder } from './types';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { INITIAL_BRAND_CONFIG } from './data/brandConfig';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';

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
import { ReviewsSection } from './components/ReviewsSection';
import { ExitConfirmationModal } from './components/ExitConfirmationModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PromoBanner } from './components/PromoBanner';
import { LassDropsView } from './components/LassDropsView';
import {
  initAppNavigation,
  pushScreenState,
  safeNavigateBack,
  restoreScrollPosition,
  AppNavigationState,
} from './utils/navigation';

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
  const [isExitModalOpen, setIsExitModalOpen] = useState<boolean>(false);
  const [isDropsOpen, setIsDropsOpen] = useState<boolean>(false);

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

  // Navigation tracking refs to avoid stale closures in popstate listener
  const savedScrollYRef = useRef<number>(0);
  const activeCategoryRef = useRef<string>(activeCategory);
  const productsRef = useRef<Product[]>(products);
  const isExitModalOpenRef = useRef<boolean>(false);

  useEffect(() => {
    activeCategoryRef.current = activeCategory;
  }, [activeCategory]);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    isExitModalOpenRef.current = isExitModalOpen;
  }, [isExitModalOpen]);

  // Initialize Android Back navigation stack with exit guard
  useEffect(() => {
    initAppNavigation(activeCategory);
  }, []);

  // Central Popstate Router for Android System Back Button & Gesture Navigation
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const state = e.state as AppNavigationState | null;

      // 1. Android Back / PWA Back pressed on root screen -> trigger Exit Confirmation
      if (state && (state as any).type === 'exit_guard') {
        const isIOSBrowser =
          typeof window !== 'undefined' &&
          /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) &&
          !(window.navigator as any).standalone &&
          !window.matchMedia('(display-mode: standalone)').matches;

        // In normal iOS Safari browser tab, allow natural edge-swipe without interference
        if (isIOSBrowser) {
          window.history.back();
          return;
        }

        setIsExitModalOpen(true);
        // Push root screen back so another Back button press will not terminate abruptly without user choice
        window.history.pushState(
          {
            __lass: true,
            view: 'home',
            category: activeCategoryRef.current,
            scrollY: window.scrollY,
          },
          '',
          '/'
        );
        return;
      }

      // If Exit Confirmation Dialog is currently open and Back was pressed, dismiss dialog
      if (isExitModalOpenRef.current) {
        setIsExitModalOpen(false);
      }

      // 2. Sub-modal check: inner sub-modals (fit calculator, paxi locator, print slip) handle themselves
      if (state?.subModal) {
        return;
      }

      if (!state || !state.__lass) {
        // Fallback to clean root state
        setSelectedProduct(null);
        setIsCartOpen(false);
        setIsCheckoutOpen(false);
        setIsOrderStatusOpen(false);
        setIsWishlistOpen(false);
        setIsAdminPortalOpen(false);
        setIsSizeGuideOpen(false);
        setIsPaxiInfoOpen(false);
        setIsAuditModalOpen(false);
        setIsAppIconOpen(false);
        setIsInstallAppOpen(false);
        return;
      }

      // 3. Dispatch according to active screen in history
      switch (state.view) {
        case 'home':
          setSelectedProduct(null);
          setIsCartOpen(false);
          setIsCheckoutOpen(false);
          setIsOrderStatusOpen(false);
          setIsWishlistOpen(false);
          setIsAdminPortalOpen(false);
          setIsSizeGuideOpen(false);
          setIsPaxiInfoOpen(false);
          setIsAuditModalOpen(false);
          setIsAppIconOpen(false);
          setIsInstallAppOpen(false);
          setIsDropsOpen(false);
          if (activeCategoryRef.current !== 'all') {
            setActiveCategory('all');
          }
          if (typeof state.scrollY === 'number') {
            restoreScrollPosition(state.scrollY);
          }
          break;

        case 'drops':
          setSelectedProduct(null);
          setIsCartOpen(false);
          setIsCheckoutOpen(false);
          setIsOrderStatusOpen(false);
          setIsWishlistOpen(false);
          setIsAdminPortalOpen(false);
          setIsSizeGuideOpen(false);
          setIsPaxiInfoOpen(false);
          setIsAuditModalOpen(false);
          setIsAppIconOpen(false);
          setIsInstallAppOpen(false);
          setIsDropsOpen(true);
          break;

        case 'category':
          setSelectedProduct(null);
          setIsCartOpen(false);
          setIsCheckoutOpen(false);
          setIsOrderStatusOpen(false);
          setIsWishlistOpen(false);
          setIsAdminPortalOpen(false);
          setIsSizeGuideOpen(false);
          setIsPaxiInfoOpen(false);
          setIsAuditModalOpen(false);
          setIsAppIconOpen(false);
          setIsInstallAppOpen(false);
          if (state.category && state.category !== activeCategoryRef.current) {
            setActiveCategory(state.category);
          }
          if (typeof state.scrollY === 'number') {
            restoreScrollPosition(state.scrollY);
          }
          break;

        case 'product':
          setIsCartOpen(false);
          setIsCheckoutOpen(false);
          setIsOrderStatusOpen(false);
          setIsWishlistOpen(false);
          setIsAdminPortalOpen(false);
          setIsSizeGuideOpen(false);
          setIsPaxiInfoOpen(false);
          setIsAuditModalOpen(false);
          setIsAppIconOpen(false);
          setIsInstallAppOpen(false);
          if (state.productId) {
            const prod = productsRef.current.find((p) => p.id === state.productId);
            if (prod) setSelectedProduct(prod);
          }
          break;

        case 'cart':
          setSelectedProduct(null);
          setIsCheckoutOpen(false);
          setIsOrderStatusOpen(false);
          setIsWishlistOpen(false);
          setIsAdminPortalOpen(false);
          setIsSizeGuideOpen(false);
          setIsPaxiInfoOpen(false);
          setIsAuditModalOpen(false);
          setIsAppIconOpen(false);
          setIsInstallAppOpen(false);
          setIsCartOpen(true);
          break;

        case 'checkout':
          setSelectedProduct(null);
          setIsCartOpen(false);
          setIsOrderStatusOpen(false);
          setIsWishlistOpen(false);
          setIsAdminPortalOpen(false);
          setIsSizeGuideOpen(false);
          setIsPaxiInfoOpen(false);
          setIsAuditModalOpen(false);
          setIsAppIconOpen(false);
          setIsInstallAppOpen(false);
          setIsCheckoutOpen(true);
          break;

        case 'order_status':
        case 'order-status':
          setSelectedProduct(null);
          setIsCartOpen(false);
          setIsCheckoutOpen(false);
          setIsWishlistOpen(false);
          setIsAdminPortalOpen(false);
          setIsSizeGuideOpen(false);
          setIsPaxiInfoOpen(false);
          setIsAuditModalOpen(false);
          setIsAppIconOpen(false);
          setIsInstallAppOpen(false);
          if (state.orderRef) setOrderStatusRef(state.orderRef);
          setIsOrderStatusOpen(true);
          break;

        case 'wishlist':
          setSelectedProduct(null);
          setIsCartOpen(false);
          setIsCheckoutOpen(false);
          setIsOrderStatusOpen(false);
          setIsAdminPortalOpen(false);
          setIsSizeGuideOpen(false);
          setIsPaxiInfoOpen(false);
          setIsAuditModalOpen(false);
          setIsAppIconOpen(false);
          setIsInstallAppOpen(false);
          setIsWishlistOpen(true);
          break;

        case 'admin_portal':
        case 'admin':
          setSelectedProduct(null);
          setIsCartOpen(false);
          setIsCheckoutOpen(false);
          setIsOrderStatusOpen(false);
          setIsWishlistOpen(false);
          setIsSizeGuideOpen(false);
          setIsPaxiInfoOpen(false);
          setIsAuditModalOpen(false);
          setIsAppIconOpen(false);
          setIsInstallAppOpen(false);
          setHasOwnerUnlocked(true);
          setIsAdminPortalOpen(true);
          break;

        case 'size_guide':
        case 'size-guide':
          setIsSizeGuideOpen(true);
          break;

        case 'paxi_info':
        case 'paxi-info':
          setIsPaxiInfoOpen(true);
          break;

        case 'audit_modal':
        case 'audit':
          setIsAuditModalOpen(true);
          break;

        case 'app_icon':
        case 'app-icon':
          setIsAppIconOpen(true);
          break;

        case 'install_app':
        case 'install':
          setIsInstallAppOpen(true);
          break;
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Safe Navigation Actions (Home -> Product, Category, Cart, Checkout, etc.)
  const handleSelectProduct = (product: Product) => {
    savedScrollYRef.current = window.scrollY;
    pushScreenState('product', {
      productId: product.id,
      category: activeCategory,
      previousView: activeCategory === 'all' ? 'home' : 'category',
      scrollY: savedScrollYRef.current,
    });
    setSelectedProduct(product);
  };

  const handleCloseProduct = () => {
    setSelectedProduct(null);
    safeNavigateBack('product', () => {
      setSelectedProduct(null);
      restoreScrollPosition(savedScrollYRef.current);
    });
  };

  const handleSelectCategory = (cat: string) => {
    if (cat === activeCategory) return;
    savedScrollYRef.current = window.scrollY;
    if (cat === 'all') {
      pushScreenState('home', { category: 'all', scrollY: 0 });
    } else {
      pushScreenState('category', { category: cat, scrollY: savedScrollYRef.current });
    }
    setActiveCategory(cat);
  };

  const handleOpenCart = () => {
    pushScreenState('cart', {
      category: activeCategory,
      scrollY: window.scrollY,
    });
    setIsCartOpen(true);
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
    safeNavigateBack('cart', () => setIsCartOpen(false));
  };

  const handleProceedToCheckout = () => {
    pushScreenState('checkout', {
      category: activeCategory,
      scrollY: window.scrollY,
    });
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false);
    safeNavigateBack('checkout', () => setIsCheckoutOpen(false));
  };

  const handleOpenOrderStatus = (ref?: string) => {
    setOrderStatusRef(ref || '');
    pushScreenState('order_status', {
      orderRef: ref,
      category: activeCategory,
      scrollY: window.scrollY,
    });
    setIsOrderStatusOpen(true);
  };

  const handleCloseOrderStatus = () => {
    setIsOrderStatusOpen(false);
    safeNavigateBack('order_status', () => setIsOrderStatusOpen(false));
  };

  const handleOpenWishlist = () => {
    pushScreenState('wishlist', {
      category: activeCategory,
      scrollY: window.scrollY,
    });
    setIsWishlistOpen(true);
  };

  const handleCloseWishlist = () => {
    setIsWishlistOpen(false);
    safeNavigateBack('wishlist', () => setIsWishlistOpen(false));
  };

  const handleOpenOwnerPortal = () => {
    setHasOwnerUnlocked(true);
    pushScreenState('admin_portal', {
      category: activeCategory,
      scrollY: window.scrollY,
    });
    setIsAdminPortalOpen(true);
  };

  const handleCloseOwnerPortal = () => {
    setIsAdminPortalOpen(false);
    safeNavigateBack('admin_portal', () => setIsAdminPortalOpen(false));
  };

  const handleOpenSizeGuide = () => {
    pushScreenState('size_guide', {
      category: activeCategory,
      scrollY: window.scrollY,
    });
    setIsSizeGuideOpen(true);
  };

  const handleCloseSizeGuide = () => {
    setIsSizeGuideOpen(false);
    safeNavigateBack('size_guide', () => setIsSizeGuideOpen(false));
  };

  const handleOpenPaxiInfo = () => {
    pushScreenState('paxi_info', {
      category: activeCategory,
      scrollY: window.scrollY,
    });
    setIsPaxiInfoOpen(true);
  };

  const handleClosePaxiInfo = () => {
    setIsPaxiInfoOpen(false);
    safeNavigateBack('paxi_info', () => setIsPaxiInfoOpen(false));
  };

  const handleOpenAuditModal = () => {
    pushScreenState('audit_modal', {
      category: activeCategory,
      scrollY: window.scrollY,
    });
    setIsAuditModalOpen(true);
  };

  const handleCloseAuditModal = () => {
    setIsAuditModalOpen(false);
    safeNavigateBack('audit_modal', () => setIsAuditModalOpen(false));
  };

  const handleOpenAppIcon = () => {
    pushScreenState('app_icon', {
      category: activeCategory,
      scrollY: window.scrollY,
    });
    setIsAppIconOpen(true);
  };

  const handleCloseAppIcon = () => {
    setIsAppIconOpen(false);
    safeNavigateBack('app_icon', () => setIsAppIconOpen(false));
  };

  const handleOpenInstallApp = () => {
    pushScreenState('install_app', {
      category: activeCategory,
      scrollY: window.scrollY,
    });
    setIsInstallAppOpen(true);
  };

  const handleCloseInstallApp = () => {
    setIsInstallAppOpen(false);
    safeNavigateBack('install_app', () => setIsInstallAppOpen(false));
  };

  const handleOpenDrops = () => {
    pushScreenState('drops', {
      category: activeCategory,
      scrollY: window.scrollY,
    });
    setIsDropsOpen(true);
  };

  const handleCloseDrops = () => {
    setIsDropsOpen(false);
    safeNavigateBack('drops', () => setIsDropsOpen(false));
  };

  const handleStayInStore = () => {
    setIsExitModalOpen(false);
  };

  const handleExitStore = () => {
    setIsExitModalOpen(false);
    try {
      window.close();
    } catch {}
    if (!window.closed) {
      try {
        window.history.go(-2);
      } catch {}
    }
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
        if (sortOption === 'popularity') {
          return (b.popularity || b.salesCount || 0) - (a.popularity || a.salesCount || 0);
        }
        if (sortOption === 'rating') {
          return (b.rating || 5) - (a.rating || 5);
        }
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
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-orange-500 selection:text-white overflow-x-hidden w-full pb-[env(safe-area-inset-bottom,0px)]">
      {/* Top Promotional Announcement Banner */}
      <PromoBanner onOpenDrops={handleOpenDrops} />

      {/* Top Header */}
      <Header
        brandConfig={brandConfig}
        onOpenAuditModal={handleOpenAuditModal}
        onOpenAdminPortal={handleOpenOwnerPortal}
        onOpenSizeGuide={handleOpenSizeGuide}
        onOpenPaxiInfo={handleOpenPaxiInfo}
        onOpenOrderStatus={() => handleOpenOrderStatus('')}
        onSelectCategory={handleSelectCategory}
        activeCategory={activeCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenWishlist={handleOpenWishlist}
        onOpenAppIcon={handleOpenAppIcon}
        onOpenInstallApp={handleOpenInstallApp}
        onOpenCart={handleOpenCart}
        onOpenDrops={handleOpenDrops}
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
              handleOpenOrderStatus(ref);
            }}
          />
        ) : isDropsOpen ? (
          <LassDropsView
            onBackToShop={handleCloseDrops}
            onSelectProduct={(p) => handleSelectProduct(p)}
            allProducts={products}
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
                  handleSelectCategory('2026-new-drops');
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
                  handleSelectCategory('t-shirts');
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
                onClick={() => handleOpenOrderStatus('')}
                className="flex items-center gap-1.5 hover:text-orange-300 text-orange-400 font-bold transition-colors"
                title="Track your order status"
              >
                <Package className="w-4 h-4 text-orange-400" />
                <span>Track Manual Order (#LASS-XXXX)</span>
              </button>
              <button
                onClick={handleOpenPaxiInfo}
                className="flex items-center gap-1.5 hover:text-white text-blue-300 font-medium transition-colors"
              >
                <Truck className="w-4 h-4 text-blue-400" />
                <span>PAXI PEP Pickup (R60)</span>
              </button>
              <button
                onClick={handleOpenAuditModal}
                className="flex items-center gap-1.5 hover:text-white text-emerald-300 font-medium transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Audited Google Sites Prices</span>
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
            onSelectCategory={handleSelectCategory}
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
                  handleSelectCategory('all');
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
                  onSelect={(p) => handleSelectProduct(p)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Customer Reviews & Street Style Section */}
        <ReviewsSection brandConfig={brandConfig} />

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
        onOpenAuditModal={handleOpenAuditModal}
        onOpenSizeGuide={handleOpenSizeGuide}
        onOpenPaxiInfo={handleOpenPaxiInfo}
        onOpenOrderStatus={() => handleOpenOrderStatus('')}
        onOpenAdminPortal={handleOpenOwnerPortal}
        onOpenAppIcon={handleOpenAppIcon}
        onOpenInstallApp={handleOpenInstallApp}
      />

      {/* Modals & Drawers */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={handleCloseProduct}
          brandConfig={brandConfig}
          onOpenSizeGuide={handleOpenSizeGuide}
          onOpenPaxiInfo={handleOpenPaxiInfo}
          allProducts={products}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={handleCloseCart}
        onProceedToCheckout={handleProceedToCheckout}
        brandConfig={brandConfig}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={handleCloseCheckout}
        brandConfig={brandConfig}
        onTrackOrder={(ref) => handleOpenOrderStatus(ref)}
      />

      <OrderStatusModal
        isOpen={isOrderStatusOpen}
        onClose={handleCloseOrderStatus}
        brandConfig={brandConfig}
        initialOrderRef={orderStatusRef}
      />

      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={handleCloseSizeGuide}
        initialCategory={selectedProduct?.category || activeCategory}
      />

      <PaxiDeliveryInfoModal
        isOpen={isPaxiInfoOpen}
        onClose={handleClosePaxiInfo}
        brandConfig={brandConfig}
      />

      <BrandAuditModal
        isOpen={isAuditModalOpen}
        onClose={handleCloseAuditModal}
        brandConfig={brandConfig}
      />

      <AdminPortalModal
        isOpen={isAdminPortalOpen}
        onClose={handleCloseOwnerPortal}
        brandConfig={brandConfig}
        onUpdateBrandConfig={handleUpdateBrandConfig}
        products={products}
        onUpdateProducts={handleUpdateProducts}
        onResetToDefault={handleResetToDefault}
      />

      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={handleCloseWishlist}
        products={products}
        onSelectProduct={(p) => handleSelectProduct(p)}
      />

      <AppIconModal
        isOpen={isAppIconOpen}
        onClose={handleCloseAppIcon}
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
            onClick={handleOpenOwnerPortal}
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
        onClose={handleCloseInstallApp}
      />

      {/* Android System Back Exit Confirmation Modal */}
      <ExitConfirmationModal
        isOpen={isExitModalOpen}
        onStay={handleStayInStore}
        onExit={handleExitStore}
        brandConfig={brandConfig}
      />

      {/* Cross-Platform Offline Connectivity Toast */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <WishlistProvider>
          <MainShopContent />
        </WishlistProvider>
      </CartProvider>
    </ThemeProvider>
  );
}
