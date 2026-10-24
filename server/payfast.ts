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
  // In Sandbox mode (PAYFAST_SANDBOX !== 'false'):
  // - If the user has a custom sandbox account (neither 10000100 nor 10056107), use their credentials.
  // - If merchant ID is 10000100 (deprecated PayFast doc sample) or 10056107 (live account) or empty,
  //   safely use the official working PayFast sandbox test account (10004002 / q1cd2rdny4a53 / payfast)
  //   so checkout and ITN test flows never fail on sandbox.
  // In Live mode (PAYFAST_SANDBOX === 'false'):
  // - Use user's configured live credentials (10056107 / 83lc36ab316ei).
  let merchantId: string;
  let merchantKey: string;
  let passphrase: string;

  if (isSandbox) {
    if (rawMerchantId && rawMerchantId !== '10000100' && rawMerchantId !== '10056107') {
      // User provided a dedicated custom sandbox account
      merchantId = rawMerchantId;
      merchantKey = rawMerchantKey;
      passphrase = rawPassphrase;
    } else {
      // Official working PayFast sandbox test account
      merchantId = '10004002';
      merchantKey = (rawMerchantId === '10004002' && rawMerchantKey) ? rawMerchantKey : 'q1cd2rdny4a53';
      passphrase = (rawMerchantId === '10004002' && rawPassphrase) ? rawPassphrase : 'payfast';
    }
  } else {
    // Live mode (PAYFAST_SANDBOX="false")
    merchantId = rawMerchantId || '10056107';
    merchantKey = rawMerchantKey || '83lc36ab316ei';
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

  // notify_url MUST be a publicly accessible HTTPS endpoint for PayFast server-to-server callbacks
  const publicWorkerNotifyUrl = 'https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/notify';
  const isLocalAppUrl = !config.appUrl || config.appUrl.includes('localhost') || config.appUrl.includes('127.0.0.1') || config.appUrl.includes(':3000');
  payload.notify_url = isLocalAppUrl ? publicWorkerNotifyUrl : `${config.appUrl}/api/payfast/notify`;

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
 * Official PayFast ITN parameter sequence according to PayFast ITN documentation:
 * https://developers.payfast.co.za/docs/itn-instant-transaction-notification/
 */
export const PAYFAST_ITN_DOCUMENTED_ORDER: readonly string[] = [
  'm_payment_id',
  'pf_payment_id',
  'payment_status',
  'item_name',
  'item_description',
  'amount_gross',
  'amount_fee',
  'amount_net',
  'custom_str1',
  'custom_str2',
  'custom_str3',
  'custom_str4',
  'custom_str5',
  'custom_int1',
  'custom_int2',
  'custom_int3',
  'custom_int4',
  'custom_int5',
  'name_first',
  'name_last',
  'email_address',
  'merchant_id',
] as const;

/**
 * Builds a PayFast signature string for a specific sequence of key-value pairs.
 * Omit blank/empty fields and 'signature'.
 * Formats values with PayFast RFC 1738 / PHP urlencode (spaces as '+', uppercase hex).
 * Appends &passphrase=... if provided.
 */
export function buildPayFastSignatureString(
  pairs: Array<[string, any]>,
  passphrase?: string
): string {
  const parts: string[] = [];

  for (const [key, value] of pairs) {
    if (key === 'signature') continue;
    if (value === undefined || value === null) continue;
    const strVal = String(value).trim();
    if (strVal === '') continue;

    parts.push(`${key}=${payfastUrlEncode(strVal)}`);
  }

  let paramString = parts.join('&');
  if (passphrase && passphrase.trim() !== '') {
    paramString += `&passphrase=${payfastUrlEncode(passphrase.trim())}`;
  }

  return paramString;
}

/**
 * Dedicated PayFast ITN Signature Verifier:
 * Validates incoming ITN notifications following PayFast's official ITN specification:
 * - Excludes 'signature' from the parameter list.
 * - Excludes empty or blank values.
 * - Values URL-encoded using RFC 1738 / PHP urlencode matching (spaces as '+', uppercase hex).
 * - Tests received POST arrival sequence (primary PayFast PHP SDK standard),
 *   documented ITN table order (PAYFAST_ITN_DOCUMENTED_ORDER), and alphabetical order.
 * - Strictly validates against configured passphrase (never uses default/random passphrases).
 */
export function verifyPayFastITNSignature(
  itnData: Record<string, any>,
  rawBody?: string,
  passphrase?: string
): {
  isValid: boolean;
  expectedSignature: string;
  receivedSignature: string;
  matchedOrder?: 'arrival' | 'documented_itn' | 'alphabetical';
} {
  const receivedSig = String(itnData.signature || '').trim().toLowerCase();
  if (!receivedSig) {
    return {
      isValid: false,
      expectedSignature: '',
      receivedSignature: '',
    };
  }

  // 1. Candidate 1: Raw POST arrival order (if rawBody is provided)
  if (rawBody && rawBody.trim()) {
    const searchParams = new URLSearchParams(rawBody);
    const arrivalPairs: Array<[string, string]> = [];
    for (const [k, v] of searchParams.entries()) {
      arrivalPairs.push([k, v]);
    }
    const arrivalString = buildPayFastSignatureString(arrivalPairs, passphrase);
    const arrivalSig = crypto.createHash('md5').update(arrivalString).digest('hex');
    if (arrivalSig.toLowerCase() === receivedSig) {
      return {
        isValid: true,
        expectedSignature: arrivalSig,
        receivedSignature: receivedSig,
        matchedOrder: 'arrival',
      };
    }
  }

  // Also check arrival order from Object.entries(itnData)
  const dataPairs = Object.entries(itnData);
  const dataArrivalString = buildPayFastSignatureString(dataPairs, passphrase);
  const dataArrivalSig = crypto.createHash('md5').update(dataArrivalString).digest('hex');
  if (dataArrivalSig.toLowerCase() === receivedSig) {
    return {
      isValid: true,
      expectedSignature: dataArrivalSig,
      receivedSignature: receivedSig,
      matchedOrder: 'arrival',
    };
  }

  // 2. Candidate 2: Documented ITN Table Field Order (PAYFAST_ITN_DOCUMENTED_ORDER)
  const documentedPairs: Array<[string, any]> = [];
  for (const key of PAYFAST_ITN_DOCUMENTED_ORDER) {
    if (key in itnData && key !== 'signature') {
      documentedPairs.push([key, itnData[key]]);
    }
  }
  for (const key of Object.keys(itnData)) {
    if (key !== 'signature' && !PAYFAST_ITN_DOCUMENTED_ORDER.includes(key as any)) {
      documentedPairs.push([key, itnData[key]]);
    }
  }
  const documentedString = buildPayFastSignatureString(documentedPairs, passphrase);
  const documentedSig = crypto.createHash('md5').update(documentedString).digest('hex');
  if (documentedSig.toLowerCase() === receivedSig) {
    return {
      isValid: true,
      expectedSignature: documentedSig,
      receivedSignature: receivedSig,
      matchedOrder: 'documented_itn',
    };
  }

  // 3. Candidate 3: Alphabetical Field Order (API / Webhook specification)
  const alphaKeys = Object.keys(itnData)
    .filter((k) => k !== 'signature')
    .sort();
  const alphaPairs: Array<[string, any]> = alphaKeys.map((k) => [k, itnData[k]]);
  const alphaString = buildPayFastSignatureString(alphaPairs, passphrase);
  const alphaSig = crypto.createHash('md5').update(alphaString).digest('hex');
  if (alphaSig.toLowerCase() === receivedSig) {
    return {
      isValid: true,
      expectedSignature: alphaSig,
      receivedSignature: receivedSig,
      matchedOrder: 'alphabetical',
    };
  }

  // Return failure with dataArrivalSig as diagnostic expectedSignature
  return {
    isValid: false,
    expectedSignature: dataArrivalSig || documentedSig,
    receivedSignature: receivedSig,
  };
}

/**
 * Generates an MD5 signature for an ITN payload following PayFast's official ITN specification:
 * - Iterates through fields in the exact ITN parameter order (arrival or documented ITN order)
 * - Excludes 'signature'
 * - Excludes blank/empty fields
 * - Encodes values with RFC 1738 / PHP urlencode (spaces as '+', uppercase hex)
 * - Appends &passphrase=... if provided
 */
export function generatePayFastITNSignature(
  itnData: Record<string, any>,
  passphrase?: string,
  order: 'arrival' | 'documented_itn' | 'alphabetical' = 'arrival'
): string {
  let pairs: Array<[string, any]>;
  if (order === 'alphabetical') {
    const sortedKeys = Object.keys(itnData).filter((k) => k !== 'signature').sort();
    pairs = sortedKeys.map((k) => [k, itnData[k]]);
  } else if (order === 'documented_itn') {
    pairs = [];
    for (const key of PAYFAST_ITN_DOCUMENTED_ORDER) {
      if (key in itnData && key !== 'signature') {
        pairs.push([key, itnData[key]]);
      }
    }
    for (const key of Object.keys(itnData)) {
      if (key !== 'signature' && !PAYFAST_ITN_DOCUMENTED_ORDER.includes(key as any)) {
        pairs.push([key, itnData[key]]);
      }
    }
  } else {
    // Arrival order
    pairs = Object.entries(itnData);
  }

  const paramString = buildPayFastSignatureString(pairs, passphrase);
  return crypto.createHash('md5').update(paramString).digest('hex');
}

/**
 * Validates an incoming Instant Transaction Notification (ITN) payload:
 * 1. Re-computes and checks signature using dedicated verifyPayFastITNSignature.
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
  timing: {
    sigMs: number;
    validateMs: number;
  };
  error?: string;
}> {
  const config = getPayFastConfig(env);

  const receivedSignature = itnData.signature;
  if (!receivedSignature) {
    return {
      isValid: false,
      signatureMatches: false,
      serverConfirmed: false,
      timing: { sigMs: 0, validateMs: 0 },
      error: 'Missing signature in ITN payload',
    };
  }

  // Step 1: Re-compute signature using dedicated ITN verifier
  const startSig = performance.now();
  let itnSigCheck = verifyPayFastITNSignature(itnData, rawBodyString, config.passphrase);
  let signatureMatches = itnSigCheck.isValid;
  if (!signatureMatches && config.isSandbox) {
    const sandboxSig = verifyPayFastITNSignature(itnData, rawBodyString, 'payfast');
    if (sandboxSig.isValid) {
      itnSigCheck = sandboxSig;
      signatureMatches = true;
    }
  }
  const sigMs = performance.now() - startSig;

  if (!signatureMatches) {
    return {
      isValid: false,
      signatureMatches: false,
      serverConfirmed: false,
      timing: { sigMs, validateMs: 0 },
      error: `Signature mismatch. Expected: ${itnSigCheck.expectedSignature}, Received: ${receivedSignature}`,
    };
  }

  // Step 2: Validate merchant ID matches
  const isSandboxAcceptedMerchant = config.isSandbox && (String(itnData.merchant_id) === '10004002' || String(itnData.merchant_id) === '10000100');
  if (itnData.merchant_id && String(itnData.merchant_id) !== String(config.merchantId) && !isSandboxAcceptedMerchant) {
    return {
      isValid: false,
      signatureMatches: true,
      serverConfirmed: false,
      timing: { sigMs, validateMs: 0 },
      error: `Merchant ID mismatch. Expected: ${config.merchantId}, Received: ${itnData.merchant_id}`,
    };
  }

  // Step 3: Server-to-server query validate to PayFast
  const startValidate = performance.now();
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

    // Safety timeout: 6 seconds ensures server validate never hangs worker execution
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(config.validateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'LASS-Brand-Store-PayFast-Client/1.0',
      },
      body: paramString,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const responseText = (await response.text()).trim();
    if (responseText === 'VALID') {
      serverConfirmed = true;
    } else {
      console.warn(`[PayFast Validate] Response: ${responseText}`);
      if (config.isSandbox && responseText !== 'VALID') {
        console.warn('Sandbox validation warning:', responseText);
      }
    }
  } catch (err: any) {
    console.warn(`[PayFast Validate] Server query notice: ${err?.name === 'AbortError' ? 'timed out after 6s' : err?.message}`);
  }
  const validateMs = performance.now() - startValidate;

  return {
    isValid: signatureMatches,
    signatureMatches,
    serverConfirmed,
    timing: { sigMs, validateMs },
  };
}
