import { SubmittedOrder } from '../types';

export const ORDERS_STORAGE_KEY = 'lass_order_history_v1';

// Prototype initial seed orders for testing lookup
export const DEMO_SAMPLE_ORDERS: SubmittedOrder[] = [
  {
    orderNumber: 'LASS-1234',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    customer: {
      fullName: 'Thabo Mokoena',
      phoneOrWhatsApp: '072 345 6789',
      deliveryMethod: 'paxi-standard',
      pepStoreBranch: 'PEP Store Soweto Bara Mall (P4021)',
      customerNote: 'Please keep tag intact, gift for brother',
    },
    items: [
      {
        productId: 'lass-bw-back-01',
        name: 'Back Print T-Shirt (B/W)',
        selectedSize: 'L',
        selectedColour: 'Classic Black',
        unitPrice: 280,
        quantity: 1,
        totalPrice: 280,
      },
      {
        productId: 'lass-acc-cap-01',
        name: 'LASS Streetwear Snapback Cap',
        selectedSize: 'One Size',
        selectedColour: 'Classic Black',
        unitPrice: 180,
        quantity: 1,
        totalPrice: 180,
      },
    ],
    subtotal: 460,
    deliveryFee: 60,
    estimatedTotal: 520,
    whatsappMessageText: 'Demo order #LASS-1234',
    whatsappUrl: 'https://wa.me/27664412203',
    status: 'dispatched_paxi',
    paxiTrackingCode: 'PAXI-JH-883921',
    statusNotes: 'Parcel dropped at PEP dispatch counter. On route to Soweto Bara Mall.',
  },
  {
    orderNumber: 'LASS-2026',
    date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    customer: {
      fullName: 'Keabetswe Dlamini',
      phoneOrWhatsApp: '083 987 6543',
      deliveryMethod: 'paxi-express',
      pepStoreBranch: 'PEP Mall of Africa (Midrand)',
    },
    items: [
      {
        productId: 'lass-2026-harvest-01',
        name: '2026 Harvest Signature T-Shirt',
        selectedSize: 'XL',
        selectedColour: 'Deep Charcoal',
        unitPrice: 300,
        quantity: 1,
        totalPrice: 300,
      },
    ],
    subtotal: 300,
    deliveryFee: 100,
    estimatedTotal: 400,
    whatsappMessageText: 'Demo order #LASS-2026',
    whatsappUrl: 'https://wa.me/27664412203',
    status: 'payment_confirmed',
    statusNotes: 'EFT payment confirmed. Garment queued for printing & packaging.',
  },
];

export function getLocalOrders(): SubmittedOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) {
      // Seed with prototype demo orders so search test immediately works
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(DEMO_SAMPLE_ORDERS));
      return DEMO_SAMPLE_ORDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Error reading orders from localStorage', err);
    return DEMO_SAMPLE_ORDERS;
  }
}

export function saveLocalOrder(order: SubmittedOrder): void {
  try {
    const orders = getLocalOrders();
    const existingIndex = orders.findIndex((o) => o.orderNumber === order.orderNumber);
    if (existingIndex > -1) {
      orders[existingIndex] = order;
    } else {
      orders.unshift(order);
    }
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (err) {
    console.warn('Error saving order to localStorage', err);
  }
}

export function findOrderByReference(refQuery: string): SubmittedOrder | null {
  if (!refQuery) return null;
  const cleanQuery = refQuery.trim().replace(/^#/, '').toLowerCase();
  const orders = getLocalOrders();
  return (
    orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === cleanQuery ||
        o.orderNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() ===
          cleanQuery.replace(/[^a-zA-Z0-9]/g, '')
    ) || null
  );
}

export function updateOrderStatus(
  orderNumber: string,
  newStatus: SubmittedOrder['status'],
  notes?: string,
  paxiCode?: string
): boolean {
  try {
    const orders = getLocalOrders();
    const target = orders.find((o) => o.orderNumber.toLowerCase() === orderNumber.toLowerCase());
    if (target) {
      target.status = newStatus;
      if (notes !== undefined) target.statusNotes = notes;
      if (paxiCode !== undefined) target.paxiTrackingCode = paxiCode;
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function deleteLocalOrder(orderNumber: string): boolean {
  try {
    const orders = getLocalOrders();
    const filtered = orders.filter((o) => o.orderNumber.toLowerCase() !== orderNumber.toLowerCase());
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.warn('Error deleting order from localStorage', err);
    return false;
  }
}

export function clearLocalOrders(): boolean {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([]));
    return true;
  } catch (err) {
    console.warn('Error clearing orders from localStorage', err);
    return false;
  }
}

export function deleteMultipleLocalOrders(orderNumbers: string[]): boolean {
  try {
    const set = new Set(orderNumbers.map((s) => s.toLowerCase()));
    const orders = getLocalOrders();
    const filtered = orders.filter((o) => !set.has(o.orderNumber.toLowerCase()));
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.warn('Error deleting multiple orders from localStorage', err);
    return false;
  }
}
