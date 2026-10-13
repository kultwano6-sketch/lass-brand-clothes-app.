export type ProductCategory = 'all' | 't-shirts' | '2026-new-drops' | 'accessories';

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
  fit: string;
  fabricDetails: string;
  isNewDrop: boolean;
  isFeatured: boolean;
  isAuditedOriginal: boolean;
  stockQuantity: number;
  status: 'published' | 'draft';
  isPlaceholderPhoto: boolean;
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
  estimatedTotal: number;
  whatsappMessageText: string;
  whatsappUrl: string;
  status: 'whatsapp_generated' | 'pending_verification' | 'payment_confirmed' | 'dispatched_paxi' | 'ready_for_collection' | 'completed';
  paxiTrackingCode?: string;
  statusNotes?: string;
  // In-App Payment Information
  paymentMethod?: 'card' | 'instant_eft' | 'snapscan' | 'manual_eft' | 'whatsapp';
  paymentStatus?: 'paid' | 'pending' | 'failed';
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
  freeDeliveryThreshold?: number;
}
