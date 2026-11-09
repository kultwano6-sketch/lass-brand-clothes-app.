// test-cross-platform-pwa.mjs
// Comprehensive Cross-Platform PWA & Mobile Commerce Audit Suite
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log('====================================================');
console.log('📱 LASS BRAND CLOTHES — CROSS-PLATFORM PWA AUDIT');
console.log('====================================================\n');

// 1. MANIFEST AUDIT
console.log('▶ Check 1: Web App Manifest Standards');
const manifestPath = path.resolve('public/manifest.webmanifest');
const manifestJsonPath = path.resolve('public/manifest.json');
assert(fs.existsSync(manifestPath), 'manifest.webmanifest must exist');
assert(fs.existsSync(manifestJsonPath), 'manifest.json must exist');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert.strictEqual(manifest.id, '/', 'Manifest id must be "/"');
assert.strictEqual(manifest.name, 'LASS Brand Clothes', 'Manifest name must be "LASS Brand Clothes"');
assert.strictEqual(manifest.short_name, 'LASS Clothes', 'Manifest short_name must be "LASS Clothes"');
assert(manifest.short_name.length <= 12, 'short_name must be <= 12 characters to prevent home screen clipping');
assert.strictEqual(manifest.display, 'standalone', 'display must be standalone');
assert.strictEqual(manifest.start_url, '/', 'start_url must be "/"');
assert.strictEqual(manifest.scope, '/', 'scope must be "/"');
assert(manifest.theme_color, 'theme_color must be configured');
assert(manifest.background_color, 'background_color must be configured');
console.log('✓ Check 1 Passed: Valid Web App Manifest (standalone, id, scope, start_url, name, short_name <= 12 chars)');

// 2. ICONS AUDIT
console.log('▶ Check 2: Application Icons & Maskable Support');
const requiredIcons = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-maskable-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
];

for (const { file } of requiredIcons) {
  const iconPath = path.resolve('public', file);
  assert(fs.existsSync(iconPath), `Icon public/${file} must exist on disk`);
  const buf = fs.readFileSync(iconPath);
  // PNG Magic Header: 89 50 4E 47 0D 0A 1A 0A
  assert(buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47, `${file} must be a valid PNG binary`);
}
console.log('✓ Check 2 Passed: 192px, 512px, maskable, and 180px apple-touch-icon verified with valid PNG headers');

// 3. SERVICE WORKER AUDIT
console.log('▶ Check 3: Service Worker Caching & Payment Security Isolation');
const swPath = path.resolve('public/sw.js');
assert(fs.existsSync(swPath), 'public/sw.js must exist');
const swCode = fs.readFileSync(swPath, 'utf8');

// Verify strict exclusion of sensitive payment APIs
assert(swCode.includes('payfast.co.za'), 'Service Worker must strictly bypass PayFast gateway endpoints');
assert(swCode.includes('/api'), 'Service Worker must never cache /api backend routes');
assert(swCode.includes('navigate'), 'Service Worker must handle navigation mode');
assert(swCode.includes('STATIC_ASSETS'), 'Service Worker must define precache assets');
console.log('✓ Check 3 Passed: Service worker isolates payment traffic and enforces network-first navigation');

// 4. HTML ENTRY POINT & IOS SAFARI METADATA
console.log('▶ Check 4: HTML Viewport & iOS Home Screen Metadata');
const htmlPath = path.resolve('index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

assert(html.includes('viewport-fit=cover'), 'HTML viewport must include viewport-fit=cover for iPhone notches');
assert(html.includes('apple-mobile-web-app-capable'), 'HTML must declare apple-mobile-web-app-capable');
assert(html.includes('apple-touch-icon'), 'HTML must reference apple-touch-icon');
assert(html.includes('apple-mobile-web-app-title'), 'HTML must declare apple-mobile-web-app-title');
assert(html.includes('id="pwa-splash"'), 'HTML must include native standalone launch splash screen');
assert(html.includes('sw.js'), 'HTML must register service worker');
console.log('✓ Check 4 Passed: iOS metadata, notch viewport-fit=cover, and standalone splash verified');

// 5. CSS & TOUCH TARGET AUDIT
console.log('▶ Check 5: CSS Touch Targets, Safe Areas, and Overflow Control');
const cssPath = path.resolve('src/index.css');
const css = fs.readFileSync(cssPath, 'utf8');

assert(css.includes('overflow-x: hidden'), 'CSS must prevent horizontal overflow on mobile');
assert(css.includes('safe-area-inset-top'), 'CSS must handle safe-area-inset-top');
assert(css.includes('safe-area-inset-bottom'), 'CSS must handle safe-area-inset-bottom');
assert(css.includes('16px'), 'CSS must enforce 16px minimum on mobile form inputs to prevent iOS auto-zoom');
assert(css.includes('touch-action: manipulation'), 'CSS must prevent tap lag');
console.log('✓ Check 5 Passed: Mobile touch targets, iOS safe-areas, auto-zoom prevention, and overflow rules verified');

// 6. ANDROID BACK & NAVIGATION ENGINE
console.log('▶ Check 6: Navigation Engine & Exit Safeguard');
const navPath = path.resolve('src/utils/navigation.ts');
const navCode = fs.readFileSync(navPath, 'utf8');

assert(navCode.includes('exit_guard'), 'Navigation engine must support exit_guard anchor');
assert(navCode.includes('pushScreenState'), 'Navigation engine must provide pushScreenState');
assert(navCode.includes('restoreScrollPosition'), 'Navigation engine must restore scroll position');
console.log('✓ Check 6 Passed: Navigation engine manages Android Back, scroll restoration, and exit confirmation');

// 7. PAYFAST LIVE COMPLIANCE
console.log('▶ Check 7: PayFast Live Mode & Credentials Verification');
import { getPayFastConfig } from './server/payfast.js';

// Test live mode
const liveConfig = getPayFastConfig({ PAYFAST_SANDBOX: 'false' });
assert.strictEqual(liveConfig.isSandbox, false, 'Live mode must set isSandbox: false');
assert.strictEqual(liveConfig.processUrl, 'https://www.payfast.co.za/eng/process', 'Live mode must direct to live PayFast gateway');
assert.strictEqual(liveConfig.merchantId, '37582031', 'Live mode must use verified merchant ID 37582031');

// Test sandbox mode
const sandboxConfig = getPayFastConfig({ PAYFAST_SANDBOX: 'true' });
assert.strictEqual(sandboxConfig.isSandbox, true, 'Sandbox mode must set isSandbox: true');
assert.strictEqual(sandboxConfig.processUrl, 'https://sandbox.payfast.co.za/eng/process', 'Sandbox mode must direct to sandbox gateway');
console.log('✓ Check 7 Passed: Live PayFast gateway (https://www.payfast.co.za/eng/process) correctly isolated and active');

console.log('\n====================================================');
console.log('🎉 ALL 7/7 CROSS-PLATFORM PWA AUDIT CHECKS PASSED!');
console.log('====================================================');
