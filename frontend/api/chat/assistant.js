// Vercel serverless function: POST /api/chat/assistant
// Replaces the old FastAPI endpoint so the GST/ITR chat works on the Vercel
// deployment (same origin as the frontend — no separate backend, no CORS).
//
// Uses OpenRouter with multiple free-tier keys in rotation + model fallback so
// the chat keeps working when a key hits its daily free limit (50 req/day) or a
// model is rate-limited (429). Previously this called DeepSeek directly.
//
// Required env vars (set in Vercel project settings):
//   OPENROUTER_KEYS = "sk-or-v1-...,sk-or-v1-...,sk-or-v1-..."   (preferred)
//   OR numbered: OPENROUTER_KEY_1, OPENROUTER_KEY_2, ... OPENROUTER_KEY_N
// Optional:
//   OPENROUTER_MODEL = override the primary model id (default below)
//   SARVAM_API_KEY   = Sarvam AI key; used as a fallback (Indian languages)

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free models, in preference order. content is returned separately from
// reasoning for these, so we only ever read message.content (never reasoning).
const MODELS = [
  process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-31b-it:free',
  'openrouter/free',
].filter((m, i, a) => m && a.indexOf(m) === i);

// Fallback provider: Sarvam AI (Indian models, best for Gujarati/Hindi).
// `sarvam-105b` is a reasoning model; reasoning_effort: null disables the
// hidden chain-of-thought (the string "none" is rejected with a 400).
const SARVAM_URL = 'https://api.sarvam.ai/v1/chat/completions';
const SARVAM_KEY = (process.env.SARVAM_API_KEY || '').trim();
const SARVAM_MODELS = [
  { model: 'sarvam-105b', noReasoning: true },
  { model: 'sarvam-105b-conversations' },
];

const MAX_ATTEMPTS = 8;
const PER_ATTEMPT_TIMEOUT_MS = 25000;
const TOTAL_BUDGET_MS = 50000;

const ASSISTANT_SYSTEM_PROMPT = `You are TaxSathi AI — an expert Indian tax assistant. You help Indian CAs, tax professionals, and SMB owners with:
- GST (Goods and Services Tax) questions
- ITR (Income Tax Return) filing
- TDS/TCS rules
- Indian tax compliance
- Invoice and billing under GST

You respond in the same language the user writes in — Hindi, Gujarati, or English.
If asked anything unrelated to Indian tax/finance, politely say: "Main sirf GST, ITR aur Indian tax ke sawaalon mein madad kar sakta hoon."
Keep answers clear, practical, and concise.

Important limitation: You provide general information, not professional advice. For complex, high-value, or case-specific matters (notices, disputes, large refunds, registrations), tell the user to confirm with a qualified CA before acting. Never invent figures, due dates, or section numbers — if you are unsure, say so plainly.

Reply with the final answer only. Do not show your reasoning or internal analysis, and never repeat the same sentence or point twice.`;

// Reject degenerate outputs (repetition loops) so we retry on another model.
function looksDegenerate(text) {
  const lines = String(text)
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 15);
  if (lines.length < 6) return false;
  const counts = new Map();
  for (const l of lines) {
    const c = (counts.get(l) || 0) + 1;
    if (c >= 4) return true;
    counts.set(l, c);
  }
  return false;
}

function getKeys() {
  const raw = process.env.OPENROUTER_KEYS || process.env.OPENROUTER_API_KEYS || '';
  let keys = raw
    .split(/[\s,;]+/)
    .map((k) => k.trim())
    .filter(Boolean);

  if (keys.length === 0) {
    for (let i = 1; i <= 25; i += 1) {
      const k = process.env[`OPENROUTER_KEY_${i}`];
      if (k && k.trim()) keys.push(k.trim());
    }
  }
  return keys;
}

