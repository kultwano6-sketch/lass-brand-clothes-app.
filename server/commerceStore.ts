import {
  SubmittedOrder,
  OrderStatus,
  DiscountCode,
  ProductReview,
  LassDrop,
  DropStatus,
  ReviewStatus,
} from '../src/types/index.js';

// ==========================================
// CANONICAL ORDER STATUSES & VALID TRANSITIONS
// ==========================================
export const CANONICAL_ORDER_STATUSES: OrderStatus[] = [
  'awaiting_payment',
  'payment_confirmed',
  'processing',
  'ready_for_dispatch',
  'dispatched',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refund_pending',
  'refunded',
];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'Awaiting Payment',
  payment_confirmed: 'Payment Confirmed',
  processing: 'Processing',
  ready_for_dispatch: 'Ready for Dispatch',
  dispatched: 'Dispatched (With PAXI / Courier)',
  out_for_delivery: 'Out for Delivery / Counter Ready',
  delivered: 'Delivered / Collected',
  cancelled: 'Cancelled',
  refund_pending: 'Refund Pending',
  refunded: 'Refunded',
  // Legacy aliases
  pending_payment: 'Awaiting Payment',
  whatsapp_generated: 'Awaiting Payment',
  pending_verification: 'Processing',
  dispatched_paxi: 'Dispatched (With PAXI / Courier)',
  ready_for_collection: 'Out for Delivery / Counter Ready',
  completed: 'Delivered / Collected',
};

export function normalizeOrderStatus(status: string): OrderStatus {
  switch (status) {
    case 'pending_payment':
    case 'whatsapp_generated':
      return 'awaiting_payment';
    case 'pending_verification':
      return 'processing';
    case 'dispatched_paxi':
      return 'dispatched';
    case 'ready_for_collection':
      return 'out_for_delivery';
    case 'completed':
      return 'delivered';
    default:
      if (CANONICAL_ORDER_STATUSES.includes(status as OrderStatus)) {
        return status as OrderStatus;
      }
      return 'awaiting_payment';
  }
}

/**
 * Validates whether an order status change is permitted according to
 * professional fashion e-commerce fulfilment lifecycle rules.
 */
export function isValidStatusTransition(
  current: OrderStatus | string,
  target: OrderStatus | string
): { valid: boolean; reason?: string } {
  const normCurrent = normalizeOrderStatus(current);
  const normTarget = normalizeOrderStatus(target);

  if (normCurrent === normTarget) {
    return { valid: true };
  }

  // Terminal states cannot be resurrected without explicit audit
  if (normCurrent === 'refunded') {
    return { valid: false, reason: 'Refunded orders cannot be transitioned to another status.' };
  }
  if (normCurrent === 'cancelled') {
    return { valid: false, reason: 'Cancelled orders cannot be reopened.' };
  }

  // Cancellation is allowed from any pre-dispatched state
  if (normTarget === 'cancelled') {
    if (['dispatched', 'out_for_delivery', 'delivered'].includes(normCurrent)) {
      return {
        valid: false,
        reason: 'Order has already left the warehouse / PEP counter. Please initiate a refund instead.',
      };
    }
    return { valid: true };
  }

  // Refunds are allowed only for orders with confirmed payment
  if (normTarget === 'refund_pending' || normTarget === 'refunded') {
    if (normCurrent === 'awaiting_payment') {
      return { valid: false, reason: 'Cannot refund an order that has not been paid.' };
    }
    return { valid: true };
  }

  // Standard forward progression flow
  const progressionOrder: OrderStatus[] = [
    'awaiting_payment',
    'payment_confirmed',
    'processing',
    'ready_for_dispatch',
    'dispatched',
    'out_for_delivery',
    'delivered',
  ];

  const currentIndex = progressionOrder.indexOf(normCurrent);
  const targetIndex = progressionOrder.indexOf(normTarget);

  if (currentIndex === -1 || targetIndex === -1) {
    return { valid: false, reason: `Unknown status: ${target}` };
  }

  // Allow forward progression or jumping to next sensible step
  if (targetIndex >= currentIndex) {
    return { valid: true };
  }

  // Allow minor backwards corrections (e.g. ready_for_dispatch back to processing if garment re-tagged)
  if (currentIndex - targetIndex === 1 && normCurrent !== 'delivered') {
    return { valid: true };
  }

  return {
    valid: false,
    reason: `Invalid transition from "${ORDER_STATUS_LABELS[normCurrent]}" to "${ORDER_STATUS_LABELS[normTarget]}".`,
  };
}

