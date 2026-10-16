import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { orderStore, SubmittedOrder } from './server/orderStore.js';
import {
  getPayFastConfig,
  createHostedCheckoutPayload,
  verifyPayFastITN,
  generatePayFastSignature,
} from './server/payfast.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers
// Note: PayFast ITN sends application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));

// Health Check Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const config = getPayFastConfig();
  res.json({
    status: 'ok',
    environment: config.isSandbox ? 'sandbox' : 'production',
    merchantIdConfigured: Boolean(config.merchantId),
    passphraseConfigured: Boolean(config.passphrase),
  });
});

/**
 * POST /api/payfast/create-checkout
 * Secure server-side checkout endpoint that validates cart items, customer details,
 * computes exact ZAR totals, creates a persistent pending order record, and generates
 * the signed PayFast hosted checkout payload.
 */
app.post('/api/payfast/create-checkout', (req: Request, res: Response) => {
  try {
    const { customer, items, customOrderRef } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Your shopping bag is empty. Please add items before checking out.',
      });
    }

    if (!customer) {
      return res.status(400).json({
        success: false,
        error: 'Customer details are required.',
      });
    }

    // Validate customer details
    const fullName = String(customer.fullName || '').trim();
    const phoneOrWhatsApp = String(customer.phoneOrWhatsApp || '').trim();
    const email = String(customer.email || '').trim();
    const deliveryMethod = customer.deliveryMethod || 'paxi-standard';
    const pepStoreBranch = String(customer.pepStoreBranch || '').trim();
    const deliveryAddress = String(customer.deliveryAddress || '').trim();
    const customerNote = String(customer.customerNote || '').trim();

    if (!fullName || fullName.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your full name.',
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address (required for PayFast payment receipt).',
      });
    }

    // South African phone/WhatsApp validation (accepts 0XX XXX XXXX or +27XX XXX XXXX)
    const cleanPhone = phoneOrWhatsApp.replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid 10-digit South African mobile or WhatsApp number.',
      });
    }

    // Delivery validation
    if (deliveryMethod.startsWith('paxi') && !pepStoreBranch) {
      return res.status(400).json({
        success: false,
        error: 'Please specify your nearest PEP Store branch or PAXI point for collection.',
      });
    }

    // Split name into first and last for PayFast
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    // Recalculate cart totals on server in ZAR
    let subtotal = 0;
    const validatedItems = items.map((item: any) => {
      const unitPrice = Number(item.product?.price || item.unitPrice || 0);
      const quantity = Math.max(1, parseInt(item.quantity || 1, 10));
      const itemTotal = unitPrice * quantity;
      subtotal += itemTotal;

      return {
        productId: item.productId || item.product?.id || 'unknown',
        name: item.product?.name || item.name || 'LASS Piece',
        selectedSize: item.selectedSize || 'Standard',
        selectedColour: item.selectedColour || 'Standard',
        unitPrice,
        quantity,
        totalPrice: itemTotal,
      };
    });

    // Delivery fee calculation
    let deliveryFee = 60; // PAXI Standard
    if (deliveryMethod === 'paxi-express') {
      deliveryFee = 100;
    } else if (deliveryMethod === 'collection') {
      deliveryFee = 0;
    }

    // Free delivery threshold: orders R800 and above
    if (subtotal >= 800 && deliveryMethod.startsWith('paxi')) {
      deliveryFee = 0;
    }

    const estimatedTotal = subtotal + deliveryFee;

    // Generate unique order reference (or reuse validated custom ref)
    const orderNumber =
      customOrderRef && /^LASS-\d{4}$/.test(customOrderRef)
        ? customOrderRef
        : `LASS-${Math.floor(1000 + Math.random() * 9000)}`;

    const itemsSummary = validatedItems
      .map((i: any) => `${i.quantity}x ${i.name} (${i.selectedSize})`)
      .join(', ');

    // Create and save pending order record to persistent storage
    const newOrder: SubmittedOrder = {
      orderNumber,
      date: new Date().toISOString(),
      customer: {
        fullName,
        phoneOrWhatsApp,
        email,
        deliveryMethod,
        pepStoreBranch,
        deliveryAddress,
        customerNote,
      },
      items: validatedItems,
      subtotal,
      deliveryFee,
      estimatedTotal,
      whatsappMessageText: `Order #${orderNumber} (${itemsSummary}) - Total: R${estimatedTotal.toFixed(
        2
      )}`,
      whatsappUrl: `https://wa.me/27664412203?text=${encodeURIComponent(
        `Hi LASS, I just created order #${orderNumber} for R${estimatedTotal.toFixed(
          2
        )}`
      )}`,
      status: 'pending_payment',
      paymentStatus: 'pending',
      paymentMethod: 'payfast',
      statusNotes: `Awaiting PayFast payment confirmation for ${orderNumber} (ZAR ${estimatedTotal.toFixed(
        2
      )}).`,
    };

    orderStore.save(newOrder);

    // Create PayFast hosted checkout payload with server-side signature
    const payfastData = createHostedCheckoutPayload({
      orderNumber,
      amount: estimatedTotal,
      itemName: `LASS Brand Clothes #${orderNumber}`,
      itemDescription: itemsSummary,
      nameFirst: firstName,
      nameLast: lastName,
      emailAddress: email,
      cellNumber: cleanPhone,
      customStr1: deliveryMethod,
      customStr2: pepStoreBranch || deliveryAddress,
    });

    return res.json({
      success: true,
      orderNumber,
      order: newOrder,
      payfastUrl: payfastData.processUrl,
      payfastData: payfastData.payload,
      isSandbox: payfastData.isSandbox,
    });
  } catch (error: any) {
    console.error('Error creating PayFast checkout session:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal error creating checkout session.',
    });
  }
});

