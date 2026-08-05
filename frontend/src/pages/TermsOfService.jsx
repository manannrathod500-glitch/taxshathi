import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

// Sets title, meta description and canonical for a route.
// CRA renders client-side; Googlebot executes JS, so these are picked up.
function useSeo({ title, description, path }) {
  useEffect(() => {
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    const prevDesc = meta.content;
    meta.content = description;

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    const prevHref = canonical.href;
    canonical.href = `https://taxsathi.online${path}`;

    return () => {
      meta.content = prevDesc;
      canonical.href = prevHref;
    };
  }, [title, description, path]);
}

const S = {
  page: { minHeight: '100vh', background: '#07050f', color: '#e8e0ff', fontFamily: "'DM Sans', 'Noto Sans Gujarati', sans-serif" },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px clamp(20px, 5vw, 60px)', borderBottom: '1px solid rgba(139,92,246,0.12)' },
  navBrand: { display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' },
  navBtn: { background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13.5, fontWeight: 700 },
  wrap: { maxWidth: 760, margin: '0 auto', padding: '48px 20px 80px' },
  kicker: { color: '#a78bfa', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
  h1: { fontSize: 'clamp(26px, 4.5vw, 40px)', fontWeight: 900, color: '#fff', lineHeight: 1.25, letterSpacing: -0.5, marginBottom: 14 },
  updated: { color: '#6b7280', fontSize: 13, marginBottom: 8 },
  disclaimer: { background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(139,92,246,0.08))', border: '1px solid rgba(139,92,246,0.35)', borderRadius: 16, padding: '22px 24px', margin: '28px 0', color: '#e8e0ff', fontSize: 14.5, lineHeight: 1.75 },
  footer: { borderTop: '1px solid rgba(139,92,246,0.12)', padding: '32px 20px', textAlign: 'center', color: '#4b5563', fontSize: 13 },
};

const legalCss = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Noto+Sans+Gujarati:wght@400;600;700&display=swap');
  .ts-legal { font-size: 15.5px; line-height: 1.85; color: #c9c3e3; }
  .ts-legal h2 { color: #fff; font-size: 21px; font-weight: 800; margin: 36px 0 12px; line-height: 1.35; }
  .ts-legal p { margin: 0 0 16px; }
  .ts-legal ul, .ts-legal ol { margin: 0 0 16px; padding-left: 24px; }
  .ts-legal li { margin-bottom: 8px; }
  .ts-legal a { color: #a78bfa; }
  .ts-legal strong { color: #fff; }
  .ts-legal table { width: 100%; border-collapse: collapse; margin: 0 0 16px; font-size: 14.5px; }
  .ts-legal th, .ts-legal td { border: 1px solid rgba(139,92,246,0.25); padding: 10px 12px; text-align: left; }
  .ts-legal th { background: rgba(139,92,246,0.12); color: #fff; }
`;

const Brand = () => (
  <Link to="/" style={S.navBrand}>
    <img src="/favicon.png" alt="TaxSathi" style={{ width: 32, height: 32, borderRadius: 7, objectFit: 'cover' }} />
    <span style={{ lineHeight: 1.15 }}>
      <span style={{ display: 'block', color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: '0.03em' }}>TAX SATHI</span>
      <span style={{ display: 'block', color: '#a78bfa', fontWeight: 700, fontSize: 11, letterSpacing: '0.14em' }}>AI</span>
    </span>
  </Link>
);

const Shell = ({ children }) => (
  <div style={S.page}>
    <style>{legalCss}</style>
    <nav style={S.nav}>
      <Brand />
      <Link to="/login" style={S.navBtn}>Start Free</Link>
    </nav>
    {children}
    <footer style={S.footer}>
      © {new Date().getFullYear()} TaxSathi AI · <Link to="/" style={{ color: '#6b7280' }}>taxsathi.online</Link>
    </footer>
  </div>
);

export default function TermsOfService() {
  useSeo({
    title: 'Terms of Service — TaxSathi AI',
    description:
      'Terms of Service for TaxSathi AI: the service, subscription plans and billing, acceptable use, AI guidance disclaimer, termination, liability and governing law (India).',
    path: '/terms-of-service',
  });

  return (
    <Shell>
      <div style={S.wrap}>
        <div style={S.kicker}>Legal</div>
        <h1 style={S.h1}>Terms of Service</h1>
        <div style={S.updated}>Last updated: 5 August 2026</div>
        <hr style={{ border: 'none', borderTop: '1px solid rgba(139,92,246,0.15)', margin: '24px 0 28px' }} />
        <div className="ts-legal">
          <p>
            These Terms of Service ("Terms") govern your use of TaxSathi AI ("TaxSathi", "the Service"), operated
            from India and available at taxsathi.online. By creating an account or using the Service, you agree to
            these Terms. If you use the Service on behalf of a firm or company, you confirm you have authority to
            bind that firm or company.
          </p>

          <div style={S.disclaimer}>
            <strong style={{ color: '#fff' }}>Important — AI guidance is not professional advice.</strong> TaxSathi AI
            generates answers using artificial intelligence. Those answers are informational only and do not
            constitute tax, legal or financial advice. They do not replace the professional judgment of a Chartered
            Accountant or tax practitioner, and they do not transfer filing responsibility. You — or your CA — remain
            solely responsible for verifying every answer against current law and for the accuracy and timeliness of
            any GST return, ITR or other filing made in reliance on the Service. Tax laws change; always confirm
            against the latest CBIC/Income Tax Department notifications before acting.
          </div>

          <h2>1. The Service</h2>
          <p>
            TaxSathi AI is an AI-powered GST and ITR assistant for Indian CAs, tax consultants and businesses. It
            answers tax questions in Gujarati, Hindi and English, provides deadline and compliance information, and
            gives CA firms client links, usage dashboards and related tools. Answers are generated by AI (via the
            Google Gemini API) and may occasionally be incomplete or incorrect — see the disclaimer above and
            Section 6.
          </p>

          <h2>2. Subscription plans and billing</h2>
          <p>Current plans, as published on our pricing section:</p>
          <table>
            <thead>
              <tr><th>Plan</th><th>Price</th><th>Includes</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Free Trial</td>
                <td>₹0 for 7 days</td>
                <td>5 client links, 50 AI queries/month, dashboard access, WhatsApp sharing</td>
              </tr>
              <tr>
                <td>Starter</td>
                <td>₹1,499/month</td>
                <td>20 client links, 500 AI queries/month, QR code generator, client activity tracking, email support</td>
              </tr>
              <tr>
                <td>Pro</td>
                <td>₹3,999/month</td>
                <td>Unlimited client links, unlimited AI queries, priority support, CA branding on chatbot, advanced analytics, WhatsApp onboarding</td>
              </tr>
            </tbody>
          </table>
          <ul>
            <li>Paid plans are billed monthly in advance through Razorpay. Prices are in INR and exclusive of applicable GST unless stated otherwise at checkout.</li>
            <li>Subscriptions renew automatically each billing cycle until cancelled. You can cancel by emailing us before the next renewal date; access continues until the end of the paid period.</li>
            <li>Fees already paid are non-refundable except where required by law or where we fail to provide the Service.</li>
            <li>We may change prices with at least 30 days' notice by email; changes apply from your next renewal.</li>
          </ul>

          <h2>3. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Reverse engineer, decompile or attempt to extract the source code, prompts or models behind the Service.</li>
            <li>Resell, sublicense or share your account access with anyone outside your firm, except through the client link features we provide.</li>
            <li>Use the Service to provide unlawful advice, evade tax, or mislead any tax authority.</li>
            <li>Upload or input data you have no right to share, including client data without the client's authority.</li>
            <li>Probe, scan or overload the Service or its infrastructure, or attempt to bypass usage limits or authentication.</li>
            <li>Scrape or bulk-extract content or answers from the Service by automated means.</li>
          </ul>

          <h2>4. Accounts and client data</h2>
          <p>
            You are responsible for keeping your login credentials confidential and for all activity under your
            account. If you are a CA entering data about your own clients, you confirm you have the authority to do
            so and remain responsible for that data as between you and your client.
          </p>

          <h2>5. Termination</h2>
          <p>
            You may close your account at any time by emailing us. We may suspend or terminate your account,
            with notice where practicable, if you breach these Terms, fail to pay subscription fees, misuse the
            Service, or where continued provision would be unlawful. On termination, your access ends and we handle
            your data as described in our <Link to="/privacy-policy">Privacy Policy</Link>.
          </p>

          <h2>6. Limitation of liability</h2>
          <p>
            The Service is provided "as is" and "as available". To the maximum extent permitted by Indian law,
            TaxSathi AI and its operators are not liable for: (a) any tax liability, penalty, interest or notice
            arising from reliance on AI-generated answers; (b) indirect, incidental or consequential damages,
            including lost profits or lost clients; or (c) interruptions caused by third-party providers (Supabase,
            Google Gemini, Resend, Razorpay) or network failures. Our total aggregate liability for any claim
            relating to the Service is limited to the subscription fees you paid us in the 3 months preceding the
            claim.
          </p>

          <h2>7. Intellectual property</h2>
          <p>
            The Service, its branding and its content (excluding your data) are owned by TaxSathi AI. You retain
            ownership of the data you input. You grant us a limited licence to process that data solely to provide
            and improve the Service.
          </p>

          <h2>8. Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. Material changes will be notified by email or a notice in
            the Service before they take effect. Continued use after the effective date means you accept the updated
            Terms.
          </p>

          <h2>9. Governing law and disputes</h2>
          <p>
            These Terms are governed by the laws of India. Courts in Gujarat, India have exclusive jurisdiction
            over any dispute arising from these Terms or your use of the Service.
          </p>

          <h2>10. Contact</h2>
          <p>
            Questions about these Terms: <a href="mailto:contact@taxsathi.online">contact@taxsathi.online</a>.
          </p>
        </div>
      </div>
    </Shell>
  );
}
