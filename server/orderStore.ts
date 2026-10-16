import fs from 'fs';
import path from 'path';

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

const DATA_DIR = path.resolve(process.cwd(), 'data');
const ORDERS_FILE = path.resolve(DATA_DIR, 'orders.json');

class OrderStore {
  private orders: Map<string, SubmittedOrder> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(ORDERS_FILE)) {
        const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
        const list: SubmittedOrder[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((order) => this.orders.set(order.orderNumber, order));
        }
      } else {
        // Initialize with default demo orders
        const demoOrders: SubmittedOrder[] = [
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
        demoOrders.forEach((o) => this.orders.set(o.orderNumber, o));
        this.persist();
      }
      this.initialized = true;
    } catch (err) {
      console.error('Failed to initialize order store:', err);
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = Array.from(this.orders.values());
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist orders file:', err);
    }
  }

  public save(order: SubmittedOrder): SubmittedOrder {
    this.orders.set(order.orderNumber, order);
    this.persist();
    return order;
  }

  public get(orderNumber: string): SubmittedOrder | null {
    return this.orders.get(orderNumber) || null;
  }

  public getAll(): SubmittedOrder[] {
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  /**
   * Idempotent payment recording:
   * If already marked paid, ignores duplicate events while recording audit trail.
   */
  public recordPaymentResult(
    orderNumber: string,
    result: {
      pfPaymentId: string;
      paymentStatus: 'COMPLETE' | 'FAILED' | 'CANCELLED';
      amountGross: number;
      signatureVerified: boolean;
      serverValidated: boolean;
      rawItn: Record<string, any>;
    }
  ): { order: SubmittedOrder; alreadyProcessed: boolean } {
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

    // Idempotency check: If already confirmed as paid, don't duplicate state mutations
    if (order.paymentStatus === 'paid' && result.paymentStatus === 'COMPLETE') {
      this.persist();
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

    this.save(order);
    return { order, alreadyProcessed: false };
  }
}

export const orderStore = new OrderStore();
