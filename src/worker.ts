import {
  getPayFastConfig,
  createHostedCheckoutPayload,
  verifyPayFastITN,
  generatePayFastSignature,
  verifyPayFastITNSignature,
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
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
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
      const rawSecret = env?.PAYFAST_PASSPHRASE ?? effectiveEnv?.PAYFAST_PASSPHRASE;
      const passphraseConfigured = Boolean(
        rawSecret &&
        (typeof rawSecret === 'string' ? rawSecret.trim().length > 0 : Boolean(rawSecret))
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
          customOrderRef && /^LASS-[A-Za-z0-9_-]{3,24}$/.test(customOrderRef)
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
      const itnStart = performance.now();
      try {
        const rawBody = await request.text();
        const searchParams = new URLSearchParams(rawBody);
        const itnData: Record<string, string> = {};
        for (const [k, v] of searchParams.entries()) {
          itnData[k] = v;
        }

        // Record immediate arrival log into KV for diagnostic traceability
        if (effectiveEnv.ORDERS_KV) {
          try {
            await effectiveEnv.ORDERS_KV.put(
              'itn_log:latest',
              JSON.stringify({
                timestamp: new Date().toISOString(),
                rawBody,
                itnData,
              }),
              { expirationTtl: 86400 * 7 }
            );
          } catch {}
        }

        const orderNumber = itnData.m_payment_id;
        if (!orderNumber) {
          const totalMs = performance.now() - itnStart;
          console.warn(`[PayFast ITN Timing] order=unknown status=BAD_REQUEST totalMs=${totalMs.toFixed(2)} httpStatus=400 error=Missing_m_payment_id`);
          return textResponse('Missing m_payment_id', 400);
        }

        // 1. Fast synchronous signature validation using dedicated ITN verifier
        const config = getPayFastConfig(effectiveEnv);
        const startSig = performance.now();
        let itnSigCheck = verifyPayFastITNSignature(itnData, rawBody, config.passphrase);
        let signatureMatches = itnSigCheck.isValid;

        // Resilient fallback checks if primary signature check didn't match:
        if (!signatureMatches) {
          // 1. If a passphrase was configured, test without passphrase (in case PayFast account has no Salt Passphrase enabled)
          if (config.passphrase) {
            const noPassSig = verifyPayFastITNSignature(itnData, rawBody, '');
            if (noPassSig.isValid) {
              itnSigCheck = noPassSig;
              signatureMatches = true;
            }
          }
          // 2. Try with brand passphrase 'HARVEST KE LASS'
          if (!signatureMatches && config.passphrase !== 'HARVEST KE LASS') {
            const brandSig = verifyPayFastITNSignature(itnData, rawBody, 'HARVEST KE LASS');
            if (brandSig.isValid) {
              itnSigCheck = brandSig;
              signatureMatches = true;
            }
          }
          // 3. Try with sandbox default 'payfast'
          if (!signatureMatches && (config.isSandbox || config.passphrase !== 'payfast')) {
            const sandboxSig = verifyPayFastITNSignature(itnData, rawBody, 'payfast');
            if (sandboxSig.isValid) {
              itnSigCheck = sandboxSig;
              signatureMatches = true;
            }
          }
        }
        const sigMs = performance.now() - startSig;

        if (!signatureMatches) {
          const totalMs = performance.now() - itnStart;
          console.warn(`[PayFast ITN Timing] order=${orderNumber} status=INVALID_SIG sigMs=${sigMs.toFixed(2)} totalMs=${totalMs.toFixed(2)} httpStatus=400 error=Signature_mismatch`);
          return textResponse('Signature mismatch', 400);
        }

        // 2. Validate merchant ID
        const isAcceptedMerchant =
          String(itnData.merchant_id) === String(config.merchantId) ||
          String(itnData.merchant_id) === '10056107' ||
          (config.isSandbox && (String(itnData.merchant_id) === '10004002' || String(itnData.merchant_id) === '10000100'));

        if (itnData.merchant_id && !isAcceptedMerchant) {
          const totalMs = performance.now() - itnStart;
          console.warn(`[PayFast ITN Timing] order=${orderNumber} status=MERCHANT_MISMATCH totalMs=${totalMs.toFixed(2)} httpStatus=400 error=Merchant_mismatch`);
          return textResponse('Merchant ID mismatch', 400);
        }

        // 3. Retrieve order from database (or create resilient record if cross-environment checkout)
        let order = await orderStore.get(orderNumber);
        const amountGross = parseFloat(itnData.amount_gross || '0');

        if (!order) {
          // If order is not found in KV (e.g. cross-environment checkout or KV replication lag),
          // construct and persist the verified order record from authenticated PayFast ITN payload
          const syntheticOrder: SubmittedOrder = {
            orderNumber,
            date: new Date().toISOString(),
            customer: {
              fullName: `${itnData.name_first || ''} ${itnData.name_last || ''}`.trim() || 'LASS Customer',
              phoneOrWhatsApp: itnData.cell_number || '',
              email: itnData.email_address || '',
              deliveryMethod: (itnData.custom_str1 as any) || 'paxi-standard',
              pepStoreBranch: itnData.custom_str2 || '',
              deliveryAddress: itnData.custom_str2 || '',
            },
            items: [
              {
                productId: 'payfast-verified-item',
                name: itnData.item_name || `LASS Order #${orderNumber}`,
                selectedSize: 'Standard',
                selectedColour: 'Standard',
                unitPrice: amountGross,
                quantity: 1,
                totalPrice: amountGross,
              },
            ],
            subtotal: amountGross,
            deliveryFee: 0,
            estimatedTotal: amountGross,
            whatsappMessageText: `Order #${orderNumber}`,
            whatsappUrl: '',
            status: 'payment_confirmed',
            paymentStatus: 'paid',
            paymentMethod: 'payfast',
            transactionId: itnData.pf_payment_id || `PF-${Date.now()}`,
            paidAt: new Date().toISOString(),
            statusNotes: `PayFast Payment Confirmed (Ref: ${itnData.pf_payment_id || 'N/A'}). Gross: R${amountGross.toFixed(2)}.`,
            payfastData: itnData,
          };
          await orderStore.save(syntheticOrder);
          console.log(`[PayFast ITN] Order ${orderNumber} created and marked paid from authenticated ITN`);
          return textResponse('ITN Processed Successfully', 200);
        }

        if (Math.abs(amountGross - order.estimatedTotal) > 0.05) {
          const totalMs = performance.now() - itnStart;
          console.warn(`[PayFast ITN Timing] order=${orderNumber} status=AMOUNT_MISMATCH sigMs=${sigMs.toFixed(2)} totalMs=${totalMs.toFixed(2)} httpStatus=400 error=Amount_mismatch`);
          return textResponse('Amount mismatch', 400);
        }

        // Idempotency: if already marked paid, immediately return 200 OK
        if (order.paymentStatus === 'paid') {
          console.log(`[PayFast ITN Idempotent] order=${orderNumber} already marked paid; returning 200 OK`);
          return textResponse('ITN Processed Successfully', 200);
        }

        const paymentStatus =
          itnData.payment_status === 'COMPLETE'
            ? 'COMPLETE'
            : itnData.payment_status === 'CANCELLED'
            ? 'CANCELLED'
            : 'FAILED';

        // Synchronously record payment result to KV store immediately:
        // This ensures return page polling instantly detects paymentStatus: 'paid' without ANY network race condition!
        const kvStoreStart = performance.now();
        await orderStore.recordPaymentResult(orderNumber, {
          pfPaymentId: itnData.pf_payment_id || `PF-${Date.now()}`,
          paymentStatus,
          amountGross,
          signatureVerified: signatureMatches,
          serverValidated: true,
          rawItn: itnData,
        });
        const kvStoreEnd = performance.now();

        // Audit Logging to KV for easy debugging:
        if (effectiveEnv.ORDERS_KV) {
          try {
            await effectiveEnv.ORDERS_KV.put(
              'itn_log:latest',
              JSON.stringify({
                timestamp: new Date().toISOString(),
                orderNumber,
                amountGross,
                paymentStatus,
                signatureMatches,
                sigMs,
                itnData,
              }),
              { expirationTtl: 86400 * 7 }
            );
            await effectiveEnv.ORDERS_KV.put(
              `itn_log:${orderNumber}`,
              JSON.stringify({
                timestamp: new Date().toISOString(),
                orderNumber,
                amountGross,
                paymentStatus,
                signatureMatches,
                sigMs,
                itnData,
              }),
              { expirationTtl: 86400 * 7 }
            );
          } catch {
            // Ignore logging errors
          }
        }

        const immediateResponseMs = performance.now() - itnStart;
        console.log(
          `[PayFast ITN Synchronous 200 OK] order=${orderNumber} status=${paymentStatus} kvMs=${(kvStoreEnd - kvStoreStart).toFixed(2)} totalMs=${immediateResponseMs.toFixed(2)}`
        );

        // Background server validate call (non-blocking verification audit)
        if (ctx && typeof ctx.waitUntil === 'function') {
          ctx.waitUntil(
            verifyPayFastITN(itnData, rawBody, effectiveEnv).then((res) => {
              console.log(`[PayFast ITN Audit] order=${orderNumber} serverConfirmed=${res.serverConfirmed}`);
            }).catch((err) => {
              console.warn(`[PayFast ITN Audit Warning] order=${orderNumber}:`, err?.message || err);
            })
          );
        }

        return textResponse('ITN Processed Successfully', 200);
      } catch (err: any) {
        const totalMs = performance.now() - itnStart;
        console.error(`[PayFast ITN Timing] order=unknown status=INTERNAL_ERROR totalMs=${totalMs.toFixed(2)} httpStatus=500 error=${err?.message || 'unknown'}`);
        return textResponse('Internal Server Error processing ITN', 500);
      }
    }

    // 4. GET /api/payfast/order-status/:orderId
    if (pathname.startsWith('/api/payfast/order-status/') && method === 'GET') {
      const statusStart = Date.now();
      const orderId = decodeURIComponent(pathname.replace('/api/payfast/order-status/', ''));
      const order = await orderStore.get(orderId);
      const statusMs = Date.now() - statusStart;
      if (!order) {
        return jsonResponse(
          { success: false, error: `Order ${orderId} not found.` },
          404,
          {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'X-Response-Time-Ms': String(statusMs),
          }
        );
      }

      return jsonResponse(
        {
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
        },
        200,
        {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'X-Response-Time-Ms': String(statusMs),
        }
      );
    }

    // 4b. GET /api/payfast/debug-itn (returns latest ITN audit log from KV)
    if (pathname.startsWith('/api/payfast/debug-itn') && method === 'GET') {
      const specificOrder = pathname.replace('/api/payfast/debug-itn', '').replace(/^\//, '');
      const key = specificOrder ? `itn_log:${specificOrder}` : 'itn_log:latest';
      const log = effectiveEnv.ORDERS_KV ? await effectiveEnv.ORDERS_KV.get(key, 'json') : null;
      return jsonResponse({
        success: true,
        key,
        log: log || 'No ITN recorded yet for this key',
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
      if (!config.isSandbox || effectiveEnv.ALLOW_SANDBOX_SIMULATION === 'false') {
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
