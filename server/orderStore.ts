export interface OrderCustomerDetails {
  fullName: string;
  phoneOrWhatsApp: string;
  email?: string;
  deliveryMethod: 'paxi-standard' | 'paxi-express' | 'collection';
  pepStoreBranch: string;
  deliveryAddress?: string;
  customerNote?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  selectedSize: string;
  selectedColour: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface SubmittedOrder {
  orderNumber: string;
  date: string;
  customer: OrderCustomerDetails;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  estimatedTotal: number;
  whatsappMessageText: string;
  whatsappUrl: string;
  status:
    | 'pending_payment'
    | 'payment_confirmed'
    | 'whatsapp_generated'
    | 'pending_verification'
    | 'dispatched_paxi'
    | 'ready_for_collection'
    | 'completed'
    | 'cancelled';
  paxiTrackingCode?: string;
  statusNotes?: string;
  paymentMethod?: 'payfast' | 'card' | 'instant_eft' | 'whatsapp';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'cancelled';
  transactionId?: string; // pf_payment_id from PayFast
  paidAt?: string;
  payfastData?: Record<string, any>;
  itnHistory?: Array<{
    receivedAt: string;
    pfPaymentId: string;
    paymentStatus: string;
    amountGross: string;
    signatureVerified: boolean;
    serverValidated: boolean;
  }>;
}

export interface PaymentRecordResult {
  pfPaymentId: string;
  paymentStatus: 'COMPLETE' | 'FAILED' | 'CANCELLED';
  amountGross: number;
  signatureVerified: boolean;
  serverValidated: boolean;
  rawItn: Record<string, any>;
}

export interface IOrderStore {
  save(order: SubmittedOrder): Promise<SubmittedOrder>;
  get(orderNumber: string): Promise<SubmittedOrder | null>;
  getAll(): Promise<SubmittedOrder[]>;
  recordPaymentResult(
    orderNumber: string,
    result: PaymentRecordResult
  ): Promise<{ order: SubmittedOrder; alreadyProcessed: boolean }>;
}

export const INITIAL_DEMO_ORDERS: SubmittedOrder[] = [
  {
    orderNumber: 'LASS-1234',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    customer: {
      fullName: 'Thabo Mokoena',
      phoneOrWhatsApp: '072 345 6789',
      email: 'thabo@example.co.za',
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
    ],
    subtotal: 280,
    deliveryFee: 60,
    estimatedTotal: 340,
    whatsappMessageText: 'Order #LASS-1234',
    whatsappUrl: 'https://wa.me/27664412203',
    status: 'dispatched_paxi',
    paxiTrackingCode: 'PAXI-JH-883921',
    paymentMethod: 'payfast',
    paymentStatus: 'paid',
    transactionId: 'PF-TEST-9921',
    paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Cloudflare KV Order Store Implementation
 * Uses Cloudflare Workers KV (ORDERS_KV binding) available on free tier without credit card.
 */
export class CloudflareKvOrderStore implements IOrderStore {
  private kv: any;

  constructor(kvNamespace: any) {
    this.kv = kvNamespace;
  }

  private async getIndex(): Promise<string[]> {
    try {
      const raw = await this.kv.get('orders:index', 'json');
      if (Array.isArray(raw)) return raw;
    } catch (e) {
      console.warn('Error fetching orders index from KV:', e);
    }
    return INITIAL_DEMO_ORDERS.map((o) => o.orderNumber);
  }

  private async saveIndex(index: string[]): Promise<void> {
    await this.kv.put('orders:index', JSON.stringify(index));
  }

  public async save(order: SubmittedOrder): Promise<SubmittedOrder> {
    const key = `order:${order.orderNumber}`;
    await this.kv.put(key, JSON.stringify(order));

    const index = await this.getIndex();
    if (!index.includes(order.orderNumber)) {
      index.unshift(order.orderNumber);
      await this.saveIndex(index);
    }
    return order;
  }

  public async get(orderNumber: string): Promise<SubmittedOrder | null> {
    const key = `order:${orderNumber}`;
    const order = await this.kv.get(key, 'json');
    if (order) return order as SubmittedOrder;

    // Check demo initial orders
    const demo = INITIAL_DEMO_ORDERS.find((d) => d.orderNumber === orderNumber);
    return demo || null;
  }

  public async getAll(): Promise<SubmittedOrder[]> {
    const index = await this.getIndex();
    const orders: SubmittedOrder[] = [];

    // Fetch in parallel batches
    const fetchPromises = index.map(async (num) => {
      const order = await this.get(num);
      return order;
    });

    const results = await Promise.all(fetchPromises);
    for (const res of results) {
      if (res) orders.push(res);
    }

    return orders.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  public async updateOrder(order: SubmittedOrder): Promise<SubmittedOrder> {
    const key = `order:${order.orderNumber}`;
    await this.kv.put(key, JSON.stringify(order));
    return order;
  }

  public async recordPaymentResult(
    orderNumber: string,
    result: PaymentRecordResult
  ): Promise<{ order: SubmittedOrder; alreadyProcessed: boolean }> {
    const order = await this.get(orderNumber);
    if (!order) {
      throw new Error(`Order ${orderNumber} not found in KV database`);
    }

    const itnEntry = {
      receivedAt: new Date().toISOString(),
      pfPaymentId: result.pfPaymentId,
      paymentStatus: result.paymentStatus,
      amountGross: result.amountGross.toFixed(2),
      signatureVerified: result.signatureVerified,
      serverValidated: result.serverValidated,
    };

    if (!order.itnHistory) {
      order.itnHistory = [];
    }
    order.itnHistory.push(itnEntry);

    // Idempotency check: If already paid, do not duplicate actions
    if (order.paymentStatus === 'paid' && result.paymentStatus === 'COMPLETE') {
      await this.updateOrder(order);
      return { order, alreadyProcessed: true };
    }

    if (result.paymentStatus === 'COMPLETE') {
      order.paymentStatus = 'paid';
      order.status = 'payment_confirmed';
      order.paymentMethod = 'payfast';
      order.transactionId = result.pfPaymentId;
      order.paidAt = new Date().toISOString();
      if (!order.paxiTrackingCode && order.customer.deliveryMethod.startsWith('paxi')) {
        const rand = Math.floor(100000 + Math.random() * 900000);
        order.paxiTrackingCode = `PAXI-ZA-${rand}`;
      }
      order.statusNotes = `PayFast Payment Confirmed (Ref: ${result.pfPaymentId}). Gross: R${result.amountGross.toFixed(
        2
      )}. Ready for PEP store packaging.`;
      order.payfastData = result.rawItn;
    } else if (result.paymentStatus === 'CANCELLED') {
      order.paymentStatus = 'cancelled';
      order.status = 'cancelled';
      order.statusNotes = `Payment cancelled by customer on PayFast.`;
    } else {
      order.paymentStatus = 'failed';
      order.statusNotes = `PayFast payment unsuccessful (${result.paymentStatus}).`;
    }

    await this.updateOrder(order);
    return { order, alreadyProcessed: false };
  }
}

/**
 * Node.js Filesystem Order Store Implementation
 * Used for local development & preview in AI Studio.
 */
export class NodeFileOrderStore implements IOrderStore {
  private orders: Map<string, SubmittedOrder> = new Map();
  private dataDir: string;
  private ordersFile: string;
  private initialized: boolean = false;

  constructor() {
    this.dataDir = '';
    this.ordersFile = '';
    this.init();
  }

  private async init() {
    try {
      // Dynamic import to avoid bundling 'fs' in edge environments
      const fs = await import('node:fs');
      const path = await import('node:path');
      this.dataDir = path.resolve(process.cwd(), 'data');
      this.ordersFile = path.resolve(this.dataDir, 'orders.json');

      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.ordersFile)) {
        const raw = fs.readFileSync(this.ordersFile, 'utf-8');
        const list: SubmittedOrder[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((order) => this.orders.set(order.orderNumber, order));
        }
      } else {
        INITIAL_DEMO_ORDERS.forEach((o) => this.orders.set(o.orderNumber, o));
        this.persist();
      }
      this.initialized = true;
    } catch {
      INITIAL_DEMO_ORDERS.forEach((o) => this.orders.set(o.orderNumber, o));
    }
  }

  private async persist() {
    try {
      const fs = await import('node:fs');
      if (this.dataDir && !fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (this.ordersFile) {
        const data = Array.from(this.orders.values());
        fs.writeFileSync(this.ordersFile, JSON.stringify(data, null, 2), 'utf-8');
      }
    } catch {}
  }

  public async save(order: SubmittedOrder): Promise<SubmittedOrder> {
    this.orders.set(order.orderNumber, order);
    await this.persist();
    return order;
  }

  public async get(orderNumber: string): Promise<SubmittedOrder | null> {
    return this.orders.get(orderNumber) || null;
  }

  public async getAll(): Promise<SubmittedOrder[]> {
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  public async recordPaymentResult(
    orderNumber: string,
    result: PaymentRecordResult
  ): Promise<{ order: SubmittedOrder; alreadyProcessed: boolean }> {
    const order = this.orders.get(orderNumber);
    if (!order) {
      throw new Error(`Order ${orderNumber} not found in database`);
    }

    const itnEntry = {
      receivedAt: new Date().toISOString(),
      pfPaymentId: result.pfPaymentId,
      paymentStatus: result.paymentStatus,
      amountGross: result.amountGross.toFixed(2),
      signatureVerified: result.signatureVerified,
      serverValidated: result.serverValidated,
    };

    if (!order.itnHistory) {
      order.itnHistory = [];
    }
    order.itnHistory.push(itnEntry);

    if (order.paymentStatus === 'paid' && result.paymentStatus === 'COMPLETE') {
      await this.persist();
      return { order, alreadyProcessed: true };
    }

    if (result.paymentStatus === 'COMPLETE') {
      order.paymentStatus = 'paid';
      order.status = 'payment_confirmed';
      order.paymentMethod = 'payfast';
      order.transactionId = result.pfPaymentId;
      order.paidAt = new Date().toISOString();
      if (!order.paxiTrackingCode && order.customer.deliveryMethod.startsWith('paxi')) {
        const rand = Math.floor(100000 + Math.random() * 900000);
        order.paxiTrackingCode = `PAXI-ZA-${rand}`;
      }
      order.statusNotes = `PayFast Payment Confirmed (Ref: ${result.pfPaymentId}). Gross: R${result.amountGross.toFixed(
        2
      )}. Ready for PEP store packaging.`;
      order.payfastData = result.rawItn;
    } else if (result.paymentStatus === 'CANCELLED') {
      order.paymentStatus = 'cancelled';
      order.status = 'cancelled';
      order.statusNotes = `Payment cancelled by customer on PayFast.`;
    } else {
      order.paymentStatus = 'failed';
      order.statusNotes = `PayFast payment unsuccessful (${result.paymentStatus}).`;
    }

    await this.save(order);
    return { order, alreadyProcessed: false };
  }
}

/**
 * In-Memory Order Store Implementation for Edge / Workers fallback
 * Used when running on Cloudflare Workers before ORDERS_KV is bound, or during edge testing.
 */
export class EdgeMemoryOrderStore implements IOrderStore {
  private orders: Map<string, SubmittedOrder> = new Map();

  constructor() {
    INITIAL_DEMO_ORDERS.forEach((o) => this.orders.set(o.orderNumber, o));
  }

  public async save(order: SubmittedOrder): Promise<SubmittedOrder> {
    this.orders.set(order.orderNumber, order);
    return order;
  }

  public async get(orderNumber: string): Promise<SubmittedOrder | null> {
    return this.orders.get(orderNumber) || null;
  }

  public async getAll(): Promise<SubmittedOrder[]> {
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  public async recordPaymentResult(
    orderNumber: string,
    result: PaymentRecordResult
  ): Promise<{ order: SubmittedOrder; alreadyProcessed: boolean }> {
    const order = this.orders.get(orderNumber);
    if (!order) {
      throw new Error(`Order ${orderNumber} not found in database`);
    }

    const itnEntry = {
      receivedAt: new Date().toISOString(),
      pfPaymentId: result.pfPaymentId,
      paymentStatus: result.paymentStatus,
      amountGross: result.amountGross.toFixed(2),
      signatureVerified: result.signatureVerified,
      serverValidated: result.serverValidated,
    };

    if (!order.itnHistory) {
      order.itnHistory = [];
    }
    order.itnHistory.push(itnEntry);

    if (order.paymentStatus === 'paid' && result.paymentStatus === 'COMPLETE') {
      return { order, alreadyProcessed: true };
    }

    if (result.paymentStatus === 'COMPLETE') {
      order.paymentStatus = 'paid';
      order.status = 'payment_confirmed';
      order.paymentMethod = 'payfast';
      order.transactionId = result.pfPaymentId;
      order.paidAt = new Date().toISOString();
      if (!order.paxiTrackingCode && order.customer.deliveryMethod.startsWith('paxi')) {
        const rand = Math.floor(100000 + Math.random() * 900000);
        order.paxiTrackingCode = `PAXI-ZA-${rand}`;
      }
      order.statusNotes = `PayFast Payment Confirmed (Ref: ${result.pfPaymentId}). Gross: R${result.amountGross.toFixed(
        2
      )}. Ready for PEP store packaging.`;
      order.payfastData = result.rawItn;
    } else if (result.paymentStatus === 'CANCELLED') {
      order.paymentStatus = 'cancelled';
      order.status = 'cancelled';
      order.statusNotes = `Payment cancelled by customer on PayFast.`;
    } else {
      order.paymentStatus = 'failed';
      order.statusNotes = `PayFast payment unsuccessful (${result.paymentStatus}).`;
    }

    await this.save(order);
    return { order, alreadyProcessed: false };
  }
}

// Single node instance for server.ts
const defaultNodeStore = new NodeFileOrderStore();
const edgeMemoryStore = new EdgeMemoryOrderStore();

/**
 * Factory to retrieve the active order store.
 * In Cloudflare Workers, automatically uses ORDERS_KV binding.
 * If ORDERS_KV is not provided in worker runtime, falls back to EdgeMemoryOrderStore.
 * In Node.js / Express local development, uses the filesystem store.
 */
export function getOrderStore(env?: any): IOrderStore {
  if (env && env.ORDERS_KV) {
    return new CloudflareKvOrderStore(env.ORDERS_KV);
  }
  if (typeof process !== 'undefined' && process.versions?.node && typeof window === 'undefined') {
    // Check if running in Node.js server
    try {
      return defaultNodeStore;
    } catch {
      return edgeMemoryStore;
    }
  }
  return edgeMemoryStore;
}

export const orderStore = defaultNodeStore;

