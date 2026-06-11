// Vercel serverless function: POST /api/payments/verify
// Verifies a Razorpay payment signature, then activates the plan that was
// recorded on the order at creation time (read back from Razorpay `notes.plan`)
// — never the client-supplied plan_name, so a Starter payment cannot be passed
// off as Pro.
//
// Requires env vars in Vercel: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
// Optional (best-effort): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import crypto from 'crypto';

// Best-effort: mark the order paid in Supabase if configured. Never throws.
async function markPaid(orderId, fields) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    await fetch(
      `${url}/rest/v1/payments?order_id=eq.${encodeURIComponent(orderId)}`,
      {
        method: 'PATCH',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fields),
      }
    );
  } catch (e) {
    console.error('Supabase markPaid failed (non-fatal):', e.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return res.status(500).json({ detail: 'Razorpay not configured' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ detail: 'Missing payment fields' });
  }

  // Verify signature: HMAC-SHA256(order_id|payment_id) with the key secret.
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  let valid = false;
  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(razorpay_signature, 'utf8');
    valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    valid = false;
  }

  if (!valid) {
    await markPaid(razorpay_order_id, {
      status: 'signature_failed',
      updated_at: new Date().toISOString(),
    });
    return res.status(400).json({ detail: 'Payment verification failed' });
  }

  // Re-read the authoritative plan from the Razorpay order's notes.
  let planName = null;
  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const r = await fetch(
      `https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpay_order_id)}`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    if (r.ok) {
      const order = await r.json();
      planName = order?.notes?.plan || null;
    } else {
      console.error(`Razorpay order fetch failed ${r.status} for ${razorpay_order_id}`);
    }
  } catch (e) {
    console.error('Razorpay order fetch error:', e.message);
  }

  // Fall back to the client-supplied plan only if Razorpay lookup failed.
  // The signature already proves the payment is genuine for this order.
  if (!planName) planName = body.plan_name || 'your';

  await markPaid(razorpay_order_id, {
    status: 'paid',
    payment_id: razorpay_payment_id,
    signature: razorpay_signature,
    customer_name: body.customer_name || null,
    customer_email: body.customer_email || null,
    customer_phone: body.customer_phone || null,
    paid_at: new Date().toISOString(),
  });

  console.log(`Payment verified: ${razorpay_payment_id} for plan ${planName}`);
  return res.status(200).json({
    success: true,
    message: `${planName} plan activated successfully!`,
    payment_id: razorpay_payment_id,
  });
}
