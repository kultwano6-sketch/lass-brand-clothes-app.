import { CartItem, OrderCustomerDetails } from '../types';

/**
 * Normalizes South African phone numbers to international format (27...)
 * e.g., "0664412203" -> "27664412203"
 * "084 767 8287" -> "27847678287"
 * "+27664412203" -> "27664412203"
 */
export function normalizeWhatsAppNumber(rawNumber: string): string {
  const digitsOnly = rawNumber.replace(/\D/g, '');
  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    return '27' + digitsOnly.slice(1);
  }
  if (digitsOnly.startsWith('27')) {
    return digitsOnly;
  }
  return digitsOnly || '27664412203';
}

export function formatZAR(amount?: number | null): string {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : Number(amount) || 0;
  return `R${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
}

export function generateOrderReference(): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `LASS-${randomSuffix}`;
}

export function generateWhatsAppOrderMessage({
  orderRef,
  customer,
  items,
  subtotal,
  deliveryFee,
  total,
  brandTagline = 'HARVEST KE LASS',
}: {
  orderRef: string;
  customer: OrderCustomerDetails;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  brandTagline?: string;
}): string {
  const deliveryLabel =
    customer.deliveryMethod === 'paxi-standard'
      ? 'PAXI Standard PEP Collection (5-10 business days)'
      : customer.deliveryMethod === 'paxi-express'
      ? 'PAXI Express PEP Collection (3-5 business days)'
      : 'Local Pickup / Free Collection';

  const itemsList = items
    .map((item, idx) => {
      const lineTotal = item.product.price * item.quantity;
      return `${idx + 1}. *${item.product.name}*\n   • Size: ${item.selectedSize}\n   • Colour: ${item.selectedColour}\n   • Qty: ${item.quantity}\n   • Subtotal: ${formatZAR(lineTotal)}`;
    })
    .join('\n\n');

  const message = [
    `🛍️ *NEW ORDER ENQUIRY — LASS BRAND CLOTHES*`,
    `Ref: *#${orderRef}*`,
    `Brand Ethos: _"${brandTagline}"_`,
    `───────────────────────`,
    `👤 *CUSTOMER DETAILS*`,
    `• Name: ${customer.fullName}`,
    `• Phone / WhatsApp: ${customer.phoneOrWhatsApp}`,
    customer.email ? `• Email: ${customer.email}` : '',
    `• Delivery Option: ${deliveryLabel}`,
    customer.pepStoreBranch ? `• PEP Store / PAXI Point: ${customer.pepStoreBranch}` : '',
    customer.deliveryAddress ? `• Physical Address: ${customer.deliveryAddress}` : '',
    customer.customerNote ? `• Note / Instructions: ${customer.customerNote}` : '',
    `───────────────────────`,
    `📦 *ITEMS ORDERED (${items.reduce((s, i) => s + i.quantity, 0)} items)*`,
    itemsList,
    `───────────────────────`,
    `💰 *ORDER ESTIMATE*`,
    `• Products Subtotal: ${formatZAR(subtotal)}`,
    `• Estimated PAXI / Delivery: ${formatZAR(deliveryFee)}`,
    `• *Total To Arrange: ${formatZAR(total)}*`,
    `───────────────────────`,
    `⚠️ *IMPORTANT NOTICE:*`,
    `Sending this message is an order request and does not constitute proof of payment or confirmed fulfilment. The brand owner will verify stock and provide banking/EFT/payment details manually.`,
  ]
    .filter(Boolean)
    .join('\n');

  return message;
}

export function buildWhatsAppLink(phoneNumber: string, messageText: string): string {
  const normalized = normalizeWhatsAppNumber(phoneNumber);
  const encodedText = encodeURIComponent(messageText);
  return `https://wa.me/${normalized}?text=${encodedText}`;
}

export function generateEmailOrderDraft({
  orderRef,
  customer,
  items,
  subtotal,
  deliveryFee,
  total,
  brandName = 'LASS Brand Clothes',
  brandEmail = 'orders@lassbrandclothes.co.za',
}: {
  orderRef: string;
  customer: OrderCustomerDetails;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  brandName?: string;
  brandEmail?: string;
}): { subject: string; body: string; mailtoUrl: string } {
  const subject = `Order Enquiry #${orderRef} — ${brandName} (${customer.fullName})`;
  const deliveryLabel =
    customer.deliveryMethod === 'paxi-standard'
      ? 'PAXI Standard PEP Collection (5-10 business days)'
      : customer.deliveryMethod === 'paxi-express'
      ? 'PAXI Express PEP Collection (3-5 business days)'
      : 'Local Pickup / Free Collection';

  const itemsList = items
    .map((item, idx) => {
      const lineTotal = item.product.price * item.quantity;
      return `${idx + 1}. ${item.product.name}\n   - Size: ${item.selectedSize}\n   - Colour: ${item.selectedColour}\n   - Qty: ${item.quantity}\n   - Price: ${formatZAR(lineTotal)}`;
    })
    .join('\n\n');

  const body = [
    `ORDER SUBMISSION RECORD — ${brandName.toUpperCase()}`,
    `Order Reference: #${orderRef}`,
    `Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    `========================================`,
    `CUSTOMER DETAILS:`,
    `Name: ${customer.fullName}`,
    `Contact / WhatsApp: ${customer.phoneOrWhatsApp}`,
    customer.email ? `Email: ${customer.email}` : '',
    `Delivery Method: ${deliveryLabel}`,
    customer.pepStoreBranch ? `PEP Store / PAXI Counter: ${customer.pepStoreBranch}` : '',
    customer.deliveryAddress ? `Physical Address: ${customer.deliveryAddress}` : '',
    customer.customerNote ? `Customer Note: ${customer.customerNote}` : '',
    `========================================`,
    `ORDERED ITEMS:`,
    itemsList,
    `========================================`,
    `FINANCIAL ESTIMATE:`,
    `Subtotal: ${formatZAR(subtotal)}`,
    `PAXI / Delivery Fee: ${formatZAR(deliveryFee)}`,
    `ESTIMATED TOTAL TO ARRANGE: ${formatZAR(total)}`,
    `========================================`,
    `NEXT STEPS:`,
    `This order record was created via the LASS Brand Clothes shopping app.`,
    `The brand owner will verify size and garment stock availability before payment (EFT / cash) is completed.`,
    `Owner WhatsApp: 066 441 2203 | Alt Call: 084 767 8287`,
  ]
    .filter(Boolean)
    .join('\n');

  const targetEmail = customer.email ? customer.email : brandEmail;
  const ccParam = customer.email && brandEmail ? `&cc=${encodeURIComponent(brandEmail)}` : '';
  const mailtoUrl = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}${ccParam}`;

  return { subject, body, mailtoUrl };
}
