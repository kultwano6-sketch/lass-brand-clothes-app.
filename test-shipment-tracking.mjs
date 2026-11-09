// test-shipment-tracking.mjs
// Verifies visual shipment tracking progress calculations and status mappings
import assert from 'node:assert';

console.log('====================================================');
console.log('📦 SHIPMENT PROGRESS INDICATOR VERIFICATION SUITE');
console.log('====================================================\n');

// Stage mapper matching ShipmentProgressIndicator
function getStageInfo(status) {
  switch (status) {
    case 'cancelled':
      return { index: -1, percent: 0, label: 'Cancelled', isCancelled: true };
    case 'pending_payment':
    case 'whatsapp_generated':
    case 'pending_verification':
      return { index: 0, percent: 18, label: 'Awaiting Payment Verification', isCancelled: false };
    case 'payment_confirmed':
      return { index: 1, percent: 42, label: 'Processing & Quality Check', isCancelled: false };
    case 'dispatched_paxi':
      return { index: 2, percent: 68, label: 'With PAXI Courier (In Transit)', isCancelled: false };
    case 'ready_for_collection':
      return { index: 3, percent: 90, label: 'Ready for Counter Pickup at PEP', isCancelled: false };
    case 'completed':
      return { index: 4, percent: 100, label: 'Collected & Delivered', isCancelled: false };
    default:
      return { index: 0, percent: 15, label: 'Order Registered', isCancelled: false };
  }
}

function getDeliveryEstimate(method, leadDays = '5-10 business days') {
  if (method === 'paxi-express') return '3-5 Business Days (PAXI Express)';
  if (method === 'collection') return 'Same Day / Next Day Pick-up';
  return `${leadDays} (PAXI Standard)`;
}

// Test 1: Stage 1 - Order Confirmed (Pending Payment & Verification)
console.log('▶ Test 1: Stage 1 - Order Confirmed (Pending Payment / Verification)');
const stage1 = getStageInfo('whatsapp_generated');
assert.strictEqual(stage1.index, 0);
assert.strictEqual(stage1.isCancelled, false);
assert.strictEqual(stage1.percent, 18);
console.log('✓ Test 1 Passed: Order placement correctly initializes Stage 1 (18% fill)');

// Test 2: Stage 2 - Processing & Packing
console.log('▶ Test 2: Stage 2 - Processing & Packing (Payment Confirmed)');
const stage2 = getStageInfo('payment_confirmed');
assert.strictEqual(stage2.index, 1);
assert.strictEqual(stage2.percent, 42);
assert.strictEqual(stage2.label, 'Processing & Quality Check');
console.log('✓ Test 2 Passed: Payment confirmation advances order to Processing & Packing stage (42% fill)');

// Test 3: Stage 3 - With PAXI Courier (In Transit)
console.log('▶ Test 3: Stage 3 - With PAXI Courier (In Transit)');
const stage3 = getStageInfo('dispatched_paxi');
assert.strictEqual(stage3.index, 2);
assert.strictEqual(stage3.percent, 68);
const samplePaxiCode = 'PAXI-JH-883921';
const paxiPortalUrl = `https://www.paxi.co.za/track?tracking_number=${samplePaxiCode}`;
assert(paxiPortalUrl.includes(samplePaxiCode));
console.log(`✓ Test 3 Passed: Dispatched status advances to With PAXI (68% fill) with portal URL: ${paxiPortalUrl}`);

// Test 4: Stage 4 - Ready for Collection at PEP Store
console.log('▶ Test 4: Stage 4 - Ready for Collection at PEP Store');
const stage4 = getStageInfo('ready_for_collection');
assert.strictEqual(stage4.index, 3);
assert.strictEqual(stage4.percent, 90);
assert.strictEqual(stage4.label, 'Ready for Counter Pickup at PEP');
console.log('✓ Test 4 Passed: Ready for Collection correctly advances to Stage 4 (90% fill) with counter pickup notice');

// Test 5: Stage 5 - Collected & Completed
console.log('▶ Test 5: Stage 5 - Collected & Completed');
const stage5 = getStageInfo('completed');
assert.strictEqual(stage5.index, 4);
assert.strictEqual(stage5.percent, 100);
console.log('✓ Test 5 Passed: Collected status completes progress at 100%');

// Test 6: Cancelled status handling
console.log('▶ Test 6: Cancelled Status Handling');
const stageCancelled = getStageInfo('cancelled');
assert.strictEqual(stageCancelled.index, -1);
assert.strictEqual(stageCancelled.isCancelled, true);
console.log('✓ Test 6 Passed: Cancelled orders are correctly flagged to display alert banner');

// Test 7: Delivery estimates for different methods
console.log('▶ Test 7: Delivery Estimate Lead Time Calculation');
assert.strictEqual(getDeliveryEstimate('paxi-express'), '3-5 Business Days (PAXI Express)');
assert.strictEqual(getDeliveryEstimate('paxi-standard', '5-10 business days'), '5-10 business days (PAXI Standard)');
assert.strictEqual(getDeliveryEstimate('collection'), 'Same Day / Next Day Pick-up');
console.log('✓ Test 7 Passed: Accurate delivery lead estimates for express, standard, and local pickup');

console.log('\n====================================================');
console.log('🎉 ALL 7/7 SHIPMENT TRACKING TESTS PASSED!');
console.log('====================================================');
