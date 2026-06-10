#!/usr/bin/env python3
"""Send the waitlist conversion campaign (marketing/email-campaign-waitlist.md).

Pulls live contacts from the Supabase `waitlist` table and sends one of the
three campaign emails via Resend, personalized per contact.

Usage:
    # Preview who would receive Email 1 (no sends happen)
    python send_waitlist_campaign.py --email 1

    # Actually send Email 1 to everyone on the waitlist
    python send_waitlist_campaign.py --email 1 --send

Required environment variables:
    SUPABASE_SERVICE_KEY  service_role key (supabase projects api-keys --project-ref qjinbmuredxreupqwoqf)
    RESEND_API_KEY        only needed with --send

Sending from contact@taxsathi.online requires the taxsathi.online domain to be
verified in Resend (Domains -> Add Domain -> add the DNS records). Until then,
Resend only delivers from onboarding@resend.dev and only to your own address.
"""

import argparse
import os
import re
import sys
import time

import requests

SUPABASE_URL = "https://qjinbmuredxreupqwoqf.supabase.co"
FROM_ADDRESS = "TaxSathi AI <contact@taxsathi.online>"

# Owner/test signups that must never receive campaign mail.
EXCLUDE_EMAILS = {
    "mananrathod500@gmail.com",
    "mananrathod7777@gmail.com",
    "men98@gmail.com",
}

EMAILS = {
    "1": {
        "subject": "તમારો વારો આવી ગયો! TaxSathi AI is live 🎉",
        "body": """Namaste {name},

You joined the TaxSathi AI waitlist — and today your access is open.

TaxSathi AI is your 24/7 tax sathi:
• Ask any GST/ITR question in Gujarati, Hindi or English — instant answers
• Turn a WhatsApp order into a GST invoice in seconds
• Never miss a GSTR-1 (11th) or GSTR-3B (20th) deadline again

Start free (no card needed): https://taxsathi.online

As an early waitlist member, the Starter plan is ₹1,499/month — lock it in before public pricing changes.

— Team TaxSathi AI
contact@taxsathi.online

Don't want these emails? Reply "unsubscribe" and we'll remove you.""",
    },
    "2": {
        "subject": "GSTR-1 due on the 11th — 2-minute checklist inside",
        "body": """Namaste {name},

GSTR-1 filing is due on the 11th. Quick checklist:

☐ All B2B invoices uploaded with correct GSTIN
☐ Credit/debit notes entered
☐ HSN summary matches sales register
☐ Exports / SEZ supplies reported with shipping bill details

TaxSathi AI can run through this with you in Gujarati — and remind you before every deadline automatically.

Try it free: https://taxsathi.online

— Team TaxSathi AI

Reply "unsubscribe" to stop receiving these.""",
    },
    "3": {
        "subject": "સુરતના વેપારીઓ TaxSathi કેમ વાપરે છે?",
        "body": """Namaste {name},

Gujarat's traders spend 5–8 hours a month chasing GST answers and deadlines. TaxSathi users get it done in minutes — in their own language.

"Pehli vaar koi software Gujarati ma jawab aape che!" — early user, Surat

This week only, for waitlist members:
👉 Starter plan ₹1,499/month — first month, money-back if not satisfied.

Activate now: https://taxsathi.online

— Team TaxSathi AI

Reply "unsubscribe" to opt out.""",
    },
}


def fetch_waitlist(service_key):
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/waitlist",
        params={"select": "name,email,created_at", "order": "created_at.asc"},
        headers={"apikey": service_key, "Authorization": f"Bearer {service_key}"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def clean_recipients(rows):
    seen = set()
    recipients = []
    for row in rows:
        email = (row.get("email") or "").strip().lower()
        if not email or email in seen:
            continue
        if email in EXCLUDE_EMAILS or "+test" in email:
            continue
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
            continue
        seen.add(email)
        name = (row.get("name") or "").strip().title() or "friend"
        recipients.append({"name": name.split()[0], "email": email})
    return recipients


def send_via_resend(api_key, recipient, template):
    resp = requests.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "from": FROM_ADDRESS,
            "to": [recipient["email"]],
            "subject": template["subject"],
            "text": template["body"].format(name=recipient["name"]),
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json().get("id", "?")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--email", choices=EMAILS.keys(), required=True, help="which campaign email to send (1-3)")
    parser.add_argument("--send", action="store_true", help="actually send (default is dry-run preview)")
    args = parser.parse_args()

    service_key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not service_key:
        sys.exit("Set SUPABASE_SERVICE_KEY first (supabase projects api-keys --project-ref qjinbmuredxreupqwoqf)")

    template = EMAILS[args.email]
    recipients = clean_recipients(fetch_waitlist(service_key))
    print(f"Waitlist contains {len(recipients)} sendable contact(s) after removing test/owner entries.\n")

    if not recipients:
        print("Nothing to send — the waitlist has no real signups yet.")
        return

    if not args.send:
        for r in recipients:
            print(f"  [dry-run] {r['email']:40s} -> \"{template['subject']}\" (Namaste {r['name']})")
        print("\nRe-run with --send to deliver via Resend.")
        return

    resend_key = os.environ.get("RESEND_API_KEY")
    if not resend_key:
        sys.exit("Set RESEND_API_KEY to send (https://resend.com/api-keys)")

    sent = 0
    for r in recipients:
        try:
            message_id = send_via_resend(resend_key, r, template)
            sent += 1
            print(f"  sent {r['email']} (id {message_id})")
        except requests.HTTPError as exc:
            print(f"  FAILED {r['email']}: {exc.response.status_code} {exc.response.text}")
        time.sleep(0.6)  # stay under Resend's 2 req/s limit

    print(f"\nDone: {sent}/{len(recipients)} delivered.")


if __name__ == "__main__":
    main()