// ==========================================
// INITIAL DISCOUNT CODES
// ==========================================
export const INITIAL_DISCOUNT_CODES: DiscountCode[] = [
  {
    id: 'disc-harvest10',
    code: 'HARVEST10',
    type: 'percentage',
    value: 10,
    minOrderAmount: 400,
    maxUses: 500,
    usedCount: 28,
    isActive: true,
    description: '10% off for the Harvest ke LASS community (orders R400+)',
  },
  {
    id: 'disc-kasi50',
    code: 'KASI50',
    type: 'fixed',
    value: 50,
    minOrderAmount: 500,
    maxUses: 200,
    usedCount: 42,
    isActive: true,
    description: 'R50 instant off when you grab R500+ worth of drip',
  },
  {
    id: 'disc-firstdrop',
    code: 'FIRSTDROP',
    type: 'fixed',
    value: 30,
    minOrderAmount: 250,
    maxUses: 1000,
    usedCount: 115,
    isActive: true,
    description: 'R30 welcome voucher for first-time shoppers',
  },
  {
    id: 'disc-vip15',
    code: 'LASS2026',
    type: 'percentage',
    value: 15,
    minOrderAmount: 600,
    maxUses: 100,
    usedCount: 18,
    isActive: true,
    description: '15% exclusive VIP discount on 2026 collections (orders R600+)',
  },
];

