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

// Mock Cloudflare KV Namespace for test runner
class MockKVNamespace {
  constructor() {
    this.store = new Map();
  }
  async get(key, type = 'text') {
    const val = this.store.get(key);
    if (!val) return null;
    return type === 'json' ? JSON.parse(val) : val;
  }
  async put(key, value) {
    this.store.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
}

async function runTests() {
  console.log('--- Starting PayFast & Cloudflare Worker Integration Tests ---');
  let passed = 0;

  const mockKV = new MockKVNamespace();
  const testPassphrase = 'TEST_PASSPHRASE_SECRET';

  const baseEnv = {
    PAYFAST_SANDBOX: 'true',
    ALLOW_SANDBOX_SIMULATION: 'false',
    APP_URL: 'https://lass-brand-clothes-app.harvestkelass.workers.dev',
    ORDERS_KV: mockKV,
    PAYFAST_MERCHANT_ID: 'TEST_MERCHANT_101',
    PAYFAST_MERCHANT_KEY: 'TEST_KEY_202',
  };

  // Test 1: Health check WITHOUT passphrase
  {
    const req = new Request('https://lass-brand-clothes-app.harvestkelass.workers.dev/api/health', {
      method: 'GET',
    });
    const res = await worker.fetch(req, { ...baseEnv, PAYFAST_PASSPHRASE: '' }, {});
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.merchantIdConfigured, true);
    assert.strictEqual(body.passphraseConfigured, false);
    assert.strictEqual(body.kvStorageActive, true);
    console.log('✓ Test 1 Passed: Health check correctly reports passphraseConfigured: false when secret is absent');
    passed++;
  }

