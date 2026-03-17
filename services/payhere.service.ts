// Powered by OnSpace.AI
// PayHere payment service — WebView-based checkout, client-side MD5 hash

import { supabase } from './supabase';

export const PAYHERE_MERCHANT_ID = process.env.EXPO_PUBLIC_PAYHERE_MC_ID || '';
export const PAYHERE_MERCHANT_SECRET = process.env.EXPO_PUBLIC_PAYHERE_MC_SECRET || '';
export const PAYHERE_SANDBOX = false;

// ─── Credit Rules ──────────────────────────────────────────────────────────
export const CREDIT_MIN = 50;
export const CREDIT_MAX = 50000;
export const CREDIT_STEP = 50;
export const CREDIT_PRICE_PER_UNIT = 1; // 1 credit = 1 LKR

/** Round amount down to nearest valid multiple of CREDIT_STEP */
export function snapToGrid(value: number): number {
  const snapped = Math.round(value / CREDIT_STEP) * CREDIT_STEP;
  return Math.min(CREDIT_MAX, Math.max(CREDIT_MIN, snapped));
}

export type PayHerePaymentType = 'print' | 'ai_credits';

export interface AICreditPackage {
  id: string;
  label: string;
  credits: number;
  price: number; // LKR — equals credits (1:1)
}

// ─── Pure-JS MD5 ──────────────────────────────────────────────────────────
// Used to generate PayHere hash client-side without a server round-trip.

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
    a = md5ff(a, b, c, d, x[i], 7, -680876936);
    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, x[i], 20, -373897302);
    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
    a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, x[i], 11, -358537222);
    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
    a = md5ii(a, b, c, d, x[i], 6, -198630844);
    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }
  function hex(n: number): string {
    let s = '';
    for (let j = 0; j < 4; j++) {
      s += ('0' + ((n >>> (j * 8)) & 0xff).toString(16)).slice(-2);
    }
    return s;
  }
  return hex(a) + hex(b) + hex(c) + hex(d);
}

/**
 * Generate the PayHere hash entirely on the client.
 * Formula: strtoupper( MD5( merchant_id + order_id + amount + currency + strtoupper(MD5(merchant_secret)) ) )
 */
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

/**
 * Build PayHere checkout data — hash generated client-side, no edge function call.
 */
export async function generatePayHereHash(
  orderId: string,
  amount: number,
  currency: string = 'LKR'
): Promise<{ hash: string; merchantId: string }> {
  const merchantId = PAYHERE_MERCHANT_ID;
  const merchantSecret = PAYHERE_MERCHANT_SECRET;

  if (!merchantId || !merchantSecret) {
    // Credentials not set — try the edge function as fallback
    const { data, error } = await supabase.functions.invoke('payhere-checkout', {
      body: { action: 'generate_hash', order_id: orderId, amount: amount.toFixed(2), currency },
    });
    if (error) throw new Error('PayHere credentials not configured. Please add EXPO_PUBLIC_PAYHERE_MC_ID and EXPO_PUBLIC_PAYHERE_MC_SECRET to your environment.');
    return data as { hash: string; merchantId: string };
  }

  const hash = generatePayHereHashLocal(merchantId, merchantSecret, orderId, amount.toFixed(2), currency);
  return { hash, merchantId };
}

/**
 * Build the full PayHere checkout HTML page rendered in a WebView.
 */
export function buildPayHereCheckoutHtml(params: {
  merchantId: string;
  hash: string;
  orderId: string;
  items: string;
  amount: string;
  currency: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country?: string;
  notifyUrl?: string;
  returnUrl?: string;
  cancelUrl?: string;
  sandbox?: boolean;
}): string {
  const actionUrl = params.sandbox
    ? 'https://sandbox.payhere.lk/pay/checkout'
    : 'https://www.payhere.lk/pay/checkout';

  const esc = (s: string) => String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const fields: [string, string][] = [
    ['merchant_id', params.merchantId],
    ['return_url', params.returnUrl || 'https://readbase.lk/payment/success'],
    ['cancel_url', params.cancelUrl || 'https://readbase.lk/payment/cancel'],
    ['notify_url', params.notifyUrl || 'https://csqqorcnrwkkwpfbravh.supabase.co/functions/v1/payhere-notify'],
    ['order_id', params.orderId],
    ['items', params.items],
    ['currency', params.currency],
    ['amount', params.amount],
    ['first_name', params.firstName],
    ['last_name', params.lastName],
    ['email', params.email],
    ['phone', params.phone],
    ['address', params.address],
    ['city', params.city],
    ['country', params.country || 'Sri Lanka'],
    ['hash', params.hash],
  ];

  const inputsHtml = fields.map(([name, value]) =>
    `    <input type="hidden" name="${esc(name)}" value="${esc(value)}" />`
  ).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Redirecting to PayHere...</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0a04;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; font-family: sans-serif;
    }
    .wrap { text-align: center; }
    .spinner {
      width: 44px; height: 44px;
      border: 3px solid rgba(29,161,242,0.2);
      border-top-color: #1da1f2;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .label { color: #a1a1aa; font-size: 14px; }
    .sub { color: #52525b; font-size: 12px; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="spinner"></div>
    <p class="label">Connecting to PayHere...</p>
    <p class="sub">Please wait</p>
  </div>
  <form id="phf" method="POST" action="${esc(actionUrl)}" style="display:none">
${inputsHtml}
  </form>
  <script>
    window.onload = function() {
      setTimeout(function() {
        document.getElementById('phf').submit();
      }, 400);
    };
  </script>
</body>
</html>`;
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
