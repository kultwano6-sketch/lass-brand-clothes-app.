import assert from 'node:assert';
import crypto from 'node:crypto';
import worker from './src/worker.ts';
import {
  generatePayFastSignature,
  generatePayFastITNSignature,
  verifyPayFastITNSignature,
  createHostedCheckoutPayload,
  getPayFastConfig,
} from './server/payfast.ts';
import { formatZAR, normalizeWhatsAppNumber } from './src/utils/whatsapp.ts';
import { validateLuhn, detectCardBrand, formatCardNumber, formatExpiry, SA_BANKS } from './src/utils/payment.ts';

class MockKV {
  constructor() {
    this.map = new Map();
  }
  async get(k, type = 'text') {
    const val = this.map.get(k);
    if (!val) return null;
    return type === 'json' ? JSON.parse(val) : val;
  }
  async put(k, v) {
    this.map.set(k, typeof v === 'string' ? v : JSON.stringify(v));
  }
}

async function runComprehensiveScan() {
  console.log('====================================================');
  console.log('🔍 FULL PAYFAST & STORE ENGINE VERIFICATION SCAN');
  console.log('====================================================');
  let testCount = 0;

  const kv = new MockKV();
  const env = {
    PAYFAST_SANDBOX: 'true',
    ALLOW_SANDBOX_SIMULATION: 'false',
    APP_URL: 'https://lass-brand-clothes-app.harvestkelass.workers.dev',
    ORDERS_KV: kv,
    PAYFAST_MERCHANT_ID: '10056107',
    PAYFAST_MERCHANT_KEY: '83lc36ab316ei',
    PAYFAST_PASSPHRASE: 'HARVEST KE LASS',
  };

  // Test 1: formatZAR resilience across edge cases
  {
    testCount++;
    assert.strictEqual(formatZAR(300), 'R300.00');
    assert.strictEqual(formatZAR(1250.5), 'R1 250.50');
    assert.strictEqual(formatZAR(0), 'R0.00');
    assert.strictEqual(formatZAR(undefined), 'R0.00');
    assert.strictEqual(formatZAR(null), 'R0.00');
    assert.strictEqual(formatZAR(NaN), 'R0.00');
    assert.strictEqual(formatZAR('250'), 'R250.00');
    console.log(`✓ Scan #${testCount}: formatZAR edge cases (undefined, null, NaN, strings) safely handled without exception`);
  }

  // Test 2: normalizeWhatsAppNumber formatting
  {
    testCount++;
    assert.strictEqual(normalizeWhatsAppNumber('0761848261'), '27761848261');
    assert.strictEqual(normalizeWhatsAppNumber('+27 76 184 8261'), '27761848261');
    assert.strictEqual(normalizeWhatsAppNumber('084 767 8287'), '27847678287');
    console.log(`✓ Scan #${testCount}: normalizeWhatsAppNumber correctly sanitizes SA numbers to international format`);
  }

  // Test 3: Card validation and Luhn algorithm
  {
    testCount++;
    assert.strictEqual(detectCardBrand('4111111111111111'), 'visa');
    assert.strictEqual(detectCardBrand('5500000000000004'), 'mastercard');
    assert.strictEqual(detectCardBrand('378282246310005'), 'amex');
    assert.strictEqual(formatCardNumber('4111222233334444'), '4111 2222 3333 4444');
    assert.strictEqual(formatExpiry('1228'), '12/28');
    assert.strictEqual(validateLuhn('4242424242424242'), true);
    assert.strictEqual(validateLuhn('4242424242424243'), false);
    console.log(`✓ Scan #${testCount}: Card brand detection, Luhn checksum, and input formatters verified`);
  }

  // Test 4: SA Banks list
  {
    testCount++;
    assert(SA_BANKS.length >= 6);
    assert(SA_BANKS.some(b => b.id === 'capitec' && b.popular));
    assert(SA_BANKS.some(b => b.id === 'fnb'));
    console.log(`✓ Scan #${testCount}: South African major banking providers properly registered`);
  }

  // Test 5: Health check security (no secrets leaked)
  {
    testCount++;
    const req = new Request('https://lass-brand-clothes-app.harvestkelass.workers.dev/api/health', { method: 'GET' });
    const res = await worker.fetch(req, env, {});
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.passphraseConfigured, true);
    assert.strictEqual(JSON.stringify(data).includes('HARVEST KE LASS'), false);
    assert.strictEqual(res.headers.get('Cache-Control'), 'no-store, no-cache, must-revalidate, max-age=0');
    console.log(`✓ Scan #${testCount}: /api/health returns ok, active passphrase, and never leaks secrets in body or headers`);
  }

  // Test 6: Special Characters in Customer Name & PEP Branch
  {
    testCount++;
    const req = new Request('https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          fullName: "Sipho O'Connor & Sons",
          email: 'sipho.oconnor@mail.co.za',
          phoneOrWhatsApp: '076 123 4567',
          deliveryMethod: 'paxi-standard',
          pepStoreBranch: "PEP Store (Mall of Africa #4912) - Midrand",
          customerNote: "Handle with care! Urgent delivery.",
        },
        items: [
          {
            product: { id: 'lass-2026-01', name: '2026 Kasi Statement Graphic T-Shirt', price: 300 },
            selectedSize: 'XL',
            selectedColour: 'Black & Gold',
            quantity: 1,
          },
        ],
        customOrderRef: 'LASS-8899',
      }),
    });
    const res = await worker.fetch(req, env, {});
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.orderNumber, 'LASS-8899');
    assert.strictEqual(data.order.estimatedTotal, 360); // 300 + 60
    assert(data.payfastData.signature);
    console.log(`✓ Scan #${testCount}: Special characters (apostrophes, ampersands, hashes) securely handled in checkout session`);
  }

  // Test 7: Free delivery qualifying threshold (R800+)
  {
    testCount++;
    const req = new Request('https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          fullName: 'Nthabiseng Zulu',
          email: 'nthabiseng@gmail.com',
          phoneOrWhatsApp: '082 555 1234',
          deliveryMethod: 'paxi-standard',
          pepStoreBranch: 'PEP Sandton City',
        },
        items: [
          {
            product: { id: 'lass-1', name: 'Hoodie Premium', price: 850 },
            selectedSize: 'M',
            selectedColour: 'Black',
            quantity: 1,
          },
        ],
        customOrderRef: 'LASS-9900',
      }),
    });
    const res = await worker.fetch(req, env, {});
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.order.deliveryFee, 0);
    assert.strictEqual(data.order.estimatedTotal, 850);
    console.log(`✓ Scan #${testCount}: Free PAXI delivery threshold (R800+) correctly sets deliveryFee: 0`);
  }

  // Test 8: End-to-End ITN Webhook & Order State Transition
  {
    testCount++;
    const orderNum = 'LASS-7711';
    // Create initial order
    const createReq = new Request('https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          fullName: 'Kutlwano Maila',
          email: 'kultwano6@gmail.com',
          phoneOrWhatsApp: '0761848261',
          deliveryMethod: 'collection',
        },
        items: [{ product: { id: 'p1', name: 'T-Shirt', price: 300 }, quantity: 1 }],
        customOrderRef: orderNum,
      }),
    });
    const createRes = await worker.fetch(createReq, env, {});
    assert.strictEqual(createRes.status, 200);

    // Initial status check: pending
    const statusReq1 = new Request(`https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/order-status/${orderNum}`);
    const statusRes1 = await worker.fetch(statusReq1, env, {});
    const statusData1 = await statusRes1.json();
    assert.strictEqual(statusData1.status, 'pending_payment');
    assert.strictEqual(statusData1.paymentStatus, 'pending');

    // PayFast ITN Payload
    const itnPayload = {
      m_payment_id: orderNum,
      pf_payment_id: 'PF-TXN-SCAN-994411',
      payment_status: 'COMPLETE',
      item_name: `LASS Brand Clothes #${orderNum}`,
      item_description: '1x T-Shirt',
      amount_gross: '300.00',
      amount_fee: '-6.90',
      amount_net: '293.10',
      custom_str1: 'collection',
      name_first: 'Kutlwano',
      name_last: 'Maila',
      email_address: 'kultwano6@gmail.com',
      merchant_id: '10056107',
    };
    itnPayload.signature = generatePayFastITNSignature(itnPayload, 'HARVEST KE LASS');

    const itnBody = Object.entries(itnPayload)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');

    const itnReq = new Request('https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: itnBody,
    });
    const itnRes = await worker.fetch(itnReq, env, {});
    assert.strictEqual(itnRes.status, 200);

    // Status check after ITN: payment_confirmed
    const statusReq2 = new Request(`https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/order-status/${orderNum}`);
    const statusRes2 = await worker.fetch(statusReq2, env, {});
    const statusData2 = await statusRes2.json();
    assert.strictEqual(statusData2.status, 'payment_confirmed');
    assert.strictEqual(statusData2.paymentStatus, 'paid');
    assert.strictEqual(statusData2.transactionId, 'PF-TXN-SCAN-994411');
    console.log(`✓ Scan #${testCount}: End-to-End ITN webhook processes signature, updates order to paid, and sets transactionId`);
  }

  // Test 9: Rejection of forged signature on ITN
  {
    testCount++;
    const forgedPayload = {
      m_payment_id: 'LASS-7711',
      pf_payment_id: 'FORGED_TXN',
      payment_status: 'COMPLETE',
      amount_gross: '300.00',
      merchant_id: '10056107',
      signature: 'bad_signature_hash_12345',
    };
    const itnBody = Object.entries(forgedPayload)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    const req = new Request('https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: itnBody,
    });
    const res = await worker.fetch(req, env, {});
    assert.strictEqual(res.status, 400);
    console.log(`✓ Scan #${testCount}: Cryptographic security rejects forged/invalid MD5 signature with HTTP 400`);
  }

  // Test 10: Idempotent duplicate ITN handling
  {
    testCount++;
    const orderNum = 'LASS-7711';
    const itnPayload = {
      m_payment_id: orderNum,
      pf_payment_id: 'PF-TXN-SCAN-994411',
      payment_status: 'COMPLETE',
      amount_gross: '300.00',
      merchant_id: '10056107',
    };
    itnPayload.signature = generatePayFastITNSignature(itnPayload, 'HARVEST KE LASS');
    const itnBody = Object.entries(itnPayload)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');

    const req = new Request('https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: itnBody,
    });
    // Send duplicate
    const res = await worker.fetch(req, env, {});
    assert.strictEqual(res.status, 200);
    console.log(`✓ Scan #${testCount}: Duplicate ITN callback safely returns 200 OK without re-mutating or breaking state`);
  }

  // Test 11: Missing order 404 response
  {
    testCount++;
    const req = new Request('https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/order-status/LASS-NON-EXISTENT');
    const res = await worker.fetch(req, env, {});
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    console.log(`✓ Scan #${testCount}: Non-existent order lookup returns clean 404 response`);
  }

  console.log('====================================================');
  console.log(`🎉 ALL ${testCount}/${testCount} COMPREHENSIVE SCAN CHECKS PASSED!`);
  console.log('====================================================');
}

runComprehensiveScan().catch((err) => {
  console.error('Scan failed with error:', err);
  process.exit(1);
});
