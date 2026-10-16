import { formatZAR } from './whatsapp';

export type PaymentMethodType = 'payfast' | 'card' | 'instant_eft' | 'snapscan' | 'manual_eft' | 'whatsapp';

export interface BankOption {
  id: string;
  name: string;
  shortName: string;
  color: string;
  accent: string;
  popular?: boolean;
}

export const SA_BANKS: BankOption[] = [
  { id: 'capitec', name: 'Capitec Bank (Capitec Pay)', shortName: 'Capitec', color: 'bg-sky-700', accent: '#0070BA', popular: true },
  { id: 'fnb', name: 'First National Bank (FNB)', shortName: 'FNB', color: 'bg-emerald-700', accent: '#00857C', popular: true },
  { id: 'standard', name: 'Standard Bank', shortName: 'Standard', color: 'bg-blue-800', accent: '#0033A0', popular: true },
  { id: 'nedbank', name: 'Nedbank', shortName: 'Nedbank', color: 'bg-emerald-800', accent: '#005A36' },
  { id: 'absa', name: 'Absa Bank', shortName: 'Absa', color: 'bg-rose-800', accent: '#AF002A' },
  { id: 'tymebank', name: 'TymeBank', shortName: 'Tyme', color: 'bg-amber-600', accent: '#FF9E1B' },
  { id: 'discovery', name: 'Discovery Bank', shortName: 'Discovery', color: 'bg-indigo-900', accent: '#1F3A60' },
  { id: 'african_bank', name: 'African Bank', shortName: 'African', color: 'bg-teal-800', accent: '#007A3D' },
];

export const LASS_BANKING_DETAILS = {
  accountHolder: 'LASS Brand Clothes',
  bankName: 'Capitec Business / FNB Corporate',
  accountNumber: '1052 849 201',
  accountType: 'Cheque / Current Account',
  branchCode: '470010',
  swiftCode: 'CAPIZAJJ',
};

export function generateTransactionId(): string {
  const chars = '0123456789ABCDEF';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TXN-LASS-${rand}`;
}

export function generatePaxiTrackingCode(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `PAXI-ZA-${num}`;
}

export function detectCardBrand(number: string): 'visa' | 'mastercard' | 'amex' | 'generic' {
  const cleaned = number.replace(/\D/g, '');
  if (/^4/.test(cleaned)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(cleaned)) return 'mastercard';
  if (/^3[47]/.test(cleaned)) return 'amex';
  return 'generic';
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ');
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  return digits;
}

export function validateLuhn(numStr: string): boolean {
  const digits = numStr.replace(/\D/g, '');
  if (digits.length < 13) return false;
  let sum = 0;
  let isSecond = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits.charAt(i), 10);
    if (isSecond) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    isSecond = !isSecond;
  }
  return sum % 10 === 0;
}