// ==========================================
// INITIAL LASS DROPS
// ==========================================
export const INITIAL_DROPS: LassDrop[] = [
  {
    id: 'drop-2026-harvest',
    title: '2026 Harvest Signature Drop',
    subtitle: 'Limited Run • Heavyweight 220gsm Organic Cotton',
    slug: '2026-harvest-signature',
    description:
      'The defining streetwear drop of 2026. Hand-screened high density typography, reinforced ribbed neckline, and the signature "Harvest ke LASS" emblem.',
    storyManifesto:
      'Greatness begins with self-belief. When you trust your vision, you harvest success from even the hardest soil.',
    bannerImage: '/clothes/site_drop_2026_01.jpg',
    lookbookImages: [
      '/clothes/site_drop_2026_01.jpg',
      '/clothes/site_drop_2026_02.jpg',
      '/clothes/site_drop_2026_03.jpg',
      '/clothes/site_drop_2026_04.jpg',
    ],
    productIds: ['lass-2026-harvest-01', 'lass-2026-kasi-02'],
    launchDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // active now
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    isLimitedEdition: true,
    totalStockAllocated: 52,
    themeColour: '#f97316',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'drop-winter-2026',
    title: 'Winter 2026 Kasi Outerwear Drop',
    subtitle: 'Pre-Release Drops • Heavyweight Fleece & Street Beanies',
    slug: 'winter-2026-kasi-outerwear',
    description:
      'Engineered for crisp Gauteng winters and cold street corners. Tight-ribbed knit beanies, heavyweight cotton statement backs, and signature wrist wraps.',
    storyManifesto: 'Warmth, grit and purpose woven into every seam.',
    bannerImage: '/clothes/site_bw_back_print_03_back.jpg',
    lookbookImages: [
      '/clothes/site_bw_back_print_03_back.jpg',
      '/clothes/site_acc_beanie_150.jpg',
      '/clothes/site_acc_wristband_100_01.jpg',
    ],
    productIds: ['lass-bw-back-02', 'lass-acc-beanie-01', 'lass-acc-wrist-01'],
    // Launching 3 days in future to showcase countdown timers & scheduled release gate
    launchDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled',
    isLimitedEdition: true,
    totalStockAllocated: 72,
    themeColour: '#2563eb',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'drop-original-foundations',
    title: 'Original Kasi Monochrome Foundations',
    subtitle: 'The Archive • Back & Pocket Signature Prints',
    slug: 'original-kasi-foundations',
    description:
      'The foundational monochrome black-and-white t-shirts that started the movement across Soweto, Katlehong and Pretoria.',
    storyManifesto: 'From the dust of poverty rises the seed of belief.',
    bannerImage: '/clothes/site_bw_pocket_01_front.jpg',
    lookbookImages: [
      '/clothes/site_bw_pocket_01_front.jpg',
      '/clothes/site_bw_pocket_02_back.jpg',
      '/clothes/site_bw_front_print_01.jpg',
    ],
    productIds: ['lass-bw-pocket-01', 'lass-bw-back-01', 'lass-bw-front-01', 'lass-bw-pocket-front-02'],
    launchDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ended',
    isLimitedEdition: false,
    totalStockAllocated: 150,
    themeColour: '#047857',
    createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ==========================================
// INITIAL VERIFIED CUSTOMER REVIEWS
// ==========================================
export const INITIAL_REVIEWS: ProductReview[] = [
  {
    id: 'rev-01',
    productId: 'lass-2026-harvest-01',
    orderNumber: 'LASS-1234',
    customerName: 'Sipho Ndlovu',
    customerEmailOrPhone: '083***4912',
    rating: 5,
    title: 'Quality is crazy! Best kasi streetwear brand',
    comment:
      'The 220gsm cotton feels so heavyweight and premium. Printing is thick and does not crack in the washing machine. Picked it up at PEP Bara Mall in 3 days. Bona ntwana, LASS is real!',
    images: ['/clothes/site_drop_2026_01.jpg'],
    verifiedPurchase: true,
    status: 'approved',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    helpfulCount: 14,
  },
  {
    id: 'rev-02',
    productId: 'lass-bw-back-01',
    orderNumber: 'LASS-3280',
    customerName: 'Kagiso Molefe',
    customerEmailOrPhone: '071***8821',
    rating: 5,
    title: 'Back print turns heads everywhere in Maboneng',
    comment:
      'Size XL fit is relaxed and comfortable. The "HARVEST KE LASS" quote on the back inspires everyone who reads it. Definitely buying the white one next drop.',
    verifiedPurchase: true,
    status: 'approved',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    helpfulCount: 9,
  },
  {
    id: 'rev-03',
    productId: 'lass-bw-pocket-01',
    orderNumber: 'LASS-7711',
    customerName: 'Nthabiseng Zulu',
    customerEmailOrPhone: '082***1024',
    rating: 5,
    title: 'Clean subtle drip for everyday wear',
    comment:
      'Fabric is breathable 100% cotton. Size M fits true to size. Delivery to PEP Pretoria CBD was fast with tracking SMS. Super satisfied!',
    verifiedPurchase: true,
    status: 'approved',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    helpfulCount: 7,
  },
  {
    id: 'rev-04',
    productId: 'lass-acc-cap-01',
    customerName: 'Tshepo M.',
    customerEmailOrPhone: '076***9932',
    rating: 4,
    title: 'Solid embroidery and stiff brim',
    comment: 'Great cap, matches perfectly with the back print tee. High profile 6-panel fit.',
    verifiedPurchase: false,
    status: 'approved',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    helpfulCount: 3,
  },
];

// ==========================================
// COMMERCE STORE CONTROLLER
// ==========================================
export class CommerceStore {
  private discounts: Map<string, DiscountCode> = new Map();
  private drops: Map<string, LassDrop> = new Map();
  private reviews: Map<string, ProductReview> = new Map();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized) return;
    INITIAL_DISCOUNT_CODES.forEach((d) => this.discounts.set(d.id, { ...d }));
    INITIAL_DROPS.forEach((drop) => this.drops.set(drop.id, { ...drop }));
    INITIAL_REVIEWS.forEach((r) => this.reviews.set(r.id, { ...r }));
    this.isInitialized = true;
  }

  // --- DISCOUNTS ---
  public getAllDiscounts(): DiscountCode[] {
    return Array.from(this.discounts.values());
  }

  public validateDiscount(
    codeStr: string,
    subtotal: number
  ): {
    valid: boolean;
    error?: string;
    discount?: DiscountCode;
    discountAmount: number;
    finalTotal: number;
  } {
    const clean = (codeStr || '').trim().toUpperCase();
    if (!clean) {
      return { valid: false, error: 'Please enter a discount code.', discountAmount: 0, finalTotal: subtotal };
    }

    const disc = Array.from(this.discounts.values()).find((d) => d.code.toUpperCase() === clean);
    if (!disc) {
      return { valid: false, error: `Discount code "${clean}" is invalid or does not exist.`, discountAmount: 0, finalTotal: subtotal };
    }

    if (!disc.isActive) {
      return { valid: false, error: `Discount code "${clean}" is currently disabled.`, discountAmount: 0, finalTotal: subtotal };
    }

    if (disc.maxUses && disc.usedCount >= disc.maxUses) {
      return { valid: false, error: `Discount code "${clean}" has reached its maximum usage limit.`, discountAmount: 0, finalTotal: subtotal };
    }

    if (disc.minOrderAmount && subtotal < disc.minOrderAmount) {
      return {
        valid: false,
        error: `Discount code "${clean}" requires a minimum order value of R${disc.minOrderAmount}. (Your subtotal is R${subtotal})`,
        discountAmount: 0,
        finalTotal: subtotal,
      };
    }

    let discountAmount = 0;
    if (disc.type === 'percentage') {
      discountAmount = Math.round((subtotal * disc.value) / 100);
    } else {
      discountAmount = Math.min(disc.value, subtotal);
    }

    const finalTotal = Math.max(0, subtotal - discountAmount);

    return {
      valid: true,
      discount: disc,
      discountAmount,
      finalTotal,
    };
  }

  public recordDiscountUse(codeStr: string): void {
    const clean = (codeStr || '').trim().toUpperCase();
    const disc = Array.from(this.discounts.values()).find((d) => d.code.toUpperCase() === clean);
    if (disc) {
      disc.usedCount += 1;
      this.discounts.set(disc.id, disc);
    }
  }

  public saveDiscount(disc: DiscountCode): DiscountCode {
    const id = disc.id || `disc-${Date.now()}`;
    const code = disc.code.trim().toUpperCase();
    const updated = { ...disc, id, code };
    this.discounts.set(id, updated);
    return updated;
  }

  public deleteDiscount(id: string): boolean {
    return this.discounts.delete(id);
  }

  // --- DROPS ---
  public getAllDrops(): LassDrop[] {
    const list = Array.from(this.drops.values());
    const now = Date.now();

    // Dynamically update status based on launchDate and endDate
    return list.map((drop) => {
      const launchMs = new Date(drop.launchDate).getTime();
      const endMs = drop.endDate ? new Date(drop.endDate).getTime() : Infinity;

      let status = drop.status;
      if (status !== 'draft' && status !== 'archived') {
        if (now < launchMs) {
          status = 'scheduled';
        } else if (now >= launchMs && now <= endMs) {
          status = 'active';
        } else {
          status = 'ended';
        }
      }
      return { ...drop, status };
    });
  }

  public getDrop(id: string): LassDrop | null {
    return this.drops.get(id) || null;
  }

  public saveDrop(drop: LassDrop): LassDrop {
    const id = drop.id || `drop-${Date.now()}`;
    const updated = { ...drop, id };
    this.drops.set(id, updated);
    return updated;
  }

  public deleteDrop(id: string): boolean {
    return this.drops.delete(id);
  }

  // --- REVIEWS ---
  public getReviewsForProduct(productId?: string): ProductReview[] {
    const all = Array.from(this.reviews.values());
    if (!productId || productId === 'all') {
      return all.filter((r) => r.status === 'approved');
    }
    return all.filter((r) => r.productId === productId && r.status === 'approved');
  }

  public getAllReviewsAdmin(): ProductReview[] {
    return Array.from(this.reviews.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public submitReview(data: Omit<ProductReview, 'id' | 'createdAt' | 'status'>): ProductReview {
    const id = `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newRev: ProductReview = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      status: 'approved', // Auto-approved for verified/regular with moderation queue
      helpfulCount: 0,
      reportCount: 0,
    };
    this.reviews.set(id, newRev);
    return newRev;
  }

  public moderateReview(id: string, status: ReviewStatus, adminNotes?: string): ProductReview | null {
    const rev = this.reviews.get(id);
    if (!rev) return null;
    rev.status = status;
    if (adminNotes !== undefined) rev.adminNotes = adminNotes;
    this.reviews.set(id, rev);
    return rev;
  }

  public reportReview(id: string, reason: string): boolean {
    const rev = this.reviews.get(id);
    if (!rev) return false;
    rev.status = 'reported';
    rev.reportCount = (rev.reportCount || 0) + 1;
    rev.reportReason = reason;
    this.reviews.set(id, rev);
    return true;
  }
}

export const commerceStore = new CommerceStore();
