// Vercel serverless function: POST /api/chat/assistant
// Replaces the old FastAPI endpoint so the GST/ITR chat works on the Vercel
// deployment (same origin as the frontend — no separate backend, no CORS).
// Requires the DEEPSEEK_API_KEY environment variable set in Vercel project settings.

const ASSISTANT_SYSTEM_PROMPT = `You are TaxSathi AI — an expert Indian tax assistant. You help Indian CAs, tax professionals, and SMB owners with:
- GST (Goods and Services Tax) questions
- ITR (Income Tax Return) filing
- TDS/TCS rules
- Indian tax compliance
- Invoice and billing under GST

You respond in the same language the user writes in — Hindi, Gujarati, or English.
If asked anything unrelated to Indian tax/finance, politely say: "Main sirf GST, ITR aur Indian tax ke sawaalon mein madad kar sakta hoon."
Keep answers clear, practical, and concise.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ detail: 'DEEPSEEK_API_KEY not configured on server' });
  }

  // Vercel parses JSON bodies automatically, but guard for string bodies too.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const messages = body && Array.isArray(body.messages) ? body.messages : null;
  if (!messages || messages.length === 0 || messages.length > 40) {
    return res.status(422).json({ detail: 'messages must be a non-empty array (max 40)' });
  }

  // Only pass through valid user/assistant turns with string content.
  const cleaned = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }));

  if (cleaned.length === 0) {
    return res.status(422).json({ detail: 'no valid messages' });
  }

  const payload = {
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: ASSISTANT_SYSTEM_PROMPT },
      ...cleaned,
    ],
    max_tokens: 1000,
    temperature: 0.7,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!r.ok) {
      const text = await r.text().catch(() => '');
      console.error(`DeepSeek error ${r.status}: ${text.slice(0, 300)}`);
      return res.status(502).json({ detail: 'AI service error' });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(502).json({ detail: 'Malformed AI response' });
    }
    return res.status(200).json({ reply });
  } catch (e) {
    if (e.name === 'AbortError') {
      return res.status(504).json({ detail: 'AI service timeout' });
    }
    console.error('Assistant function error:', e);
    return res.status(502).json({ detail: 'AI service network error' });
  }
}