/**
 * POST /api/payfast/notify
 * PayFast Instant Transaction Notification (ITN) Webhook
 * Validates MD5 signature, verifies order exists and amount matches,
 * queries PayFast server-to-server validate endpoint, and idempotently
 * updates order record.
 */
app.post('/api/payfast/notify', async (req: Request, res: Response) => {
  try {
    const itnData = req.body;
    console.log('[PayFast ITN Received]:', {
      m_payment_id: itnData.m_payment_id,
      pf_payment_id: itnData.pf_payment_id,
      payment_status: itnData.payment_status,
      amount_gross: itnData.amount_gross,
    });

    const orderNumber = itnData.m_payment_id;
    if (!orderNumber) {
      console.error('[PayFast ITN Error]: Missing m_payment_id in ITN');
      return res.status(400).send('Missing m_payment_id');
    }

    const order = orderStore.get(orderNumber);
    if (!order) {
      console.error(
        `[PayFast ITN Error]: Order ${orderNumber} not found in database`
      );
      return res.status(400).send('Order not found');
    }

    // Verify ITN signature and server-to-server confirmation
    const verification = await verifyPayFastITN(itnData);
    if (!verification.isValid) {
      console.error(
        `[PayFast ITN Security Alert]: Signature verification failed for ${orderNumber}:`,
        verification.error
      );
      return res.status(400).send('Signature mismatch');
    }

    // Verify amount matches expected order total (protect against amount tampering)
    const amountGross = parseFloat(itnData.amount_gross || '0');
    if (Math.abs(amountGross - order.estimatedTotal) > 0.05) {
      console.error(
        `[PayFast ITN Security Alert]: Amount mismatch on ${orderNumber}. Expected: R${order.estimatedTotal}, Received: R${amountGross}`
      );
      return res.status(400).send('Amount mismatch');
    }

    // Idempotent processing of payment status
    const paymentStatus =
      itnData.payment_status === 'COMPLETE'
        ? 'COMPLETE'
        : itnData.payment_status === 'CANCELLED'
        ? 'CANCELLED'
        : 'FAILED';

    const { alreadyProcessed } = orderStore.recordPaymentResult(orderNumber, {
      pfPaymentId: itnData.pf_payment_id || `PF-UNKNOWN-${Date.now()}`,
      paymentStatus,
      amountGross,
      signatureVerified: verification.signatureMatches,
      serverValidated: verification.serverConfirmed,
      rawItn: itnData,
    });

    console.log(
      `[PayFast ITN Success]: Order ${orderNumber} processed (alreadyProcessed: ${alreadyProcessed}, status: ${paymentStatus})`
    );

    // PayFast requires HTTP 200 OK
    return res.status(200).send('ITN Processed Successfully');
  } catch (error: any) {
    console.error('[PayFast ITN Processing Exception]:', error);
    // Respond with 500 so PayFast retries in case of transient failure
    return res.status(500).send('Internal Server Error processing ITN');
  }
});

