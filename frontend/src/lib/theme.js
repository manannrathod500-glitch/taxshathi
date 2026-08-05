// ── TaxSathi "Bright Trust" design tokens ────────────────────────────────────
// Chosen design direction (June 2026): light, high-contrast, trust-first — built
// for non-technical Gujarati traders on budget phones. Import these instead of
// hand-rolling colours so every screen stays consistent as we roll the theme out.
export const bright = {
  // surfaces
  page:       '#f6f7fb', // app background
  surface:    '#ffffff', // header, input, cards
  surfaceAlt: '#f1f5f9', // assistant bubble / subtle fills
  border:     '#e3e8f0',

  // text (near-black for readability — no more low-contrast grey)
  text:       '#0f172a',
  textSub:    '#475569',
  textMute:   '#64748b',

  // brand + actions
  primary:    '#4f46e5', // indigo — trust/brand, user bubble
  primaryDk:  '#4338ca',
  send:       '#16a34a', // trust green — send / voice
  sendDk:     '#15803d',
  accent:     '#7c3aed', // purple brand accent (logo / highlights only)
  danger:     '#dc2626',

  // shape
  radius:     14,
  radiusLg:   20,

  // type
  fontUI:     "'DM Sans','Noto Sans Gujarati',sans-serif",
  fontGu:     "'Noto Sans Gujarati','DM Sans',sans-serif",
};

// ── TaxSathi dark design tokens ──────────────────────────────────────────────
// Matches the app-wide dark theme used by Landing/Blog/Dashboard (#07050f base,
// violet accents). Use for pages that should look like the rest of the product.
export const dark = {
  // surfaces
  page:       '#07050f', // app background
  surface:    'rgba(255,255,255,0.03)', // header, input, cards
  surfaceAlt: 'rgba(139,92,246,0.12)', // subtle fills
  border:     'rgba(139,92,246,0.15)',

  // text
  text:       '#e8e0ff',
  textSub:    '#9ca3af',
  textMute:   '#6b7280',

  // brand + actions
  primary:    '#7c3aed', // violet — trust/brand, user bubble
  primaryDk:  '#6d28d9',
  send:       '#8b5cf6', // violet — send / voice / online dot
  sendDk:     '#7c3aed',
  accent:     '#a78bfa', // light violet — highlights
  danger:     '#f87171',

  // shape
  radius:     14,
  radiusLg:   20,

  // type
  fontUI:     "'DM Sans','Noto Sans Gujarati',sans-serif",
  fontGu:     "'Noto Sans Gujarati','DM Sans',sans-serif",
};

// BCP-47 codes for the Web Speech API (voice in/out), keyed by language code.
export const SPEECH_LANG = { gu: 'gu-IN', hi: 'hi-IN', en: 'en-IN' };

// Detect the script a piece of text is written in, so spoken replies follow the
// language of the conversation (Gujarati answer → Gujarati voice) automatically.
export const detectLang = (text = '') => {
  if (/[઀-૿]/.test(text)) return 'gu'; // Gujarati block
  if (/[ऀ-ॿ]/.test(text)) return 'hi'; // Devanagari block
  return 'en';
};
