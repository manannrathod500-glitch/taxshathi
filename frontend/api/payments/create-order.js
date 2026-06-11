// Vercel serverless function: POST /api/payments/create-order
// Creates a Razorpay order. Ports the old FastAPI endpoint to a same-origin
// Vercel function. The authoritative plan is stored in the Razorpay order's
// `notes.plan` so /api/payments/verify can re-read it (no DB needed).
//
// Requires env vars in Vercel: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
// Optional (best-effort order logging): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const crypto = require('crypto');

const PLAN_CONFIG = {
  Starter: { amount: 1499, description: 'Starter Plan - Monthly Subscription' },
  Pro: { amount: 3999, description: 'Pro Plan - Monthly Subscription' },
};

function findPlan(name) {
  if (!name) return null;
  const key = Object.keys(PLAN_CONFIG).find(
    (k) => k.toLowerCase() === String(name).toLowerCase()
  );
  return key ? { key, ...PLAN_CONFIG[key] } : null;
}

// Best-effort: record the created order in Supabase if configured. Never throws.
async function logOrder(row) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    await fetch(`${url}/rest/v1/payments`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(row),
    });
  } catch (e) {
    console.error('Supabase order log failed (non-fatal):', e.message);
  }
}

module.exports = async function handler(req, res) {
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

  const plan = findPlan(body.plan_name);
  if (!plan) {
    return res.status(400).json({ detail: `Invalid plan: ${body.plan_name}` });
  }

  const receipt = `txs_${plan.key.toLowerCase()}_${crypto.randomBytes(4).toString('hex')}`;
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  let order;
  try {
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: plan.amount * 100, // Razorpay expects paise
        currency: 'INR',
        receipt,
        notes: {
          plan: plan.key,
          customer_name: body.customer_name || '',
          customer_email: body.customer_email || '',
        },
      }),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      console.error(`Razorpay order creation failed ${r.status}: ${text.slice(0, 300)}`);
      return res.status(502).json({ detail: 'Payment gateway error' });
    }
    order = await r.json();
  } catch (e) {
    console.error('Razorpay order creation error:', e.message);
    return res.status(502).json({ detail: 'Payment gateway error' });
  }

  await logOrder({
    order_id: order.id,
    plan: plan.key,
    amount: plan.amount,
    currency: 'INR',
    status: 'created',
    customer_name: body.customer_name || null,
    customer_email: body.customer_email || null,
    customer_phone: body.customer_phone || null,
    created_at: new Date().toISOString(),
  });

  return res.status(200).json({
    order_id: order.id,
    amount: plan.amount * 100,
    currency: 'INR',
    key_id: keyId,
    plan_name: plan.key,
    description: plan.description,
  });
}