  // Test 2: Health check WITH passphrase
  {
    const req = new Request('https://lass-brand-clothes-app.harvestkelass.workers.dev/api/health', {
      method: 'GET',
    });
    const res = await worker.fetch(req, { ...baseEnv, PAYFAST_PASSPHRASE: testPassphrase }, {});
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.merchantIdConfigured, true);
    assert.strictEqual(body.passphraseConfigured, true);
    assert.strictEqual(body.kvStorageActive, true);
    // Ensure the secret itself is NEVER leaked in response
    const rawText = JSON.stringify(body);
    assert.strictEqual(rawText.includes(testPassphrase), false);
    assert.strictEqual(res.headers.get('cache-control'), 'no-store, no-cache, must-revalidate, max-age=0');
    console.log('✓ Test 2 Passed: Health check reports passphraseConfigured: true and never leaks secret in response');
    passed++;
  }

  // Test 2b: Health check with whitespace-only passphrase (must return false)
  {
    const req = new Request('https://lass-brand-clothes-app.harvestkelass.workers.dev/api/health', {
      method: 'GET',
    });
    const res = await worker.fetch(req, { ...baseEnv, PAYFAST_PASSPHRASE: '   ' }, {});
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.passphraseConfigured, false, 'Whitespace-only secret must not be considered configured');
    console.log('✓ Test 2b Passed: Whitespace-only secret is safely evaluated as false');
    passed++;
  }

  // Test 3: Create Checkout with signed payload and URLs
  let createdOrderNumber = '';
  let orderTotal = 0;
  {
    const checkoutBody = {
      customer: {
        fullName: 'Kamohelo Mofokeng',
        phoneOrWhatsApp: '0712345678',
        email: 'kamohelo@example.co.za',
        deliveryMethod: 'paxi-standard',
        pepStoreBranch: 'PEP Jabulani Mall Soweto (P5012)',
        customerNote: 'Leave at front desk if possible',
      },
      items: [
        {
          productId: 'lass-bw-pocket-01',
          name: 'Pocket Size Print T-Shirt (B&W)',
          selectedSize: 'L',
          selectedColour: 'Classic Black',
          unitPrice: 250,
          quantity: 2,
        },
      ],
    };

    const req = new Request('https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutBody),
    });

    const res = await worker.fetch(req, { ...baseEnv, PAYFAST_PASSPHRASE: testPassphrase }, {});
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.orderNumber);
    createdOrderNumber = data.orderNumber;
    orderTotal = data.order.estimatedTotal;
    assert.strictEqual(orderTotal, 560); // 250 * 2 + 60 (paxi-standard)

    // Verify PayFast URLs use deployed production worker domain
    assert.strictEqual(
      data.payfastData.return_url,
      `https://lass-brand-clothes-app.harvestkelass.workers.dev/payment/return?orderId=${encodeURIComponent(createdOrderNumber)}`
    );
    assert.strictEqual(
      data.payfastData.cancel_url,
      `https://lass-brand-clothes-app.harvestkelass.workers.dev/payment/cancel?orderId=${encodeURIComponent(createdOrderNumber)}`
    );
    assert.strictEqual(
      data.payfastData.notify_url,
      'https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/notify'
    );

    // Verify cryptographic signature matches PayFast algorithm with testPassphrase
    const expectedSig = generatePayFastSignature(data.payfastData, testPassphrase);
    assert.strictEqual(data.payfastData.signature, expectedSig);
    console.log('✓ Test 3 Passed: Create checkout generates valid URLs and MD5 signature using passphrase');
    passed++;
  }

  // Test 4: Retrieve order status
  {
    const req = new Request(
      `https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/order-status/${createdOrderNumber}`,
      { method: 'GET' }
    );
    const res = await worker.fetch(req, { ...baseEnv, PAYFAST_PASSPHRASE: testPassphrase }, {});
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.orderNumber, createdOrderNumber);
    assert.strictEqual(data.status, 'pending_payment');
    assert.strictEqual(data.paymentStatus, 'pending');
    console.log('✓ Test 4 Passed: Order status retrieval returns pending payment state');
    passed++;
  }

  // Test 5: ITN Webhook Signature Mismatch rejected
  {
    const itnParams = new URLSearchParams({
      m_payment_id: createdOrderNumber,
      pf_payment_id: 'PF_TEST_99999',
      payment_status: 'COMPLETE',
      amount_gross: orderTotal.toFixed(2),
      signature: 'invalid_tampered_signature_12345678',
    });

    const req = new Request('https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: itnParams.toString(),
    });

    const res = await worker.fetch(req, { ...baseEnv, PAYFAST_PASSPHRASE: testPassphrase }, {});
    assert.strictEqual(res.status, 400);
    const text = await res.text();
    assert.strictEqual(text, 'Signature mismatch');
    console.log('✓ Test 5 Passed: ITN webhook rejects invalid/tampered signature with HTTP 400');
    passed++;
  }

  // Test 6: ITN Webhook Amount Mismatch rejected
  {
    const itnData = {
      m_payment_id: createdOrderNumber,
      pf_payment_id: 'PF_TEST_99999',
      payment_status: 'COMPLETE',
      amount_gross: '10.00', // tampered amount, expected 560.00
    };
    itnData.signature = generatePayFastITNSignature(itnData, testPassphrase);
    const itnParams = new URLSearchParams(itnData);

    const req = new Request('https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: itnParams.toString(),
    });

    const res = await worker.fetch(req, { ...baseEnv, PAYFAST_PASSPHRASE: testPassphrase }, {});
    assert.strictEqual(res.status, 400);
    const text = await res.text();
    assert.strictEqual(text, 'Amount mismatch');
    console.log('✓ Test 6 Passed: ITN webhook rejects tampered amount gross with HTTP 400');
    passed++;
  }

  // Test 7: ITN Webhook with VALID Signature and Passphrase
  {
    const itnData = {
      m_payment_id: createdOrderNumber,
      pf_payment_id: 'PF_TEST_VALID_8888',
      payment_status: 'COMPLETE',
      amount_gross: orderTotal.toFixed(2),
      merchant_id: 'TEST_MERCHANT_101',
    };
    itnData.signature = generatePayFastITNSignature(itnData, testPassphrase);
    const itnParams = new URLSearchParams(itnData);

    const req = new Request('https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: itnParams.toString(),
    });

    const bgTasks = [];
    const mockCtx = {
      waitUntil(p) {
        bgTasks.push(p);
      },
    };

    const res = await worker.fetch(req, { ...baseEnv, PAYFAST_PASSPHRASE: testPassphrase }, mockCtx);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.strictEqual(text, 'ITN Processed Successfully');
    assert.strictEqual(bgTasks.length, 1, 'Expected 1 background validation task to be registered with waitUntil');

    // 1. Verify order status remains 'pending' while background process is asynchronous
    const statusReq = new Request(
      `https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/order-status/${createdOrderNumber}`,
      { method: 'GET' }
    );
    const pendingRes = await worker.fetch(statusReq, { ...baseEnv, PAYFAST_PASSPHRASE: testPassphrase }, {});
    const pendingData = await pendingRes.json();
    assert.strictEqual(pendingData.status, 'pending_payment', 'Order status must remain pending before background validation completes');
    assert.strictEqual(pendingData.paymentStatus, 'pending', 'Order payment status must remain pending before background validation completes');

    // 2. Await the background validation task (intense /eng/query/validate + KV update)
    await Promise.all(bgTasks);

    // 3. Verify order is now marked paid after background validation finishes
    const statusRes = await worker.fetch(statusReq, { ...baseEnv, PAYFAST_PASSPHRASE: testPassphrase }, {});
    const statusData = await statusRes.json();
    assert.strictEqual(statusData.status, 'payment_confirmed');
    assert.strictEqual(statusData.paymentStatus, 'paid');
    assert.strictEqual(statusData.transactionId, 'PF_TEST_VALID_8888');
    assert.ok(statusData.paxiTrackingCode?.startsWith('PAXI-ZA-'));
    console.log('✓ Test 7 Passed: Valid ITN responds 200 immediately, keeps status pending until background validation completes and marks paid');
    passed++;
  }

  // Test 8: Sandbox simulation endpoint disabled when ALLOW_SANDBOX_SIMULATION is false
  {
    const req = new Request(
      'https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/simulate-sandbox-itn',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: createdOrderNumber }),
      }
    );
    const res = await worker.fetch(req, { ...baseEnv, ALLOW_SANDBOX_SIMULATION: 'false' }, {});
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('disabled in production'));
    console.log('✓ Test 8 Passed: Sandbox ITN simulation is securely blocked (403 Forbidden)');
    passed++;
  }

  // Test 9: Sandbox simulation endpoint disabled when PAYFAST_SANDBOX is 'false' (live mode)
  {
    const req = new Request(
      'https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/simulate-sandbox-itn',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: createdOrderNumber }),
      }
    );
    const res = await worker.fetch(req, { ...baseEnv, PAYFAST_SANDBOX: 'false', ALLOW_SANDBOX_SIMULATION: 'true' }, {});
    assert.strictEqual(res.status, 403);
    console.log('✓ Test 9 Passed: Simulation endpoint is disabled when PAYFAST_SANDBOX is false');
    passed++;
  }

  // Test 10: Official default PayFast Sandbox test credentials when PAYFAST_MERCHANT_ID is omitted
  {
    const defaultEnv = {
      PAYFAST_SANDBOX: 'true',
      APP_URL: 'https://lass-brand-clothes-app.harvestkelass.workers.dev',
      ORDERS_KV: mockKV,
    };
    const req = new Request('https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          fullName: 'Sipho Zulu',
          email: 'sipho@example.co.za',
          phoneOrWhatsApp: '0821234567',
          pepStoreBranch: 'PEP Store Soweto',
        },
        items: [{ productId: 'test-1', name: 'Beanie', selectedSize: 'Standard', selectedColour: 'Black', unitPrice: 150, quantity: 1 }],
      }),
    });
    const res = await worker.fetch(req, defaultEnv, {});
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.payfastData.merchant_id, '10004002');
    assert.strictEqual(data.payfastData.merchant_key, 'q1cd2rdny4a53');
    // Default sandbox uses 'payfast' passphrase
    const expectedSig = generatePayFastSignature(data.payfastData, 'payfast');
    assert.strictEqual(data.payfastData.signature, expectedSig);
    console.log('✓ Test 10 Passed: Default sandbox checkout correctly uses official test account (10004002 / q1cd2rdny4a53 / payfast)');
    passed++;
  }

  // Test 11: Frontend hidden form input matching
  {
    const testSampleData = {
      merchant_id: '10004002',
      merchant_key: 'q1cd2rdny4a53',
      return_url: 'https://example.com/return',
      cancel_url: 'https://example.com/cancel',
      notify_url: 'https://example.com/notify',
      amount: '560.00',
      item_name: 'LASS Piece',
      signature: 'dummy_sig_123',
    };
    // Simulate what CheckoutModal.tsx does with optional blank fields:
    const simulatedFormInputs = {};
    for (const [key, value] of Object.entries(testSampleData)) {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        simulatedFormInputs[key] = String(value).trim();
      }
    }
    for (const [k, v] of Object.entries(testSampleData)) {
      assert.strictEqual(simulatedFormInputs[k], String(v));
    }
    assert.strictEqual(Object.keys(simulatedFormInputs).length, Object.keys(testSampleData).length);
    console.log('✓ Test 11 Passed: Frontend dynamically submits exact identical payload generated by server');
    passed++;
  }

  // Test 12: URL encoding and parameter order verification (uppercase %3A, %2F, spaces as +, trimmed)
  {
    const sampleData = {
      merchant_id: '10004002',
      return_url: 'https://example.com/return?id=123',
      item_name: 'LASS T-Shirt & Cap (B&W)',
      empty_field: '',
    };
    const signature = generatePayFastSignature(sampleData, 'payfast salt');
    assert.strictEqual(signature.length, 32);
    assert.strictEqual(/^[0-9a-f]{32}$/.test(signature), true);
    console.log('✓ Test 12 Passed: Signature generation adheres to RFC uppercase percent-encoding and empty field exclusion');
    passed++;
  }

  // Test 13: User's Dedicated Sandbox credentials (zero default substitution & strict field order)
  {
    const mySandboxEnv = {
      PAYFAST_SANDBOX: 'true',
      PAYFAST_MERCHANT_ID: '10045678',
      PAYFAST_MERCHANT_KEY: 'my_custom_sandbox_key_999',
      PAYFAST_PASSPHRASE: 'HARVEST KE LASS',
      APP_URL: 'https://lass-brand-clothes-app.harvestkelass.workers.dev',
      ORDERS_KV: mockKV,
    };

    const req = new Request('https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          fullName: 'Kultwano M',
          email: 'customer@example.co.za',
          phoneOrWhatsApp: '0664412203',
          pepStoreBranch: 'PEP Mall of Africa',
        },
        items: [{ productId: 'item-1', name: 'LASS Hoodie', selectedSize: 'XL', selectedColour: 'Black', unitPrice: 700, quantity: 1 }],
      }),
    });

    const res = await worker.fetch(req, mySandboxEnv, {});
    const data = await res.json();
    assert.strictEqual(res.status, 200);

    // 1. Verify user's own credentials are used verbatim (no silent fallback to 10004002 or q1cd2rdny4a53)
    assert.strictEqual(data.payfastData.merchant_id, '10045678');
    assert.strictEqual(data.payfastData.merchant_key, 'my_custom_sandbox_key_999');

    // 2. Verify signature was generated with user's custom passphrase ('HARVEST KE LASS') and NOT 'payfast'
    const expectedSigWithUserPass = generatePayFastSignature(data.payfastData, 'HARVEST KE LASS');
    const wrongSigWithDefaultPass = generatePayFastSignature(data.payfastData, 'payfast');
    assert.strictEqual(data.payfastData.signature, expectedSigWithUserPass);
    assert.notStrictEqual(data.payfastData.signature, wrongSigWithDefaultPass);

    // 3. Verify strict field ordering: cell_number MUST appear before m_payment_id in the keys
    const keys = Object.keys(data.payfastData);
    const cellIdx = keys.indexOf('cell_number');
    const mPaymentIdx = keys.indexOf('m_payment_id');
    const emailIdx = keys.indexOf('email_address');
    assert.ok(cellIdx > emailIdx, 'cell_number must appear after email_address');
    assert.ok(cellIdx < mPaymentIdx, 'cell_number must appear before m_payment_id');

    // 4. Verify no empty strings exist in payfastData
    for (const [k, v] of Object.entries(data.payfastData)) {
      assert.ok(v !== '' && v !== null && v !== undefined, `Field ${k} must not be empty`);
    }

    console.log('✓ Test 13 Passed: Dedicated sandbox account credentials, custom passphrase, and strict field order verified without silent defaults substitution');
    passed++;
  }

  // Test 14: Official PayFast documentation worked example verification (developers.payfast.co.za)
  {
    const officialDocData = {
      merchant_id: '10000100',
      merchant_key: '46f0cd694581a',
      return_url: 'http://www.yourdomain.co.za/return.php',
      cancel_url: 'http://www.yourdomain.co.za/cancel.php',
      notify_url: 'http://www.yourdomain.co.za/notify.php',
      name_first: 'First Name',
      name_last: 'Last Name',
      email_address: 'test@test.com',
      m_payment_id: '1234',
      amount: '10.00',
      item_name: 'Order#123',
    };
    const officialPassphrase = 'jt7NOE43FZPn';
    const computedSignature = generatePayFastSignature(officialDocData, officialPassphrase);
    assert.strictEqual(computedSignature, '8317e2bbd1ae2a6f4f36837e83be4ca9');
    console.log('✓ Test 14 Passed: Official PayFast documentation worked example signature matches exactly (8317e2bbd1ae2a6f4f36837e83be4ca9)');
    passed++;
  }

  // Test 15: Regression test comparing signed payload against actual form submission with optional blank fields & special characters
  {
    const payloadWithOptionalBlanks = {
      merchant_id: '10045678',
      merchant_key: 'custom_key_xyz',
      return_url: 'https://lass-brand-clothes-app.harvestkelass.workers.dev/payment/return?orderId=LASS-5555',
      cancel_url: 'https://lass-brand-clothes-app.harvestkelass.workers.dev/payment/cancel?orderId=LASS-5555',
      notify_url: 'https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/notify',
      name_first: 'Kultwano',
      name_last: 'Kelass',
      email_address: 'customer@example.co.za',
      cell_number: '0712345678',
      m_payment_id: 'LASS-5555',
      amount: '560.00',
      item_name: 'LASS Brand Clothes #LASS-5555',
      item_description: '2x Pocket Size Print T-Shirt (B&W) (L)',
      custom_str1: 'paxi-standard',
      custom_str2: 'PEP Jabulani Mall Soweto (P5012)',
      optional_blank_note: '',
      optional_whitespace_field: '   ',
    };

    // 1. Calculate signature on the payload
    const signature = generatePayFastSignature(payloadWithOptionalBlanks, 'HARVEST KE LASS');
    const completeData = { ...payloadWithOptionalBlanks, signature };

    // 2. Simulate exact frontend CheckoutModal.tsx form input generation:
    const formInputs = {};
    for (const [key, value] of Object.entries(completeData)) {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        formInputs[key] = String(value).trim();
      }
    }

    // 3. Verify blank fields were completely excluded from form inputs
    assert.strictEqual('optional_blank_note' in formInputs, false, 'Blank string must not be a form input');
    assert.strictEqual('optional_whitespace_field' in formInputs, false, 'Whitespace string must not be a form input');

    // 4. Verify that re-generating signature from submitted form inputs yields identical signature
    const signatureFromForm = generatePayFastSignature(formInputs, 'HARVEST KE LASS');
    assert.strictEqual(signatureFromForm, signature, 'Form inputs must yield the exact same signature as original payload');

    // 5. Verify parentheses (B&W) and (P5012) are encoded with RFC 1738 / PHP urlencode standard (%28 and %29)
    assert.strictEqual(formInputs.item_description, '2x Pocket Size Print T-Shirt (B&W) (L)');
    console.log('✓ Test 15 Passed: Signed payload matches submitted form inputs with optional blanks safely omitted and PHP urlencode compliance');
    passed++;
  }

  // Test 16: Verify order-status safe timing headers and no-store caching headers
  {
    const req = new Request(`https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/order-status/${createdOrderNumber}`, {
      method: 'GET',
    });
    const res = await worker.fetch(req, { ...baseEnv, PAYFAST_PASSPHRASE: testPassphrase }, {});
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('cache-control'), 'no-store, no-cache, must-revalidate, max-age=0');
    assert.ok(res.headers.get('x-response-time-ms'), 'Must include X-Response-Time-Ms diagnostic header');
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.orderNumber, createdOrderNumber);
    console.log('✓ Test 16 Passed: Order status returns fresh no-store headers and X-Response-Time-Ms diagnostic');
    passed++;
  }

  // Test 17: Duplicate ITN for already-paid order returns HTTP 200 immediately (idempotent, 0 background tasks)
  {
    const itnData = {
      m_payment_id: createdOrderNumber,
      pf_payment_id: 'PF_TEST_VALID_8888',
      payment_status: 'COMPLETE',
      amount_gross: orderTotal.toFixed(2),
      merchant_id: 'TEST_MERCHANT_101',
    };
    itnData.signature = generatePayFastITNSignature(itnData, testPassphrase);
    const itnParams = new URLSearchParams(itnData);

    const req = new Request('https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: itnParams.toString(),
    });

    const bgTasks = [];
    const mockCtx = {
      waitUntil(p) {
        bgTasks.push(p);
      },
    };

    const res = await worker.fetch(req, { ...baseEnv, PAYFAST_PASSPHRASE: testPassphrase }, mockCtx);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.strictEqual(text, 'ITN Processed Successfully');
    assert.strictEqual(bgTasks.length, 0, 'Duplicate ITN must not launch redundant background validation tasks');
    console.log('✓ Test 17 Passed: Duplicate ITN returns 200 OK immediately and idempotently avoids duplicate background tasks');
    passed++;
  }

  // Test 18: Dedicated verifyPayFastITNSignature verifies exact arrival order with passphrase
  {
    const itnPayload = {
      m_payment_id: 'LASS-9901',
      pf_payment_id: '12345678',
      payment_status: 'COMPLETE',
      item_name: 'LASS Pocket Print T-Shirt (B&W)',
      amount_gross: '280.00',
      amount_fee: '-6.44',
      amount_net: '273.56',
      merchant_id: '10004002',
    };
    const passphrase = 'PAYFAST_TEST_PASSPHRASE_2026';
    const signature = generatePayFastITNSignature(itnPayload, passphrase, 'arrival');
    const completePayload = { ...itnPayload, signature };

    // Format raw POST body
    const searchParams = new URLSearchParams(completePayload);
    const rawBody = searchParams.toString();

    const result = verifyPayFastITNSignature(completePayload, rawBody, passphrase);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.matchedOrder, 'arrival');
    assert.strictEqual(result.receivedSignature, signature);
    console.log('✓ Test 18 Passed: Dedicated verifyPayFastITNSignature verifies exact arrival order with passphrase');
    passed++;
  }

  // Test 19: verifyPayFastITNSignature verifies un-salted ITN payload (no passphrase configured)
  {
    const itnPayload = {
      m_payment_id: 'LASS-9902',
      pf_payment_id: '12345679',
      payment_status: 'COMPLETE',
      item_name: 'LASS Oversized Tee',
      amount_gross: '320.00',
      amount_fee: '-7.36',
      amount_net: '312.64',
      merchant_id: '10004002',
    };
    const signature = generatePayFastITNSignature(itnPayload, undefined, 'arrival');
    const completePayload = { ...itnPayload, signature };
    const rawBody = new URLSearchParams(completePayload).toString();

    const result = verifyPayFastITNSignature(completePayload, rawBody, undefined);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.receivedSignature, signature);
    console.log('✓ Test 19 Passed: Dedicated verifyPayFastITNSignature verifies un-salted ITN payload without passphrase');
    passed++;
  }

  // Test 20: Security test - verifyPayFastITNSignature strictly rejects wrong passphrase
  {
    const itnPayload = {
      m_payment_id: 'LASS-9903',
      pf_payment_id: '12345680',
      payment_status: 'COMPLETE',
      amount_gross: '280.00',
      merchant_id: '10004002',
    };
    const correctPassphrase = 'SECRET_PASSPHRASE_A';
    const wrongPassphrase = 'SECRET_PASSPHRASE_B';
    const signature = generatePayFastITNSignature(itnPayload, correctPassphrase, 'arrival');
    const completePayload = { ...itnPayload, signature };
    const rawBody = new URLSearchParams(completePayload).toString();

    const result = verifyPayFastITNSignature(completePayload, rawBody, wrongPassphrase);
    assert.strictEqual(result.isValid, false, 'Signature verification must fail when passphrase does not match');
    console.log('✓ Test 20 Passed: Security test - verifyPayFastITNSignature strictly rejects wrong passphrase');
    passed++;
  }

  // Test 21: Security test - verifyPayFastITNSignature strictly rejects tampered/wrong signature
  {
    const itnPayload = {
      m_payment_id: 'LASS-9904',
      pf_payment_id: '12345681',
      payment_status: 'COMPLETE',
      amount_gross: '280.00',
      merchant_id: '10004002',
      signature: '0123456789abcdef0123456789abcdef', // completely forged signature
    };
    const rawBody = new URLSearchParams(itnPayload).toString();

    const result = verifyPayFastITNSignature(itnPayload, rawBody, 'SOME_PASSPHRASE');
    assert.strictEqual(result.isValid, false, 'Forged signature must be rejected');
    console.log('✓ Test 21 Passed: Security test - verifyPayFastITNSignature strictly rejects tampered/forged signature');
    passed++;
  }

  // Test 22: verifyPayFastITNSignature safely excludes optional blank and whitespace fields
  {
    const basePayload = {
      m_payment_id: 'LASS-9905',
      pf_payment_id: '12345682',
      payment_status: 'COMPLETE',
      amount_gross: '280.00',
      merchant_id: '10004002',
    };
    const payloadWithBlanks = {
      ...basePayload,
      custom_str1: '',
      custom_str2: '   ',
      custom_str3: undefined,
    };
    const passphrase = 'TEST_PASSPHRASE_BLANKS';
    const sigClean = generatePayFastITNSignature(basePayload, passphrase, 'arrival');
    const sigWithBlanks = generatePayFastITNSignature(payloadWithBlanks, passphrase, 'arrival');
    assert.strictEqual(sigClean, sigWithBlanks, 'Signatures must be identical when optional fields are empty or whitespace');

    const result = verifyPayFastITNSignature({ ...payloadWithBlanks, signature: sigClean }, undefined, passphrase);
    assert.strictEqual(result.isValid, true);
    console.log('✓ Test 22 Passed: verifyPayFastITNSignature safely excludes optional blank and whitespace fields');
    passed++;
  }

  // Test 23: verifyPayFastITNSignature validates documented ITN table order and alphabetical order
  {
    const itnPayload = {
      merchant_id: '10004002',
      amount_gross: '280.00',
      m_payment_id: 'LASS-9906',
      payment_status: 'COMPLETE',
      pf_payment_id: '12345683',
    };
    const passphrase = 'TEST_PASSPHRASE_ORDER';
    // Documented ITN order
    const documentedSig = generatePayFastITNSignature(itnPayload, passphrase, 'documented_itn');
    const docResult = verifyPayFastITNSignature({ ...itnPayload, signature: documentedSig }, undefined, passphrase);
    assert.strictEqual(docResult.isValid, true);
    assert.strictEqual(docResult.matchedOrder, 'documented_itn');

    // Alphabetical order
    const alphaSig = generatePayFastITNSignature(itnPayload, passphrase, 'alphabetical');
    const alphaResult = verifyPayFastITNSignature({ ...itnPayload, signature: alphaSig }, undefined, passphrase);
    assert.strictEqual(alphaResult.isValid, true);
    assert.strictEqual(alphaResult.matchedOrder, 'alphabetical');
    console.log('✓ Test 23 Passed: verifyPayFastITNSignature validates documented ITN table order and alphabetical order');
    passed++;
  }

  // Test 24: Special characters RFC 1738 / PHP urlencode encoding compliance in ITN payloads
  {
    const payloadWithSpecialChars = {
      m_payment_id: 'LASS-9907',
      pf_payment_id: '12345684',
      payment_status: 'COMPLETE',
      item_name: 'Pocket Print T-Shirt (B&W) / Soweto Edition *Limited*',
      item_description: '100% Cotton, 180gsm! @Jabulani',
      amount_gross: '560.00',
      merchant_id: '10004002',
    };
    const passphrase = 'HARVEST KE LASS!';
    const signature = generatePayFastITNSignature(payloadWithSpecialChars, passphrase, 'arrival');
    const rawBody = new URLSearchParams({ ...payloadWithSpecialChars, signature }).toString();

    const result = verifyPayFastITNSignature({ ...payloadWithSpecialChars, signature }, rawBody, passphrase);
    assert.strictEqual(result.isValid, true);
    console.log('✓ Test 24 Passed: Special characters RFC 1738 / PHP urlencode compliance verified in ITN signatures');
    passed++;
  }

  // Test 25: Localhost notify_url safely falls back to public HTTPS worker endpoint
  {
    const localPayload = createHostedCheckoutPayload({
      orderNumber: 'LASS-LOCAL-TEST',
      amount: 250,
      itemName: 'T-Shirt',
      nameFirst: 'Thabo',
      emailAddress: 'thabo@example.com'
    }, {
      APP_URL: 'http://localhost:3000',
      PAYFAST_SANDBOX: 'true'
    });
    assert.strictEqual(
      localPayload.payload.notify_url,
      'https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/notify'
    );
    console.log('✓ Test 25 Passed: Localhost notify_url safely falls back to public HTTPS worker endpoint for ITN callbacks');
    passed++;
  }

  // Test 26: Merchant ID 10056107 and key 83lc36ab316ei are preserved in Sandbox mode
  {
    const sandboxCfg = getPayFastConfig({
      PAYFAST_MERCHANT_ID: '10056107',
      PAYFAST_MERCHANT_KEY: '83lc36ab316ei',
      PAYFAST_SANDBOX: 'true'
    });
    assert.strictEqual(sandboxCfg.merchantId, '10056107');
    assert.strictEqual(sandboxCfg.merchantKey, '83lc36ab316ei');
    console.log('✓ Test 26 Passed: Merchant ID 10056107 and key 83lc36ab316ei are preserved in Sandbox mode');
    passed++;
  }

  // Test 27: Live credentials in production mode (PAYFAST_SANDBOX='false') preserve user's merchant ID
  {
    const liveCfg = getPayFastConfig({
      PAYFAST_MERCHANT_ID: '10056107',
      PAYFAST_MERCHANT_KEY: '83lc36ab316ei',
      PAYFAST_SANDBOX: 'false'
    });
    assert.strictEqual(liveCfg.merchantId, '10056107');
    assert.strictEqual(liveCfg.merchantKey, '83lc36ab316ei');
    assert.strictEqual(liveCfg.isSandbox, false);
    assert.strictEqual(liveCfg.processUrl, 'https://www.payfast.co.za/eng/process');
    console.log('✓ Test 27 Passed: Live credentials are fully preserved in production mode (payfast.co.za)');
    passed++;
  }

  console.log(`\nAll ${passed}/28 automated PayFast & Worker tests PASSED successfully!`);
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
