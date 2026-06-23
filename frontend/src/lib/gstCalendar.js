// ── Deterministic GST due-date + late-fee helpers ───────────────────────────
// Exact, COMPUTED answers for regular monthly GST filers — the kind of thing a
// generic chatbot guesses wrong. These are general rules for a normal monthly
// filer; QRMP/composition/special states differ, so the UI always says
// "verify with your CA". Used by the local-owner home to SHOW tangible value
// (next deadlines + what a late filing would cost), not just chat.

// Standard monthly statutory due days:
//   GSTR-1  → 11th of the following month
//   GSTR-3B → 20th of the following month
const DUE = {
  gstr1: { day: 11, label: 'GSTR-1', labelGu: 'GSTR-1', desc: 'Outward sales return' },
  gstr3b: { day: 20, label: 'GSTR-3B', labelGu: 'GSTR-3B', desc: 'Summary return + tax payment' },
};

const pad = (n) => String(n).padStart(2, '0');

// Next calendar date on/after `today` that falls on `dayOfMonth`.
function nextOccurrence(dayOfMonth, today) {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let d = new Date(t.getFullYear(), t.getMonth(), dayOfMonth);
  if (d < t) d = new Date(t.getFullYear(), t.getMonth() + 1, dayOfMonth);
  return d;
}

const daysBetween = (a, b) =>
  Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()) -
              new Date(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);

const fmt = (d) =>
  `${pad(d.getDate())} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}`;

// Upcoming GST deadlines for a regular monthly filer.
export function upcomingDeadlines(today = new Date()) {
  return Object.entries(DUE).map(([key, info]) => {
    const due = nextOccurrence(info.day, today);
    const daysLeft = daysBetween(today, due);
    return {
      key,
      label: info.label,
      desc: info.desc,
      due,
      dueText: fmt(due),
      daysLeft,
      status: daysLeft <= 0 ? 'due' : daysLeft <= 5 ? 'soon' : 'ok',
    };
  }).sort((a, b) => a.due - b.due);
}

// Exact late fee for a late return (per CGST + SGST), capped.
//   GSTR-3B / GSTR-1: ₹50/day (₹25+₹25) normal, ₹20/day (₹10+₹10) for nil.
//   Caps are turnover-based; we use the common ₹5,000 (₹2,500+₹2,500) cap.
export function lateFee({ daysLate, nilReturn = false }) {
  const perDay = nilReturn ? 20 : 50;
  const cap = nilReturn ? 1000 : 5000; // per Act (per return, per head ₹2,500/₹500)
  const raw = Math.max(0, daysLate) * perDay;
  const amount = Math.min(raw, cap);
  return { perDay, amount, capped: raw > cap, cap };
}

// 18% p.a. simple interest on unpaid tax (GSTR-3B).
export function lateInterest({ taxDue = 0, daysLate = 0 }) {
  if (taxDue <= 0 || daysLate <= 0) return 0;
  return Math.round((taxDue * 0.18 * daysLate) / 365);
}
