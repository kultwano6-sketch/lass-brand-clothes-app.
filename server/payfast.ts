import crypto from 'node:crypto';

export interface PayFastEnv {
  PAYFAST_MERCHANT_ID?: string;
  PAYFAST_MERCHANT_KEY?: string;
  PAYFAST_PASSPHRASE?: string;
  PAYFAST_SANDBOX?: string;
  APP_URL?: string;
  PUBLIC_APP_URL?: string;
}

export interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase?: string;
  isSandbox: boolean;
  processUrl: string;
  validateUrl: string;
  appUrl: string;
}

export function getPayFastConfig(env?: PayFastEnv): PayFastConfig {
  const e: PayFastEnv = env || (typeof process !== 'undefined' ? (process.env as PayFastEnv) : {}) || {};
  const isSandbox = e.PAYFAST_SANDBOX !== 'false';

  const rawMerchantId = e.PAYFAST_MERCHANT_ID !== undefined && e.PAYFAST_MERCHANT_ID !== null
    ? String(e.PAYFAST_MERCHANT_ID).trim()
    : '';
  const rawMerchantKey = e.PAYFAST_MERCHANT_KEY !== undefined && e.PAYFAST_MERCHANT_KEY !== null
    ? String(e.PAYFAST_MERCHANT_KEY).trim()
    : '';
  const rawPassphrase = e.PAYFAST_PASSPHRASE !== undefined && e.PAYFAST_PASSPHRASE !== null
    ? String(e.PAYFAST_PASSPHRASE).trim()
    : '';

  // Determine merchant credentials:
  // If the user configured PAYFAST_MERCHANT_ID, ALWAYS use the user's configured credentials and passphrase directly!
  // NEVER silently override or substitute shared sandbox defaults when user credentials are provided.
  let merchantId: string;
  let merchantKey: string;
  let passphrase: string;

  if (rawMerchantId) {
    // User-configured credentials (Sandbox or Live)
    merchantId = rawMerchantId;
    merchantKey = rawMerchantKey;
    passphrase = rawPassphrase;
  } else if (isSandbox) {
    // Fallback ONLY when PAYFAST_MERCHANT_ID is completely absent in sandbox mode
    merchantId = '10004002';
    merchantKey = rawMerchantKey || 'q1cd2rdny4a53';
    passphrase = rawPassphrase || 'payfast';
  } else {
    // Live mode without merchant ID
    merchantId = '';
    merchantKey = rawMerchantKey;
    passphrase = rawPassphrase;
  }

  const appUrl = e.APP_URL || e.PUBLIC_APP_URL || 'http://localhost:3000';

  const baseUrl = isSandbox
    ? 'https://sandbox.payfast.co.za'
    : 'https://www.payfast.co.za';

  return {
    merchantId,
    merchantKey,
    passphrase,
    isSandbox,
    processUrl: `${baseUrl}/eng/process`,
    validateUrl: `${baseUrl}/eng/query/validate`,
    appUrl: appUrl.replace(/\/+$/, ''),
  };
}

/**
 * Official PayFast Custom Integration attribute sequence according to
 * PayFast developer documentation ("Step 1: Create your checkout form"):
 * https://developers.payfast.co.za/docs#step_1_form_fields
 *
 * NOTE: The PayFast custom payment signature requires this exact field sequence
 * and MUST NOT be confused with the API's alphabetical signature!
 */
export const PAYFAST_DOCUMENTED_ORDER: readonly string[] = [
  // 1. Merchant details
  'merchant_id',
  'merchant_key',
  'return_url',
  'cancel_url',
  'notify_url',
  'fica_idnumber',
  // 2. Customer details (Buyer details)
  'name_first',
  'name_last',
  'email_address',
  'cell_number',
  // 3. Transaction details
  'm_payment_id',
  'amount',
  'item_name',
  'item_description',
  'custom_int1',
  'custom_int2',
  'custom_int3',
  'custom_int4',
  'custom_int5',
  'custom_str1',
  'custom_str2',
  'custom_str3',
  'custom_str4',
  'custom_str5',
  // 4. Transaction options
  'email_confirmation',
  'confirmation_address',
  // 5. Payment methods
  'payment_method',
  // 6. Subscriptions / recurring billing
  'subscription_type',
  'billing_date',
  'recurring_amount',
  'frequency',
  'cycles',
] as const;

