import {
  getPayFastConfig,
  createHostedCheckoutPayload,
  verifyPayFastITN,
  generatePayFastSignature,
  PayFastEnv,
} from '../server/payfast.js';
import { getOrderStore, SubmittedOrder } from '../server/orderStore.js';

export interface Env extends PayFastEnv {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  ORDERS_KV?: any;
  ALLOW_SANDBOX_SIMULATION?: string;
}

function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...headers,
    },
  });
}

function textResponse(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export default {
  async fetch(request: Request, env: Env, _ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const effectiveEnv: Env = {
      ...env,
      APP_URL: env.APP_URL || url.origin,
    };

    const orderStore = getOrderStore(effectiveEnv);

    // 1. GET or HEAD /api/health
    if (pathname === '/api/health' && (method === 'GET' || method === 'HEAD')) {
      const config = getPayFastConfig(effectiveEnv);
      const passphraseConfigured = Boolean(
        env.PAYFAST_PASSPHRASE &&
        (typeof env.PAYFAST_PASSPHRASE === 'string' ? env.PAYFAST_PASSPHRASE.trim().length > 0 : Boolean(env.PAYFAST_PASSPHRASE))
      );
      return jsonResponse(
        {
          status: 'ok',
          platform: 'Cloudflare Workers',
          environment: config.isSandbox ? 'sandbox' : 'production',
          merchantIdConfigured: Boolean(config.merchantId),
          passphraseConfigured,
          kvStorageActive: Boolean(effectiveEnv.ORDERS_KV),
          timestamp: new Date().toISOString(),
        },
        200,
        {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      );
    }

    // 2. POST /api/payfast/create-checkout
    if (pathname === '/api/payfast/create-checkout' && method === 'POST') {
      try {
        const body: any = await request.json();
        const { customer, items, customOrderRef } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
          return jsonResponse(
            { success: false, error: 'Your shopping bag is empty. Please add items before checking out.' },
            400
          );
        }

        if (!customer) {
          return jsonResponse({ success: false, error: 'Customer details are required.' }, 400);
        }

        const fullName = String(customer.fullName || '').trim();
        const phoneOrWhatsApp = String(customer.phoneOrWhatsApp || '').trim();
        const email = String(customer.email || '').trim();
        const deliveryMethod = customer.deliveryMethod || 'paxi-standard';
        const pepStoreBranch = String(customer.pepStoreBranch || '').trim();
        const deliveryAddress = String(customer.deliveryAddress || '').trim();
        const customerNote = String(customer.customerNote || '').trim();

        if (!fullName || fullName.length < 2) {
          return jsonResponse({ success: false, error: 'Please enter your full name.' }, 400);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          return jsonResponse(
            { success: false, error: 'Please enter a valid email address (required for PayFast payment receipt).' },
            400
          );
        }

        const cleanPhone = phoneOrWhatsApp.replace(/\s+/g, '');
        if (!cleanPhone || cleanPhone.length < 10) {
          return jsonResponse(
            { success: false, error: 'Please provide a valid 10-digit South African mobile or WhatsApp number.' },
            400
          );
        }

        if (deliveryMethod.startsWith('paxi') && !pepStoreBranch) {
          return jsonResponse(
            { success: false, error: 'Please specify your nearest PEP Store branch or PAXI point for collection.' },
            400
          );
        }

        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || 'Customer';

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

        let deliveryFee = 60;
        if (deliveryMethod === 'paxi-express') {
          deliveryFee = 100;
        } else if (deliveryMethod === 'collection') {
          deliveryFee = 0;
        }

        if (subtotal >= 800 && deliveryMethod.startsWith('paxi')) {
          deliveryFee = 0;
        }

        const estimatedTotal = subtotal + deliveryFee;

        const orderNumber =
          customOrderRef && /^LASS-\d{4}$/.test(customOrderRef)
            ? customOrderRef
            : `LASS-${Math.floor(1000 + Math.random() * 9000)}`;

        const itemsSummary = validatedItems
          .map((i: any) => `${i.quantity}x ${i.name} (${i.selectedSize})`)
          .join(', ');

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
          whatsappMessageText: `Order #${orderNumber} (${itemsSummary}) - Total: R${estimatedTotal.toFixed(2)}`,
          whatsappUrl: `https://wa.me/27664412203?text=${encodeURIComponent(
            `Hi LASS, I just created order #${orderNumber} for R${estimatedTotal.toFixed(2)}`
          )}`,
          status: 'pending_payment',
          paymentStatus: 'pending',
          paymentMethod: 'payfast',
          statusNotes: `Awaiting PayFast payment confirmation for ${orderNumber} (ZAR ${estimatedTotal.toFixed(2)}).`,
        };

        await orderStore.save(newOrder);

        const payfastData = createHostedCheckoutPayload(
          {
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
          },
          effectiveEnv
        );

        return jsonResponse({
          success: true,
          orderNumber,
          order: newOrder,
          payfastUrl: payfastData.processUrl,
          payfastData: payfastData.payload,
          isSandbox: payfastData.isSandbox,
        });
      } catch (err: any) {
        console.error('Error creating checkout in worker:', err);
        return jsonResponse({ success: false, error: err.message || 'Error creating checkout session' }, 500);
      }
    }

    // 3. POST /api/payfast/notify (PayFast ITN Webhook)
    if (pathname === '/api/payfast/notify' && method === 'POST') {
      try {
        const rawBody = await request.text();
        const searchParams = new URLSearchParams(rawBody);
        const itnData: Record<string, string> = {};
        for (const [k, v] of searchParams.entries()) {
          itnData[k] = v;
        }

        console.log('[Worker PayFast ITN Received]:', {
          m_payment_id: itnData.m_payment_id,
          pf_payment_id: itnData.pf_payment_id,
          payment_status: itnData.payment_status,
          amount_gross: itnData.amount_gross,
        });

        const orderNumber = itnData.m_payment_id;
        if (!orderNumber) {
          return textResponse('Missing m_payment_id', 400);
        }

        const order = await orderStore.get(orderNumber);
        if (!order) {
          return textResponse('Order not found', 400);
        }

        const verification = await verifyPayFastITN(itnData, rawBody, effectiveEnv);
        if (!verification.isValid) {
          return textResponse('Signature mismatch', 400);
        }

        const amountGross = parseFloat(itnData.amount_gross || '0');
        if (Math.abs(amountGross - order.estimatedTotal) > 0.05) {
          return textResponse('Amount mismatch', 400);
        }

        const paymentStatus =
          itnData.payment_status === 'COMPLETE'
            ? 'COMPLETE'
            : itnData.payment_status === 'CANCELLED'
            ? 'CANCELLED'
            : 'FAILED';

        await orderStore.recordPaymentResult(orderNumber, {
          pfPaymentId: itnData.pf_payment_id || `PF-UNKNOWN-${Date.now()}`,
          paymentStatus,
          amountGross,
          signatureVerified: verification.signatureMatches,
          serverValidated: verification.serverConfirmed,
          rawItn: itnData,
        });

        return textResponse('ITN Processed Successfully', 200);
      } catch (err: any) {
        console.error('Error processing ITN in worker:', err);
        return textResponse('Internal Server Error processing ITN', 500);
      }
    }

    // 4. GET /api/payfast/order-status/:orderId
    if (pathname.startsWith('/api/payfast/order-status/') && method === 'GET') {
      const orderId = decodeURIComponent(pathname.replace('/api/payfast/order-status/', ''));
      const order = await orderStore.get(orderId);
      if (!order) {
        return jsonResponse({ success: false, error: `Order ${orderId} not found.` }, 404);
      }

      return jsonResponse({
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
    }

    // 5. GET /api/orders
    if (pathname === '/api/orders' && method === 'GET') {
      const orders = await orderStore.getAll();
      return jsonResponse({ success: true, orders });
    }

    // 6. GET /api/orders/:orderId
    if (pathname.startsWith('/api/orders/') && method === 'GET') {
      const orderId = decodeURIComponent(pathname.replace('/api/orders/', ''));
      const order = await orderStore.get(orderId);
      if (!order) {
        return jsonResponse({ success: false, error: 'Order not found' }, 404);
      }
      return jsonResponse({ success: true, order });
    }

    // 7. POST /api/payfast/simulate-sandbox-itn
    // Strictly disabled in production
    if (pathname === '/api/payfast/simulate-sandbox-itn' && method === 'POST') {
      const config = getPayFastConfig(effectiveEnv);
      if (!config.isSandbox || effectiveEnv.ALLOW_SANDBOX_SIMULATION !== 'true') {
        return jsonResponse(
          {
            success: false,
            error: 'Sandbox ITN simulation is disabled in production. Payments require genuine PayFast cryptographic verification.',
          },
          403
        );
      }

      try {
        const body: any = await request.json();
        const { orderNumber } = body;
        if (!orderNumber) {
          return jsonResponse({ success: false, error: 'orderNumber is required' }, 400);
        }

        const order = await orderStore.get(orderNumber);
        if (!order) {
          return jsonResponse({ success: false, error: 'Order not found' }, 404);
        }

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

        itnPayload.signature = generatePayFastSignature(itnPayload, config.passphrase);

        const { order: updatedOrder, alreadyProcessed } = await orderStore.recordPaymentResult(
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

        return jsonResponse({
          success: true,
          message: 'Sandbox ITN processed and order marked paid.',
          alreadyProcessed,
          order: updatedOrder,
        });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err.message }, 500);
      }
    }

    // 8. Static Assets Serving via Cloudflare Workers Assets binding (with SPA fallback)
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status === 404 && request.method === 'GET' && !pathname.startsWith('/api/')) {
        // Fallback to index.html for client-side React SPA routes (e.g., /payment/return, /payment/cancel)
        const spaRequest = new Request(new URL('/index.html', request.url), request);
        return await env.ASSETS.fetch(spaRequest);
      }
      return assetResponse;
    }

    return new Response('Not Found', { status: 404 });
  },
};
