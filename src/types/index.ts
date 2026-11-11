export type ProductCategory = 'all' | 't-shirts' | '2026-new-drops' | 'accessories' | 'collections';

export interface ProductVariation {
  size: string;
  colour: string;
  stock: number;
  sku?: string;
  price?: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number; // in South African Rand (ZAR)
  compareAtPrice?: number;
  category: 't-shirts' | '2026-new-drops' | 'accessories';
  printType: 'Pocket Print' | 'Back Print' | 'Front Print' | 'Full Graphic' | 'Embroidered' | 'Accessory';
  description: string;
  storyQuote?: string;
  images: string[];
  availableSizes: string[];
  availableColours: string[];
  variations?: ProductVariation[];
  fit: string;
  fabricDetails: string;
  isNewDrop: boolean;
  isFeatured: boolean;
  isAuditedOriginal: boolean;
  stockQuantity: number;
  status: 'published' | 'draft';
  isPlaceholderPhoto: boolean;
  // Hybrid Commerce Extensions
  dropId?: string; // Associated LASS Drop / Collection
  isLimitedEdition?: boolean;
  relatedProductIds?: string[]; // Outfits & Matching pieces
  rating?: number; // Average 1-5
  reviewCount?: number;
  tags?: string[];
  popularity?: number; // Sorting metric
  salesCount?: number;
  createdAt?: string;
}

export interface CartItem {
  id: string; // unique hash (productId + size + colour)
  productId: string;
  product: Product;
  selectedSize: string;
  selectedColour: string;
  quantity: number;
}

export interface OrderCustomerDetails {
  fullName: string;
  phoneOrWhatsApp: string;
  email?: string;
  deliveryMethod: 'paxi-standard' | 'paxi-express' | 'collection';
  pepStoreBranch: string; // PEP Store name or PAXI point code
  deliveryAddress?: string;
  customerNote?: string;
}

export type OrderStatus =
  | 'awaiting_payment'
  | 'payment_confirmed'
  | 'processing'
  | 'ready_for_dispatch'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refund_pending'
  | 'refunded'
  // Legacy aliases for backward compatibility
  | 'pending_payment'
  | 'whatsapp_generated'
  | 'pending_verification'
  | 'dispatched_paxi'
  | 'ready_for_collection'
  | 'completed';

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface SubmittedOrder {
  orderNumber: string;
  date: string;
  customer: OrderCustomerDetails;
  items: {
    productId: string;
    name: string;
    selectedSize: string;
    selectedColour: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  discountAmount?: number;
  discountCode?: string;
  estimatedTotal: number;
  whatsappMessageText: string;
  whatsappUrl: string;
  status: OrderStatus;
  paxiTrackingCode?: string;
  courierName?: string;
  trackingUrl?: string;
  statusNotes?: string;
  statusHistory?: OrderStatusHistoryEntry[];
  // In-App Payment Information
  paymentMethod?: 'payfast' | 'card' | 'instant_eft' | 'snapscan' | 'manual_eft' | 'whatsapp';
  paymentStatus?: 'paid' | 'pending' | 'failed' | 'cancelled' | 'refunded';
  transactionId?: string;
  paidAt?: string;
  paymentDetails?: {
    cardLast4?: string;
    cardBrand?: string;
    bankName?: string;
    accountNumberMasked?: string;
    referenceCode?: string;
  };
}

export interface BrandConfig {
  brandName: string;
  tagline: string;
  manifesto: string;
  subManifesto: string;
  ownerWhatsApp: string; // e.g. 0664412203
  displayWhatsApp: string;
  secondaryCallNumber: string;
  email: string;
  paxiStandardFee: number; // R60
  paxiExpressFee: number; // R100
  paxiLeadDays: string; // "5-10 business days"
  bannerAnnouncement?: {
    enabled: boolean;
    text: string;
    linkUrl?: string;
    badgeText?: string;
  };
}

// ==========================================
// LASS DROPS & COLLECTIONS
// ==========================================
export type DropStatus = 'draft' | 'scheduled' | 'active' | 'ended' | 'archived';

export interface LassDrop {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  description: string;
  storyManifesto?: string;
  bannerImage: string;
  lookbookImages?: string[];
  productIds: string[];
  launchDate: string; // ISO 8601 string
  endDate?: string;   // Optional ISO 8601 string
  launchesAt?: string; // Alias
  endsAt?: string;     // Alias
  status: DropStatus;
  isLimitedEdition: boolean;
  totalStockAllocated?: number;
  totalPieces?: number;
  remainingPieces?: number;
  themeColour?: string; // hex accent
  createdAt: string;
}

// ==========================================
// CUSTOMER REVIEWS
// ==========================================
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'reported';

export interface ProductReview {
  id: string;
  productId: string;
  orderNumber?: string;
  customerName: string;
  customerEmailOrPhone?: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  images?: string[]; // user uploaded photos
  verifiedPurchase?: boolean;
  isVerifiedPurchase?: boolean;
  status: ReviewStatus;
  createdAt: string;
  helpfulCount?: number;
  reportCount?: number;
  reportReason?: string;
  adminNotes?: string;
}

// ==========================================
// DISCOUNT & PROMOTIONAL CODES
// ==========================================
export type DiscountType = 'percentage' | 'fixed';

export interface DiscountCode {
  id: string;
  code: string; // uppercase string (e.g. HARVEST10, KASI50)
  type: DiscountType;
  value: number; // percentage (10 = 10%) or ZAR amount (50 = R50)
  minOrderAmount?: number; // minimum subtotal in ZAR to apply
  maxUses?: number;
  usedCount: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  description?: string;
}

// ==========================================
// NOTIFICATIONS
// ==========================================
export type NotificationType = 'order' | 'drop' | 'promo' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
  link?: string;
  actionUrl?: string;
  orderNumber?: string;
  dropId?: string;
}

// ==========================================
// SORT & FILTER
// ==========================================
export type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'rating';

export interface ProductFilterState {
  category: ProductCategory;
  printType: string;
  fit: string;
  size: string;
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  searchQuery: string;
  sortBy: SortOption;
}