// Friendly "out of AI credits" message, in the user's language.
function creditMessage(sample) {
  const s = String(sample || '');
  if (/[\u0A80-\u0AFF]/.test(s)) {
    return 'ક્ષમા કરો 🙏 — આજ માટે અમારા AI ક્રેડિટ પૂરા થઈ ગયા છે. કૃપા કરીને થોડા સમય પછી ફરી પ્રયત્ન કરો.';
  }
  if (/[\u0900-\u097F]/.test(s)) {
    return 'क्षमा करें 🙏 — आज के लिए हमारा AI क्रेडिट ख़त्म हो गया है। कृपया थोड़ी देर बाद दोबारा कोशिश करें।';
  }
  return "Sorry 🙏 — we're out of AI credits for today. Please try again a little later.";
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  const keys = getKeys();
  if (keys.length === 0 && !SARVAM_KEY) {
    return res.status(500).json({ detail: 'No AI provider configured on server' });
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

  const chatMessages = [{ role: 'system', content: ASSISTANT_SYSTEM_PROMPT }, ...cleaned];

  // Rotate the starting key so load spreads across all keys, then build the
  // (key, model) attempt list: for each key, fall through the model list.
  const start = Math.floor(Math.random() * keys.length);
  const orderedKeys = keys.map((_, i) => keys[(start + i) % keys.length]);
  const attempts = [];
  for (const key of orderedKeys) {
    for (const model of MODELS) {
      attempts.push({ key, model });
      if (attempts.length >= MAX_ATTEMPTS) break;
    }
    if (attempts.length >= MAX_ATTEMPTS) break;
  }

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let lastError = 'AI service error';
  let rateLimited = false;
  const disabledKeys = new Set();

  for (const { key, model } of attempts) {
    if (disabledKeys.has(key)) continue;
    const remaining = deadline - Date.now();
    if (remaining <= 1000) { lastError = 'AI service timeout'; break; }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.min(PER_ATTEMPT_TIMEOUT_MS, remaining));

    try {
      const r = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          'HTTP-Referer': 'https://taxsathi.online',
          'X-Title': 'TaxSathi',
        },
        body: JSON.stringify({
          model,
          messages: chatMessages,
          max_tokens: 1000,
          temperature: 0.5,
          frequency_penalty: 0.4,
          // Free models like Nemotron 3 Super are reasoning models. Disabling
          // reasoning makes them answer directly: ~1-4s, clean message.content,
          // and no risk of the token budget being eaten by hidden reasoning.
          reasoning: { enabled: false },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!r.ok) {
        const text = await r.text().catch(() => '');
        lastError = 'AI service error';
        console.error(`OpenRouter ${r.status} (model=${model}, key=...${key.slice(-4)}): ${text.slice(0, 200)}`);
        // A 401 means the key itself is bad — stop using it for the rest of the request.
        if (r.status === 401) disabledKeys.add(key);
        // 429 (rate limit / daily free limit) and 402 (payment required) mean we
        // are out of free capacity for now.
        if (r.status === 429 || r.status === 402) rateLimited = true;
        continue;
      }

      const data = await r.json();
      const reply = data?.choices?.[0]?.message?.content;
      if (reply && String(reply).trim() && !looksDegenerate(reply)) {
        return res.status(200).json({ reply: String(reply).trim() });
      }

      // Empty or looping output — try the next attempt.
      lastError = 'AI service error';
      console.error(`Bad OpenRouter content (model=${model}, key=...${key.slice(-4)}, degenerate=${looksDegenerate(reply || '')})`);
    } catch (e) {
      clearTimeout(timeout);
      if (e && e.name === 'AbortError') {
        lastError = 'AI service timeout';
      } else {
        lastError = 'AI service network error';
      }
      console.error('Assistant attempt failed:', (e && e.message) || e);
    }
  }

  // Fallback provider: Sarvam AI (free credits), only reached when the free
  // OpenRouter models above are all rate-limited / unavailable.
  if (SARVAM_KEY) {
    for (const cfg of SARVAM_MODELS) {
      const remaining = deadline - Date.now();
      if (remaining <= 1000) break;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), Math.min(PER_ATTEMPT_TIMEOUT_MS, remaining));
      try {
        const r = await fetch(SARVAM_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SARVAM_KEY}`,
          },
          body: JSON.stringify({
            model: cfg.model,
            ...(cfg.noReasoning ? { reasoning_effort: null } : {}),
            messages: chatMessages,
            max_tokens: 1000,
            temperature: 0.5,
            frequency_penalty: 0.4,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!r.ok) {
          const text = await r.text().catch(() => '');
          console.error(`Sarvam ${r.status} (model=${cfg.model}): ${text.slice(0, 200)}`);
          if (r.status === 429 || r.status === 402) rateLimited = true;
          continue;
        }

        const data = await r.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply && String(reply).trim() && !looksDegenerate(reply)) {
          return res.status(200).json({ reply: String(reply).trim() });
        }
        console.error(`Bad Sarvam content (model=${cfg.model})`);
      } catch (e) {
        clearTimeout(timeout);
        console.error('Sarvam attempt failed:', (e && e.message) || e);
      }
    }
  }

  // All attempts failed. If the cause was rate limiting / exhausted free quota,
  // tell the user in their own language instead of a generic error.
  if (rateLimited) {
    const lastUser = [...cleaned].reverse().find((m) => m.role === 'user');
    return res.status(200).json({ reply: creditMessage(lastUser && lastUser.content), credits_exhausted: true });
  }

  return res.status(502).json({ detail: lastError });
};
