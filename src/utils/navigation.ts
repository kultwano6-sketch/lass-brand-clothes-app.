/**
 * LASS Brand Clothes — Android System Back Button & History Navigation Engine
 * Provides authentic Android hardware back button, gesture back, and browser navigation
 * support throughout the entire storefront and administrative portal.
 */

export type ScreenView =
  | 'home'
  | 'category'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'order_status'
  | 'order-status'
  | 'wishlist'
  | 'admin_portal'
  | 'admin'
  | 'size_guide'
  | 'size-guide'
  | 'paxi_info'
  | 'paxi-info'
  | 'audit_modal'
  | 'audit'
  | 'app_icon'
  | 'app-icon'
  | 'install_app'
  | 'install'
  | 'payment'
  | 'drops';

export interface AppNavigationState {
  __lass: true;
  type: 'exit_guard' | 'screen' | 'sub_modal';
  view?: ScreenView;
  subModal?: string;
  subModalName?: string;
  category?: string;
  searchQuery?: string;
  productId?: string;
  orderRef?: string;
  previousView?: string;
  scrollY?: number;
  timestamp: number;
}

/**
 * Initializes the history navigation stack with an exit guard anchor at the base.
 * This guarantees that when a user reaches the home screen and presses Android Back,
 * the application intercepts the back button to show the Exit confirmation dialog
 * instead of unexpectedly closing or terminating the PWA.
 */
export function initAppNavigation(defaultCategory = 'all'): void {
  if (typeof window === 'undefined') return;

  // Set manual scroll restoration so custom scroll coordinates aren't overridden by browser defaults
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  const currentState = window.history.state as AppNavigationState | null;
  if (!currentState || !currentState.__lass) {
    // 1. Replace current initial entry with exit_guard anchor
    window.history.replaceState(
      {
        __lass: true,
        type: 'exit_guard',
        timestamp: Date.now(),
      } as AppNavigationState,
      ''
    );

    // 2. Push initial active home screen entry
    window.history.pushState(
      {
        __lass: true,
        type: 'screen',
        view: 'home',
        category: defaultCategory,
        scrollY: window.scrollY || 0,
        timestamp: Date.now(),
      } as AppNavigationState,
      ''
    );
  }
}

/**
 * Pushes a new screen state to the browser history stack, avoiding duplicate entries.
 */
export function pushScreenState(
  view: ScreenView,
  details: {
    category?: string;
    searchQuery?: string;
    productId?: string;
    orderRef?: string;
    previousView?: string;
    scrollY?: number;
  } = {}
): void {
  if (typeof window === 'undefined') return;

  const current = window.history.state as AppNavigationState | null;

  // Snapshot current scroll position onto the screen we are leaving
  if (current && current.__lass && current.type === 'screen') {
    try {
      window.history.replaceState(
        {
          ...current,
          scrollY: window.scrollY || 0,
        },
        ''
      );
    } catch {}
  }

  // Prevent duplicate consecutive entries
  if (
    current &&
    current.__lass &&
    current.type === 'screen' &&
    current.view === view &&
    current.category === details.category &&
    current.productId === details.productId &&
    current.orderRef === details.orderRef
  ) {
    return;
  }

  const newState: AppNavigationState = {
    __lass: true,
    type: 'screen',
    view,
    category: details.category,
    searchQuery: details.searchQuery,
    productId: details.productId,
    orderRef: details.orderRef,
    previousView: details.previousView,
    scrollY: details.scrollY !== undefined ? details.scrollY : window.scrollY || 0,
    timestamp: Date.now(),
  };

  window.history.pushState(newState, '');
}

/**
 * Pushes a sub-modal state (e.g. Fit Calculator inside Product Modal)
 */
export function pushSubModalState(name: string): void {
  if (typeof window === 'undefined') return;

  const current = window.history.state as AppNavigationState | null;
  if (
    current &&
    current.type === 'sub_modal' &&
    (current.subModalName === name || current.subModal === name)
  ) {
    return;
  }

  window.history.pushState(
    {
      __lass: true,
      type: 'sub_modal',
      subModal: name,
      subModalName: name,
      timestamp: Date.now(),
    } as AppNavigationState,
    ''
  );
}

/**
 * Safely navigates back if the current history state matches the target view or sub-modal,
 * otherwise executes fallback direct state closure.
 */
export function safeNavigateBack(
  expectedViewOrSubModal: string,
  fallbackAction: () => void
): void {
  if (typeof window === 'undefined') {
    fallbackAction();
    return;
  }

  const current = window.history.state as AppNavigationState | null;
  if (
    current &&
    current.__lass &&
    (current.view === expectedViewOrSubModal ||
      current.subModalName === expectedViewOrSubModal ||
      current.subModal === expectedViewOrSubModal)
  ) {
    window.history.back();
  } else {
    fallbackAction();
  }
}

/**
 * Restores scroll position smoothly without erratic layout jumps
 */
export function restoreScrollPosition(scrollY: number): void {
  if (typeof window === 'undefined') return;

  requestAnimationFrame(() => {
    window.scrollTo({ top: scrollY, behavior: 'instant' });
    setTimeout(() => {
      window.scrollTo({ top: scrollY, behavior: 'instant' });
    }, 25);
  });
}