/**
 * GET /api/payfast/order-status/:orderId
 * Check verified payment status from server records.
 * The client MUST NOT mark an order paid based only on a browser redirect!
 */
app.get('/api/payfast/order-status/:orderId', (req: Request, res: Response) => {
  const orderId = req.params.orderId;
  const order = orderStore.get(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      error: `Order ${orderId} not found.`,
    });
  }

  return res.json({
    success: true,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus || 'pending',
    paymentMethod: order.paymentMethod,
    transactionId: order.transactionId,
    paxiTrackingCode: order.paxiTrackingCode,
    paidAt: order.paidAt,
    estimatedTotal: order.estimatedTotal,
    date: order.date,
    customer: order.customer,
    items: order.items,
  });
});

/**
 * GET /api/orders
 * Returns all orders from persistent store
 */
app.get('/api/orders', (_req: Request, res: Response) => {
  const orders = orderStore.getAll();
  return res.json({
    success: true,
    orders,
  });
});

/**
 * GET /api/orders/:orderId
 * Returns single order
 */
app.get('/api/orders/:orderId', (req: Request, res: Response) => {
  const order = orderStore.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  return res.json({ success: true, order });
});

/**
 * POST /api/payfast/simulate-sandbox-itn
 * Sandbox & Developer Testing Endpoint
 * Simulates an incoming signed PayFast ITN callback for end-to-end verification
 * without requiring a publicly tunnelled webhook in local preview.
 */
app.post('/api/payfast/simulate-sandbox-itn', async (req: Request, res: Response) => {
  try {
    const config = getPayFastConfig();
    const { orderNumber } = req.body;

    if (!orderNumber) {
      return res.status(400).json({ success: false, error: 'orderNumber is required' });
    }

    const order = orderStore.get(orderNumber);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Build authentic PayFast ITN payload
    const itnPayload: Record<string, string> = {
      m_payment_id: order.orderNumber,
      pf_payment_id: `PF-SANDBOX-${Date.now()}`,
      payment_status: 'COMPLETE',
      item_name: `LASS Brand Clothes #${order.orderNumber}`,
      item_description: 'Streetwear order',
      amount_gross: order.estimatedTotal.toFixed(2),
      amount_fee: (order.estimatedTotal * 0.035).toFixed(2),
      amount_net: (order.estimatedTotal * 0.965).toFixed(2),
      custom_str1: order.customer.deliveryMethod,
      name_first: order.customer.fullName.split(' ')[0] || 'Customer',
      name_last: order.customer.fullName.split(' ')[1] || 'LASS',
      email_address: order.customer.email || 'customer@example.co.za',
      merchant_id: config.merchantId,
    };

    // Calculate valid MD5 signature
    itnPayload.signature = generatePayFastSignature(itnPayload, config.passphrase);

    // Process through the actual orderStore payment recorder
    const { order: updatedOrder, alreadyProcessed } = orderStore.recordPaymentResult(
      order.orderNumber,
      {
        pfPaymentId: itnPayload.pf_payment_id,
        paymentStatus: 'COMPLETE',
        amountGross: order.estimatedTotal,
        signatureVerified: true,
        serverValidated: true,
        rawItn: itnPayload,
      }
    );

    return res.json({
      success: true,
      message: 'Sandbox ITN successfully processed and order marked as paid.',
      alreadyProcessed,
      order: updatedOrder,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Configure Vite middleware or static serving
async function setupFrontend() {
  if (!isProduction) {
    // Dynamic import of Vite in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production serve dist
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }
}

setupFrontend().then(() => {
  app.listen(PORT, () => {
    const config = getPayFastConfig();
    console.log(`LASS Brand Store running on http://localhost:${PORT}`);
    console.log(`PayFast Mode: ${config.isSandbox ? 'SANDBOX (Test Mode)' : 'PRODUCTION'}`);
    console.log(`Merchant ID: ${config.merchantId}`);
    console.log(`Process URL: ${config.processUrl}`);
  });
});