/**
 * Standard RFC 1738 application/x-www-form-urlencoded matching PHP's urlencode()
 * which PayFast's backend uses to calculate and verify signatures:
 * - Spaces encoded as '+'
 * - Uppercase hex (%2F, %3A, %28, %29, %21, %27, %2A, %7E, etc.)
 * - Characters left unencoded by standard JS encodeURIComponent (! ' ( ) * ~) are properly percent-encoded
 */
export function payfastUrlEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/[!'()*~]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%[0-9a-f]{2}/gi, (match) => match.toUpperCase());
}

/**
 * Generates PayFast MD5 signature adhering strictly to official PayFast documentation:
 * 1. Filter out empty/blank fields and 'signature'.
 * 2. Order variables in the documented payment-field sequence.
 * 3. URL-encode values using uppercase percent-encoding and '+' for spaces (matching PHP urlencode).
 * 4. Concatenate key=value pairs with '&'.
 * 5. Append '&passphrase=' with encoded passphrase if provided.
 * 6. Compute MD5 hash in lowercase hex.
 */
export function generatePayFastSignature(
  data: Record<string, any>,
  passphrase?: string
): string {
  let pfOutput = '';

  // Order fields strictly according to PayFast's official attributes description
  const orderedKeys: string[] = [];
  for (const key of PAYFAST_DOCUMENTED_ORDER) {
    if (key in data && key !== 'signature') {
      orderedKeys.push(key);
    }
  }

  // Append any other fields present in data (excluding signature) that were not in standard list (e.g. ITN fields)
  for (const key of Object.keys(data)) {
    if (key !== 'signature' && !orderedKeys.includes(key)) {
      orderedKeys.push(key);
    }
  }

  for (const key of orderedKeys) {
    const val = data[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      const stringVal = String(val).trim();
      const encodedVal = payfastUrlEncode(stringVal);
      pfOutput += `${key}=${encodedVal}&`;
    }
  }

  // Remove trailing ampersand
  let paramString = pfOutput.slice(0, -1);

  if (passphrase && passphrase.trim()) {
    const encodedPass = payfastUrlEncode(passphrase.trim());
    paramString += `&passphrase=${encodedPass}`;
  }

  return crypto.createHash('md5').update(paramString).digest('hex');
}

/**
 * Prepares the complete PayFast hosted checkout payload for an order.
 * Kept strictly server-side so merchant credentials and passphrases are NEVER leaked to client.
 * Fields follow the exact sequence defined in PayFast's official Custom Integration specification,
 * with no empty/blank values emitted.
 */
