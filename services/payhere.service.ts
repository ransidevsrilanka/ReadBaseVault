// Powered by OnSpace.AI
// PayHere payment service — expo-web-browser based checkout (SFSafariViewController / Chrome Custom Tab)
// No domain verification needed — native browser context is trusted by PayHere

import { supabase } from './supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import { PAYHERE_MC_ID as CFG_MC_ID, PAYHERE_MC_SECRET as CFG_MC_SECRET } from '@/constants/config';
export const PAYHERE_MERCHANT_ID = CFG_MC_ID;
export const PAYHERE_MERCHANT_SECRET = CFG_MC_SECRET;
export const PAYHERE_SANDBOX = false;

// ─── Credit Rules ──────────────────────────────────────────────────────────
export const CREDIT_MIN = 50;
export const CREDIT_MAX = 50000;
export const CREDIT_STEP = 50;
export const CREDIT_PRICE_PER_UNIT = 1; // 1 credit = 1 LKR

export function snapToGrid(value: number): number {
  const snapped = Math.round(value / CREDIT_STEP) * CREDIT_STEP;
  return Math.min(CREDIT_MAX, Math.max(CREDIT_MIN, snapped));
}

export type PayHerePaymentType = 'print' | 'ai_credits';

export interface AICreditPackage {
  id: string;
  label: string;
  credits: number;
  price: number;
}

