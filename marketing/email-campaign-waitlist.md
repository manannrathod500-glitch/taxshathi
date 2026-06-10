# Email Campaign — Convert the Waitlist to Paid

Audience: people already in the Supabase `waitlist` table (they opted in — safe to email).
Send from: contact@taxsathi.online · Always include an unsubscribe line.

---

## Email 1 — "You're off the waitlist" (send to all)

**Subject options (pick one):**
- તમારો વારો આવી ગયો! TaxSathi AI is live 🎉
- You're in — TaxSathi AI access is open
- GST ka jhanjhat khatam — your TaxSathi access is ready

**Body:**

```
Namaste {name},

You joined the TaxSathi AI waitlist — and today your access is open.

TaxSathi AI is your 24/7 tax sathi:
• Ask any GST/ITR question in Gujarati, Hindi or English — instant answers
• Turn a WhatsApp order into a GST invoice in seconds
• Never miss a GSTR-1 (11th) or GSTR-3B (20th) deadline again

Start free (no card needed): https://taxsathi.online

As an early waitlist member, the Starter plan is ₹1,499/month — lock it in
before public pricing changes.

— Team TaxSathi AI
contact@taxsathi.online

Don't want these emails? Reply "unsubscribe" and we'll remove you.
```

---

## Email 2 — deadline hook (send 4–5 days later to non-converters, timed around the 8th–10th of the month)

**Subject:** GSTR-1 due on the 11th — 2-minute checklist inside

**Body:**

```
Namaste {name},

GSTR-1 filing is due on the 11th. Quick checklist:

☐ All B2B invoices uploaded with correct GSTIN
☐ Credit/debit notes entered
☐ HSN summary matches sales register
☐ Exports / SEZ supplies reported with shipping bill details

TaxSathi AI can run through this with you in Gujarati — and remind you
before every deadline automatically.

Try it free: https://taxsathi.online

— Team TaxSathi AI

Reply "unsubscribe" to stop receiving these.
```

---

## Email 3 — social proof + offer (1 week later, last touch)

**Subject:** સુરતના વેપારીઓ TaxSathi કેમ વાપરે છે?

**Body:**

```
Namaste {name},

Gujarat's traders spend 5–8 hours a month chasing GST answers and deadlines.
TaxSathi users get it done in minutes — in their own language.

"Pehli vaar koi software Gujarati ma jawab aape che!" — early user, Surat

This week only, for waitlist members:
👉 Starter plan ₹1,499/month — first month, money-back if not satisfied.

Activate now: https://taxsathi.online

— Team TaxSathi AI

Reply "unsubscribe" to opt out.
```

---

## Mechanics

- Export waitlist: Supabase dashboard → Table editor → `waitlist` → Export CSV.
- < 200 contacts: send via Gmail with mail-merge (or I can prepare drafts).
- > 200 contacts: use Resend (already integrated for welcome emails) — broadcast API keeps deliverability clean.
- Send Tue–Thu, 10:30am IST. Track opens/clicks per subject line.