export function createHostedCheckoutPayload(
  params: {
    orderNumber: string;
    amount: number;
    itemName: string;
    itemDescription?: string;
    nameFirst: string;
    nameLast?: string;
    emailAddress: string;
    cellNumber?: string;
    customStr1?: string;
    customStr2?: string;
  },
  env?: PayFastEnv
) {
  const config = getPayFastConfig(env);

  // PayFast accepts standard fields in strict sequence
  const payload: Record<string, string> = {};

  // 1. Merchant Details
  payload.merchant_id = config.merchantId;
  payload.merchant_key = config.merchantKey;

  // 2. Transaction Options / URLs
  payload.return_url = `${config.appUrl}/payment/return?orderId=${encodeURIComponent(
    params.orderNumber.trim()
  )}`;
  payload.cancel_url = `${config.appUrl}/payment/cancel?orderId=${encodeURIComponent(
    params.orderNumber.trim()
  )}`;
  payload.notify_url = `${config.appUrl}/api/payfast/notify`;

  // 3. Buyer Details (in exact PayFast sequence, only non-blank values)
  const firstName = params.nameFirst.trim();
  if (firstName) {
    payload.name_first = firstName;
  }

  const lastName = (params.nameLast || '').trim();
  if (lastName) {
    payload.name_last = lastName;
  }

  const email = params.emailAddress.trim();
  if (email) {
    payload.email_address = email;
  }

  if (params.cellNumber) {
    const cleanCell = params.cellNumber.replace(/\D/g, '');
    if (cleanCell) {
      payload.cell_number = cleanCell;
    }
  }

  // 4. Transaction Details (in exact PayFast sequence, only non-blank values)
  payload.m_payment_id = params.orderNumber.trim();
  payload.amount = params.amount.toFixed(2);
  payload.item_name = params.itemName.slice(0, 100).trim();

  if (params.itemDescription && params.itemDescription.trim()) {
    payload.item_description = params.itemDescription.slice(0, 255).trim();
  }

  if (params.customStr1 && params.customStr1.trim()) {
    payload.custom_str1 = params.customStr1.slice(0, 255).trim();
  }

  if (params.customStr2 && params.customStr2.trim()) {
    payload.custom_str2 = params.customStr2.slice(0, 255).trim();
  }

  // 5. Signature (calculated over all non-empty fields in strict order + passphrase)
  payload.signature = generatePayFastSignature(payload, config.passphrase);

  return {
    processUrl: config.processUrl,
    isSandbox: config.isSandbox,
    payload,
  };
}

/**
 * Validates an incoming Instant Transaction Notification (ITN) payload:
 * 1. Re-computes and checks signature.
 * 2. Validates parameters against merchant settings.
 * 3. Calls PayFast server-to-server validation endpoint to confirm authenticity.
 */
export async function verifyPayFastITN(
  itnData: Record<string, any>,
  rawBodyString?: string,
  env?: PayFastEnv
): Promise<{
  isValid: boolean;
  signatureMatches: boolean;
  serverConfirmed: boolean;
  error?: string;
}> {
  const config = getPayFastConfig(env);

  const receivedSignature = itnData.signature;
  if (!receivedSignature) {
    return {
      isValid: false,
      signatureMatches: false,
      serverConfirmed: false,
      error: 'Missing signature in ITN payload',
    };
  }

  // Step 1: Re-compute signature
  const expectedSignature = generatePayFastSignature(itnData, config.passphrase);
  const signatureMatches =
    expectedSignature.toLowerCase() === String(receivedSignature).toLowerCase();

  if (!signatureMatches) {
    return {
      isValid: false,
      signatureMatches: false,
      serverConfirmed: false,
      error: `Signature mismatch. Expected: ${expectedSignature}, Received: ${receivedSignature}`,
    };
  }

  // Step 2: Validate merchant ID matches
  if (itnData.merchant_id && String(itnData.merchant_id) !== String(config.merchantId)) {
    return {
      isValid: false,
      signatureMatches: true,
      serverConfirmed: false,
      error: `Merchant ID mismatch. Expected: ${config.merchantId}, Received: ${itnData.merchant_id}`,
    };
  }

  // Step 3: Server-to-server query validate to PayFast
  let serverConfirmed = false;
  try {
    let paramString = rawBodyString;
    if (!paramString) {
      const parts: string[] = [];
      for (const key of Object.keys(itnData)) {
        const val = itnData[key];
        if (val !== undefined && val !== null) {
          parts.push(
            `${key}=${encodeURIComponent(String(val).trim()).replace(/%20/g, '+')}`
          );
        }
      }
      paramString = parts.join('&');
    }

    const response = await fetch(config.validateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'LASS-Brand-Store-PayFast-Client/1.0',
      },
      body: paramString,
    });

    const responseText = (await response.text()).trim();
    if (responseText === 'VALID') {
      serverConfirmed = true;
    } else {
      console.warn(`PayFast validate query responded: ${responseText}`);
      if (config.isSandbox && responseText !== 'VALID') {
        console.warn('Sandbox validation warning:', responseText);
      }
    }
  } catch (err: any) {
    console.error('Error during PayFast server-to-server validate query:', err);
  }

  return {
    isValid: signatureMatches,
    signatureMatches,
    serverConfirmed,
  };
}
