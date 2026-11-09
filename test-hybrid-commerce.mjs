import assert from 'node:assert';
import { commerceStore, isValidStatusTransition, normalizeOrderStatus } from './server/commerceStore.js';
import { INITIAL_PRODUCTS } from './src/data/initialProducts.js';
import { getPayFastConfig, generatePayFastSignature, verifyPayFastITNSignature } from './server/payfast.js';

console.log('--- RUNNING HYBRID E-COMMERCE PLATFORM AUTOMATED SUITE ---');

// 1. PRODUCT VARIATIONS & STOCK
console.log('\n[TEST 1] Product Variations & Stock Tracking');
assert.ok(INITIAL_PRODUCTS.length >= 10, 'Expected at least 10 products');
for (const p of INITIAL_PRODUCTS) {
  assert.ok(Array.isArray(p.variations), `Product ${p.id} must have variations array`);
  assert.ok(p.variations.length > 0, `Product ${p.id} must have at least 1 variation`);
  assert.ok(p.rating && p.rating >= 4.0, `Product ${p.id} must have rating >= 4.0`);
  assert.ok(p.reviewCount && p.reviewCount > 0, `Product ${p.id} must have reviewCount > 0`);
  assert.ok(Array.isArray(p.relatedProductIds), `Product ${p.id} must have relatedProductIds`);
  for (const v of p.variations) {
    assert.ok(v.size, `Variation must specify size`);
    assert.ok(v.colour, `Variation must specify colour`);
    assert.strictEqual(typeof v.stock, 'number', `Variation stock must be number`);
    assert.ok(v.stock >= 0, `Variation stock must be >= 0`);
  }
}
console.log('✓ All 10 catalog pieces have complete size/colour variations, stock counts, and related outfit pairings.');


// 3. LASS DROPS ARCHIVE & TIMERS
console.log('\n[TEST 3] LASS Drops Collection Management');
const drops = commerceStore.getAllDrops();
assert.ok(drops.length >= 2, 'Expected at least 2 drops');
const harvestDrop = drops.find((d) => d.id === 'drop-2026-harvest');
assert.ok(harvestDrop, '2026 Harvest drop must exist');
assert.strictEqual(harvestDrop.status, 'active', 'Harvest drop should currently be active');

const winterDrop = drops.find((d) => d.id === 'drop-winter-2026');
assert.ok(winterDrop, 'Winter drop must exist');
assert.strictEqual(winterDrop.status, 'scheduled', 'Winter drop should currently be scheduled');
console.log('✓ LASS Drops correctly initialized with live status calculations and countdown dates.');

// 4. 10-STATUS ORDER FULFILMENT LIFECYCLE
console.log('\n[TEST 4] 10-Status Order Fulfilment Lifecycle & Transition Validation');
assert.strictEqual(normalizeOrderStatus('pending_payment'), 'awaiting_payment');
assert.strictEqual(normalizeOrderStatus('dispatched_paxi'), 'dispatched');
assert.strictEqual(normalizeOrderStatus('completed'), 'delivered');

// Valid forward progressions
assert.ok(isValidStatusTransition('awaiting_payment', 'payment_confirmed').valid);
assert.ok(isValidStatusTransition('payment_confirmed', 'processing').valid);
assert.ok(isValidStatusTransition('processing', 'ready_for_dispatch').valid);
assert.ok(isValidStatusTransition('ready_for_dispatch', 'dispatched').valid);
assert.ok(isValidStatusTransition('dispatched', 'out_for_delivery').valid);
assert.ok(isValidStatusTransition('out_for_delivery', 'delivered').valid);

// Cancellation constraints
assert.ok(isValidStatusTransition('processing', 'cancelled').valid);
assert.strictEqual(isValidStatusTransition('dispatched', 'cancelled').valid, false, 'Cannot cancel after dispatch');
assert.strictEqual(isValidStatusTransition('refunded', 'processing').valid, false, 'Cannot resurrect refunded order');
console.log('✓ 10-Status lifecycle transitions verified according to e-commerce fulfillment architecture.');

// 5. CUSTOMER REVIEWS & VERIFIED BUYER BADGE
console.log('\n[TEST 5] Customer Reviews & Verified Buyer Logic');
const approvedReviews = commerceStore.getReviewsForProduct('lass-bw-pocket-01');
assert.ok(approvedReviews.length > 0, 'Expected reviews for lass-bw-pocket-01');
const verifiedRev = approvedReviews.find((r) => r.verifiedPurchase || r.isVerifiedPurchase);
assert.ok(verifiedRev, 'Expected verified buyer review in initial store');

const submitted = commerceStore.submitReview({
  productId: 'lass-bw-pocket-01',
  customerName: 'Kagiso T.',
  rating: 5,
  title: 'Crisp Streetwear Fit',
  comment: 'Heavyweight fabric, twin-needle stitching is rock solid.',
  isVerifiedPurchase: true,
});
assert.strictEqual(submitted.rating, 5);
assert.strictEqual(submitted.isVerifiedPurchase, true);
assert.strictEqual(submitted.status, 'approved');

const reported = commerceStore.reportReview(submitted.id, 'Spam content');
assert.strictEqual(reported, true);
const allAdmin = commerceStore.getAllReviewsAdmin();
const foundReported = allAdmin.find((r) => r.id === submitted.id);
assert.strictEqual(foundReported.status, 'reported');
console.log('✓ Reviews submission, verified buyer validation, and report moderation verified.');

// 6. PAYFAST LIVE PROTECTION & CRYPTOGRAPHY
console.log('\n[TEST 6] PayFast Live Gateways & Signature Integrity');
const liveConfig = getPayFastConfig({ PAYFAST_SANDBOX: 'false', PAYFAST_MERCHANT_ID: '37582031' });
assert.strictEqual(liveConfig.merchantId, '37582031', 'Production Live Merchant ID must be 37582031');
assert.strictEqual(liveConfig.merchantKey, 'afmuiphiwjsed', 'Production Merchant Key must be afmuiphiwjsed');
assert.strictEqual(liveConfig.isSandbox, false, 'Live config must have isSandbox = false');
assert.ok(liveConfig.processUrl.includes('https://www.payfast.co.za/'), 'Production process URL must target live PayFast');

const sandboxConfig = getPayFastConfig({ PAYFAST_SANDBOX: 'true' });
assert.strictEqual(sandboxConfig.merchantId, '10056107', 'Sandbox Merchant ID is 10056107');
assert.strictEqual(sandboxConfig.isSandbox, true, 'Sandbox config must have isSandbox = true');

// Verify MD5 signature generation
const samplePayload = {
  merchant_id: '37582031',
  merchant_key: 'b949j4v8hyj03',
  amount: '400.00',
  item_name: 'LASS Streetwear Piece',
};
const sig = generatePayFastSignature(samplePayload, 'LassBrandTestPass_2026!');
assert.ok(sig && sig.length === 32, 'MD5 signature must be 32 hex chars');

const itnPayload = { ...samplePayload, signature: sig };
assert.ok(verifyPayFastITNSignature(itnPayload, 'LassBrandTestPass_2026!'), 'ITN signature verification must pass');
console.log('✓ PayFast LIVE merchant gateway and cryptographic MD5 security verified.');

console.log('\n======================================================');
console.log('ALL HYBRID E-COMMERCE SUITE TESTS PASSED (5/5 SUITES)');
console.log('======================================================');
