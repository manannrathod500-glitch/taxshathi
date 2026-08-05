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

export default function PrivacyPolicy() {
  useSeo({
    title: 'Privacy Policy — TaxSathi AI',
    description:
      'How TaxSathi AI collects, uses and protects your data: name, WhatsApp number, email, queries and client data. Processors: Supabase, Google Gemini, Resend, Razorpay.',
    path: '/privacy-policy',
  });

  return (
    <Shell>
      <div style={S.wrap}>
        <div style={S.kicker}>Legal</div>
        <h1 style={S.h1}>Privacy Policy</h1>
        <div style={S.updated}>Last updated: 5 August 2026</div>
        <hr style={{ border: 'none', borderTop: '1px solid rgba(139,92,246,0.15)', margin: '24px 0 28px' }} />
        <div className="ts-legal">
          <p>
            TaxSathi AI ("TaxSathi", "we", "us") is an AI-powered GST and ITR assistant for Indian Chartered
            Accountants, tax consultants and businesses, operated from India and available at taxsathi.online.
            This policy explains what data we collect, why we collect it, who processes it on our behalf, and
            the choices you have. It is written to align with the Digital Personal Data Protection Act, 2023 (DPDP Act).
          </p>

          <h2>1. What data we collect</h2>
          <ul>
            <li><strong>Account and signup data:</strong> your full name, WhatsApp number and email address, collected through our signup and early-access forms.</li>
            <li><strong>Usage and query data:</strong> the GST/ITR questions you ask the AI assistant, the language you use (Gujarati, Hindi or English), and activity shown in your dashboard (query counts, client link usage).</li>
            <li><strong>Client data entered by CAs:</strong> if you are a CA or tax consultant, you may input information about your own clients (names, contact details, query history). You are responsible for having the authority to share that data with us; we process it only to provide the service to you.</li>
            <li><strong>Payment data:</strong> subscription payments are processed by Razorpay. We do not store your card, UPI or bank details on our servers; we receive only payment status and transaction references.</li>
          </ul>

          <h2>2. How we use your data</h2>
          <ul>
            <li>To provide the AI assistant service — answering your tax questions and running your CA dashboard.</li>
            <li>To send you WhatsApp and email notifications you have asked for (onboarding, deadline reminders, subscription updates).</li>
            <li>To improve the product — for example, understanding which questions are common so answers get better. We do not sell your personal data to anyone.</li>
          </ul>

          <h2>3. Third-party processors</h2>
          <p>We use the following services to run TaxSathi. Each processes only the data needed for its function:</p>
          <ul>
            <li><strong>Supabase</strong> — database and authentication hosting. Your account data, queries and client records are stored here.</li>
            <li><strong>Google Gemini API</strong> — AI processing. The text of your questions is sent to Google's Gemini API to generate answers.</li>
            <li><strong>Resend</strong> — transactional email. Your email address is used to deliver signup, onboarding and account emails.</li>
            <li><strong>Razorpay</strong> — payment processing for subscriptions. Payment details you enter at checkout go directly to Razorpay.</li>
          </ul>

          <h2>4. Data retention and deletion</h2>
          <p>
            We keep your account and query data for as long as your account is active, and for a reasonable period
            afterwards to meet legal and accounting obligations. You can request deletion of your account and
            associated personal data at any time by emailing <a href="mailto:contact@taxsathi.online">contact@taxsathi.online</a> from
            your registered email address. We will confirm and complete deletion within 30 days, except where we are
            required by law to retain specific records (for example, payment transaction records).
          </p>

          <h2>5. Cookies and tracking</h2>
          <p>
            We do not run advertising trackers, analytics cookies or third-party pixels on taxsathi.online.
            Our authentication provider (Supabase) stores a session token in your browser's local storage so you stay
            logged in — this is functional storage, not tracking. Razorpay's checkout may set its own cookies during
            payment, governed by Razorpay's privacy policy. If this changes in future, we will update this page before
            enabling any new tracking.
          </p>

          <h2>6. Data security</h2>
          <p>
            Access to production data is restricted to the operating team, data is transmitted over HTTPS, and
            authentication is handled by Supabase Auth. No method of transmission or storage is 100% secure, but we
            work to protect your data and will notify affected users if a breach puts their personal data at risk.
          </p>

          <h2>7. Your rights</h2>
          <p>
            Under the DPDP Act, 2023, you can request access to your personal data, correction of inaccurate data,
            and erasure (see Section 4). You may also withdraw consent for WhatsApp/email notifications at any time by
            writing to us.
          </p>

          <h2>8. Contact</h2>
          <p>
            Questions about this policy or your data: <a href="mailto:contact@taxsathi.online">contact@taxsathi.online</a>.
          </p>
        </div>
      </div>
    </Shell>
  );
}