// ─── Pure-JS MD5 ──────────────────────────────────────────────────────────
function md5(input: string): string {
  function safeAdd(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRotateLeft(num: number, cnt: number): number {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function md5blks(s: string): number[] {
    const nblk = ((s.length + 8) >> 6) + 1;
    const blks: number[] = new Array(nblk * 16).fill(0);
    for (let i = 0; i < s.length; i++) {
      blks[i >> 2] |= s.charCodeAt(i) << ((i % 4) * 8);
    }
    blks[s.length >> 2] |= 0x80 << ((s.length % 4) * 8);
    blks[nblk * 16 - 2] = s.length * 8;
    return blks;
  }
  const x = md5blks(input);
  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
  for (let i = 0; i < x.length; i += 16) {
    const olda = a, oldb = b, oldc = c, oldd = d;
    a = md5ff(a, b, c, d, x[i], 7, -680876936); d = md5ff(d, a, b, c, x[i+1], 12, -389564586);
    c = md5ff(c, d, a, b, x[i+2], 17, 606105819); b = md5ff(b, c, d, a, x[i+3], 22, -1044525330);
    a = md5ff(a, b, c, d, x[i+4], 7, -176418897); d = md5ff(d, a, b, c, x[i+5], 12, 1200080426);
    c = md5ff(c, d, a, b, x[i+6], 17, -1473231341); b = md5ff(b, c, d, a, x[i+7], 22, -45705983);
    a = md5ff(a, b, c, d, x[i+8], 7, 1770035416); d = md5ff(d, a, b, c, x[i+9], 12, -1958414417);
    c = md5ff(c, d, a, b, x[i+10], 17, -42063); b = md5ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5ff(a, b, c, d, x[i+12], 7, 1804603682); d = md5ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5ff(c, d, a, b, x[i+14], 17, -1502002290); b = md5ff(b, c, d, a, x[i+15], 22, 1236535329);
    a = md5gg(a, b, c, d, x[i+1], 5, -165796510); d = md5gg(d, a, b, c, x[i+6], 9, -1069501632);
    c = md5gg(c, d, a, b, x[i+11], 14, 643717713); b = md5gg(b, c, d, a, x[i], 20, -373897302);
    a = md5gg(a, b, c, d, x[i+5], 5, -701558691); d = md5gg(d, a, b, c, x[i+10], 9, 38016083);
    c = md5gg(c, d, a, b, x[i+15], 14, -660478335); b = md5gg(b, c, d, a, x[i+4], 20, -405537848);
    a = md5gg(a, b, c, d, x[i+9], 5, 568446438); d = md5gg(d, a, b, c, x[i+14], 9, -1019803690);
    c = md5gg(c, d, a, b, x[i+3], 14, -187363961); b = md5gg(b, c, d, a, x[i+8], 20, 1163531501);
    a = md5gg(a, b, c, d, x[i+13], 5, -1444681467); d = md5gg(d, a, b, c, x[i+2], 9, -51403784);
    c = md5gg(c, d, a, b, x[i+7], 14, 1735328473); b = md5gg(b, c, d, a, x[i+12], 20, -1926607734);
    a = md5hh(a, b, c, d, x[i+5], 4, -378558); d = md5hh(d, a, b, c, x[i+8], 11, -2022574463);
    c = md5hh(c, d, a, b, x[i+11], 16, 1839030562); b = md5hh(b, c, d, a, x[i+14], 23, -35309556);
    a = md5hh(a, b, c, d, x[i+1], 4, -1530992060); d = md5hh(d, a, b, c, x[i+4], 11, 1272893353);
    c = md5hh(c, d, a, b, x[i+7], 16, -155497632); b = md5hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = md5hh(a, b, c, d, x[i+13], 4, 681279174); d = md5hh(d, a, b, c, x[i], 11, -358537222);
    c = md5hh(c, d, a, b, x[i+3], 16, -722521979); b = md5hh(b, c, d, a, x[i+6], 23, 76029189);
    a = md5hh(a, b, c, d, x[i+9], 4, -640364487); d = md5hh(d, a, b, c, x[i+12], 11, -421815835);
    c = md5hh(c, d, a, b, x[i+15], 16, 530742520); b = md5hh(b, c, d, a, x[i+2], 23, -995338651);
    a = md5ii(a, b, c, d, x[i], 6, -198630844); d = md5ii(d, a, b, c, x[i+7], 10, 1126891415);
    c = md5ii(c, d, a, b, x[i+14], 15, -1416354905); b = md5ii(b, c, d, a, x[i+5], 21, -57434055);
    a = md5ii(a, b, c, d, x[i+12], 6, 1700485571); d = md5ii(d, a, b, c, x[i+3], 10, -1894986606);
    c = md5ii(c, d, a, b, x[i+10], 15, -1051523); b = md5ii(b, c, d, a, x[i+1], 21, -2054922799);
    a = md5ii(a, b, c, d, x[i+8], 6, 1873313359); d = md5ii(d, a, b, c, x[i+15], 10, -30611744);
    c = md5ii(c, d, a, b, x[i+6], 15, -1560198380); b = md5ii(b, c, d, a, x[i+13], 21, 1309151649);
    a = md5ii(a, b, c, d, x[i+4], 6, -145523070); d = md5ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = md5ii(c, d, a, b, x[i+2], 15, 718787259); b = md5ii(b, c, d, a, x[i+9], 21, -343485551);
    a = safeAdd(a, olda); b = safeAdd(b, oldb); c = safeAdd(c, oldc); d = safeAdd(d, oldd);
  }
  function hex(n: number): string {
    let s = '';
    for (let j = 0; j < 4; j++) { s += ('0' + ((n >>> (j * 8)) & 0xff).toString(16)).slice(-2); }
    return s;
  }
  return hex(a) + hex(b) + hex(c) + hex(d);
}

export function generatePayHereHashLocal(
  merchantId: string,
  merchantSecret: string,
  orderId: string,
  amount: string,
  currency: string
): string {
  const hashedSecret = md5(merchantSecret).toUpperCase();
  const raw = merchantId + orderId + amount + currency + hashedSecret;
  return md5(raw).toUpperCase();
}

export interface PayHereCheckoutParams {
  orderId: string;
  items: string;
  amount: number;
  currency?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country?: string;
  custom1?: string;
  custom2?: string;
}

export type PayHereResult =
  | { type: 'success'; paymentId: string }
  | { type: 'cancel' }
  | { type: 'error'; message: string };

/**
 * Open PayHere checkout in the native browser (SFSafariViewController / Chrome Custom Tab).
 * No domain verification needed — this is a trusted browser context.
 * Returns a result when the browser is closed or redirects back to the app.
 */
export async function openPayHereCheckout(params: PayHereCheckoutParams): Promise<PayHereResult> {
  const merchantId = PAYHERE_MERCHANT_ID;
  const merchantSecret = PAYHERE_MERCHANT_SECRET;

  if (!merchantId || merchantId === 'YOUR_MERCHANT_ID' || !merchantSecret || merchantSecret === 'YOUR_MERCHANT_SECRET') {
    return {
      type: 'error',
      message: 'PayHere credentials not configured. Open constants/config.ts and set PAYHERE_MC_ID and PAYHERE_MC_SECRET.',
    };
  }

  const currency = params.currency || 'LKR';
  const amountStr = params.amount.toFixed(2);
  const hash = generatePayHereHashLocal(merchantId, merchantSecret, params.orderId, amountStr, currency);

  // Build the Supabase edge function URL (payhere-checkout) as the bridge
  // This avoids the domain verification issue — the edge function is a server URL PayHere can POST to
  // For now, we use the checkout URL directly via a POST-encoded redirect approach

  const actionUrl = PAYHERE_SANDBOX
    ? 'https://sandbox.payhere.lk/pay/checkout'
    : 'https://www.payhere.lk/pay/checkout';

  // Deep link scheme for return — use Expo's redirect URI
  const returnUrl = Linking.createURL('payment/success');
  const cancelUrl = Linking.createURL('payment/cancel');

  // Build a self-hosted checkout page using Supabase edge function URL
  // The edge function accepts GET params, generates hash, returns auto-submit HTML
  const edgeFnBase = 'https://csqqorcnrwkkwpfbravh.supabase.co/functions/v1/payhere-checkout';

  const qp = new URLSearchParams({
    merchant_id: merchantId,
    order_id: params.orderId,
    items: params.items,
    amount: amountStr,
    currency,
    first_name: params.firstName,
    last_name: params.lastName,
    email: params.email,
    phone: params.phone,
    address: params.address,
    city: params.city,
    country: params.country || 'Sri Lanka',
    custom_1: params.custom1 || '',
    custom_2: params.custom2 || '',
    return_url: returnUrl,
    cancel_url: cancelUrl,
    sandbox: String(PAYHERE_SANDBOX),
    // Pass pre-computed hash so edge function can skip secret lookup if needed
    hash,
  });

  const checkoutUrl = `${edgeFnBase}?${qp.toString()}`;

  try {
    // openAuthSessionAsync watches for redirect back to our deep link scheme
    const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, Linking.createURL('payment'));

    if (result.type === 'success') {
      // PayHere redirected back to our return URL
      const url = result.url || '';
      if (url.includes('cancel')) {
        return { type: 'cancel' };
      }
      // Extract payment_id from the redirect URL if present
      const match = url.match(/[?&]payment_id=([^&]+)/);
      const paymentId = match ? decodeURIComponent(match[1]) : params.orderId;
      return { type: 'success', paymentId };
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      // User closed the browser — treat as cancelled
      return { type: 'cancel' };
    }

    return { type: 'cancel' };
  } catch (err: any) {
    return { type: 'error', message: err?.message || 'Payment browser could not be opened.' };
  }
}

/**
 * After a successful PayHere payment for AI credits, credit the user's account.
 */
export async function creditAICreditsAfterPayment(
  userId: string,
  enrollmentId: string,
  creditPackage: AICreditPackage,
  paymentId: string
): Promise<void> {
  const monthYear = new Date().toISOString().slice(0, 7);

  await supabase.from('ai_credit_purchases').insert({
    user_id: userId,
    enrollment_id: enrollmentId,
    credits_purchased: creditPackage.credits,
    amount_paid: creditPackage.price,
    payment_id: paymentId,
    package_id: creditPackage.id,
    purchased_at: new Date().toISOString(),
  });

  const { data: existing } = await supabase
    .from('ai_credits')
    .select('*')
    .eq('user_id', userId)
    .eq('enrollment_id', enrollmentId)
    .eq('month_year', monthYear)
    .single();

  if (existing) {
    await supabase
      .from('ai_credits')
      .update({ bonus_credits: (existing.bonus_credits || 0) + creditPackage.credits })
      .eq('id', existing.id);
  }
}

/**
 * After payment for a print request, update the payment_status.
 */
export async function updatePrintPaymentStatus(
  requestNumber: string,
  paymentId: string,
  status: 'paid' | 'failed'
): Promise<void> {
  await supabase
    .from('print_requests')
    .update({
      payment_status: status,
      payment_id: paymentId,
      status: status === 'paid' ? 'pending' : 'pending_payment',
    })
    .eq('request_number', requestNumber);
}
