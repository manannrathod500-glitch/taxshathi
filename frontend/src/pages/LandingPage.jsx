import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowRight, Users, Shield, Zap, Check, MessageCircle,
  ChevronDown, Star, Bot, Clock, TrendingUp, FileText, Globe
} from 'lucide-react';
 
const supabaseUrl = 'https://qjinbmuredxreupqwoqf.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
 
// ── Reusable Brand Logo Component ─────────────────────────────────────────────
// Matches the SidebarLogo in Dashboard.jsx exactly.
// size: "nav" = navbar (medium), "hero" = large centered, "footer" = small
const BrandLogo = ({ size = 'nav' }) => {
  const configs = {
    nav:    { iconSize: 32, fontSize: 15, subSize: 11, gap: 9 },
    hero:   { iconSize: 52, fontSize: 24, subSize: 14, gap: 14 },
    footer: { iconSize: 26, fontSize: 12, subSize: 9,  gap: 7  },
  };
  const c = configs[size];
 
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: c.gap, flexShrink: 0 }}>
      <img
        src="/favicon.png"
        alt="TaxSathi"
        style={{
          width: c.iconSize,
          height: c.iconSize,
          borderRadius: Math.round(c.iconSize * 0.22),
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
      <div style={{ lineHeight: 1.15, whiteSpace: 'nowrap' }}>
        <div
          style={{
            color: '#ffffff',
            fontWeight: 800,
            fontSize: c.fontSize,
            letterSpacing: '0.03em',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          TAX SATHI
        </div>
        <div
          style={{
            color: '#a78bfa',
            fontWeight: 700,
            fontSize: c.subSize,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          AI
        </div>
      </div>
    </div>
  );
};
 
export default function LandingPage() {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const { error } = await supabase.from('waitlist').insert([
        { name, whatsapp, email, created_at: new Date().toISOString() },
      ]);
      if (error) throw error;
      await fetch(
        'https://qjinbmuredxreupqwoqf.supabase.co/functions/v1/send-welcome-email',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseAnonKey}` },
          body: JSON.stringify({ name, email }),
        }
      );
      setSubmitted(true);
      setName(''); setWhatsapp(''); setEmail('');
    } catch (error) {
      console.error(error);
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const API = process.env.REACT_APP_BACKEND_URL || '';

  const handlePayment = async (planName, amountInINR) => {
    if (!window.Razorpay) {
      alert("Razorpay SDK failed to load. Please check your internet connection.");
      return;
    }

    try {
      // Step 1: Create order on backend
      const orderRes = await fetch(`${API}/api/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_name: planName,
          customer_name: name || undefined,
          customer_email: email || undefined,
          customer_phone: whatsapp || undefined,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        alert(err.detail || 'Failed to create payment order. Please try again.');
        return;
      }

      const order = await orderRes.json();

      // Step 2: Open Razorpay Checkout with order_id
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "TaxSathi AI",
        description: order.description,
        image: "/favicon.png",
        order_id: order.order_id,
        handler: async function (response) {
          // Step 3: Verify payment on backend
          try {
            const verifyRes = await fetch(`${API}/api/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_name: planName,
                customer_name: name || undefined,
                customer_email: email || undefined,
                customer_phone: whatsapp || undefined,
              }),
            });
            const result = await verifyRes.json();
            if (verifyRes.ok && result.success) {
              alert(`🎉 Payment successful!\n\nPlan: ${planName}\nPayment ID: ${response.razorpay_payment_id}\n\nYour ${planName} plan is now active!`);
            } else {
              alert("Payment received but verification failed. Please contact support.");
            }
          } catch {
            alert("Payment received. Verification pending — please contact support if not activated within 24 hours.");
          }
        },
        prefill: {
          name: name || "",
          email: email || "",
          contact: whatsapp || "",
        },
        theme: {
          color: "#8b5cf6",
        },
        modal: {
          ondismiss: function () {
            console.log("Payment modal closed");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert(`Payment failed: ${response.error.description}\nPlease try again.`);
      });
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      alert('Something went wrong. Please try again.');
    }
  };
 
  const faqs = [
    { q: 'Do freelancers need GST registration in India?', a: 'Yes, if your annual turnover crosses the applicable GST threshold or if you provide interstate services in certain categories.' },
    { q: 'Can I file ITR without Form 16?', a: 'Yes. You can use salary slips, AIS, bank statements, and Form 26AS to file your return accurately.' },
    { q: 'How can I save tax legally?', a: 'You can use deductions like 80C, 80D, HRA, NPS, and smart salary structuring to reduce tax liability.' },
    { q: 'What happens if GST returns are filed late?', a: 'Late filing may lead to penalties, interest, and compliance notices from the GST department.' },
    { q: 'Can TaxSathi help with tax notices?', a: 'Yes. TaxSathi AI explains notices in simple language and connects you with experts if required.' },
  ];
 
  const features = [
    { icon: <Bot size={22} />, title: '24/7 AI Tax Assistant', desc: 'Answers GST, ITR, and compliance questions in Gujarati, Hindi, and English — any time, any device.' },
    { icon: <Users size={22} />, title: 'CA Client Management', desc: 'Give your clients a personal AI link. Track usage, queries, and activity from your dashboard.' },
    { icon: <Zap size={22} />, title: 'Instant Answers', desc: 'No waiting. AI responds in seconds with accurate, regulation-aware answers tailored to India.' },
    { icon: <Globe size={22} />, title: 'Multilingual Support', desc: 'Gujarati, Hindi, English — communicate with every client in their preferred language.' },
    { icon: <Shield size={22} />, title: 'Always Compliant', desc: 'Updated with the latest GST rules, ITR forms, and CBIC notifications automatically.' },
    { icon: <TrendingUp size={22} />, title: 'Grow Your Practice', desc: 'Handle more clients without more calls. Save 2–3 hours daily per CA with AI-assisted support.' },
  ];
 
  const plans = [
    {
      name: 'Free Trial',
      price: '₹0',
      period: '7 days',
      desc: 'Try TaxSathi risk-free',
      features: ['5 client links', '50 AI queries/month', 'Dashboard access', 'WhatsApp sharing'],
      cta: 'Start Free',
      highlight: false,
    },
    {
      name: 'Starter',
      price: '₹1,499',
      period: '/month',
      desc: 'For growing CA practices',
      features: ['20 client links', '500 AI queries/month', 'QR code generator', 'Client activity tracking', 'Email support'],
      cta: 'Get Started',
      highlight: true,
      amount: 1499,
    },
    {
      name: 'Pro',
      price: '₹3,999',
      period: '/month',
      desc: 'For established firms',
      features: ['Unlimited client links', 'Unlimited AI queries', 'Priority support', 'CA branding on chatbot', 'Advanced analytics', 'WhatsApp onboarding'],
      cta: 'Go Pro',
      highlight: false,
      amount: 3999,
    },
  ];
 
  const testimonials = [
    { name: 'Rajesh Shah', role: 'CA, Rajkot', text: 'My clients now get instant answers at midnight without calling me. TaxSathi saved me 2 hours daily.', stars: 5 },
    { name: 'Priya Mehta', role: 'Tax Consultant, Ahmedabad', text: 'The Gujarati language support is outstanding. My local clients love it.', stars: 5 },
    { name: 'Amit Patel', role: 'SME Owner, Surat', text: 'Finally understood GST returns without calling my CA every time. Game changer.', stars: 5 },
  ];
 
  const S = {
    page: { background: '#07050f', color: '#e8e0ff', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' },
    nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(7,5,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(139,92,246,0.15)', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    navBtn: { background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' },
 
    // Hero
    hero: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 20px 80px', textAlign: 'center', borderBottom: '1px solid rgba(139,92,246,0.12)' },
    heroBg: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 70%)', pointerEvents: 'none' },
    badge: { display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.08)', borderRadius: 999, padding: '6px 16px', fontSize: 12, color: '#a78bfa', marginBottom: 24 },
    dot: { width: 7, height: 7, background: '#8b5cf6', borderRadius: '50%', animation: 'pulse 2s infinite' },
    h1: { fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-1.5px', marginBottom: 20, color: '#fff' },
    gradText: { background: 'linear-gradient(90deg, #a78bfa, #7c3aed, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    heroSub: { color: '#9ca3af', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', maxWidth: 580, margin: '0 auto 36px', lineHeight: 1.7 },
    btnRow: { display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
    btnPrimary: { background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' },
    btnSecondary: { background: 'transparent', color: '#e8e0ff', border: '1.5px solid rgba(139,92,246,0.4)', borderRadius: 12, padding: '13px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' },
    gujarati: { fontFamily: "'Noto Sans Gujarati', sans-serif", fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', color: '#c4b5fd', marginBottom: 12, lineHeight: 1.8 },
 
    // Sections
    section: { padding: 'clamp(60px, 8vw, 100px) 20px' },
    sectionInner: { maxWidth: 1100, margin: '0 auto' },
    sectionLabel: { fontSize: 11, fontWeight: 700, letterSpacing: 4, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' },
    sectionTitle: { fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, textAlign: 'center', color: '#fff', marginBottom: 14, letterSpacing: '-0.5px' },
    sectionDesc: { color: '#9ca3af', textAlign: 'center', fontSize: 15, marginBottom: 56, maxWidth: 540, margin: '0 auto 56px' },
 
    // Features grid
    featGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 },
    featCard: { background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 16, padding: '28px 24px' },
    featIcon: { width: 46, height: 46, background: 'rgba(124,58,237,0.18)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', marginBottom: 16 },
    featTitle: { fontSize: 15, fontWeight: 700, color: '#e8e0ff', marginBottom: 8 },
    featDesc: { fontSize: 13.5, color: '#9ca3af', lineHeight: 1.65 },
 
    // Pricing
    plansGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 960, margin: '0 auto' },
    planCard: (h) => ({ background: h ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(139,92,246,0.1))' : 'rgba(255,255,255,0.03)', border: h ? '1.5px solid #8b5cf6' : '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '32px 28px', position: 'relative' }),
    planBadge: { position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg,#7c3aed,#8b5cf6)', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '4px 14px', letterSpacing: 1 },
    planName: { fontSize: 14, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
    planPrice: { fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: -1 },
    planPeriod: { fontSize: 14, color: '#9ca3af' },
    planDesc: { fontSize: 13, color: '#9ca3af', marginBottom: 24, marginTop: 4 },
    planFeats: { listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 },
    planFeat: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#d4d0e8' },
    planCheck: { color: '#8b5cf6', flexShrink: 0 },
    planBtn: (h) => ({ width: '100%', background: h ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)' : 'rgba(139,92,246,0.15)', color: '#fff', border: h ? 'none' : '1px solid rgba(139,92,246,0.3)', borderRadius: 12, padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }),
 
    // Testimonials
    testiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 },
    testiCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: 16, padding: '28px 24px' },
    testiStars: { display: 'flex', gap: 3, marginBottom: 14 },
    testiText: { fontSize: 14, color: '#c4b5fd', lineHeight: 1.7, marginBottom: 18, fontStyle: 'italic' },
    testiName: { fontSize: 14, fontWeight: 700, color: '#fff' },
    testiRole: { fontSize: 12, color: '#6b7280' },
 
    // FAQ
    faqItem: { border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12, marginBottom: 10, overflow: 'hidden' },
    faqQ: { width: '100%', background: 'rgba(139,92,246,0.05)', border: 'none', color: '#e8e0ff', fontSize: 14, fontWeight: 600, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' },
    faqA: { padding: '0 20px 18px', fontSize: 13.5, color: '#9ca3af', lineHeight: 1.7 },
 
    // Waitlist / CTA
    ctaBox: { background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(139,92,246,0.08))', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 24, padding: 'clamp(40px, 6vw, 70px) clamp(20px, 5vw, 60px)', textAlign: 'center', maxWidth: 700, margin: '0 auto' },
    input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 },
    submitBtn: { width: '100%', background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
 
    // Footer
    footer: { borderTop: '1px solid rgba(139,92,246,0.12)', padding: '40px 20px', textAlign: 'center', color: '#4b5563', fontSize: 13 },
  };
 
  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Noto+Sans+Gujarati:wght@400;600&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: #4b5563; }
        input:focus { border-color: rgba(139,92,246,0.5) !important; }
      `}</style>
 
      {/* ── NAV ── */}
      <nav style={S.nav}>
        {/*
          BrandLogo size="nav" → favicon icon (32px) + "TAX SATHI / AI" text.
          Matches the dashboard sidebar logo exactly. No dark-bg image artifact.
        */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <BrandLogo size="nav" />
        </Link>
        <Link to="/login" style={S.navBtn}>Login</Link>
      </nav>
 
      {/* ── HERO ── */}
      <section style={S.hero}>
        <div style={S.heroBg} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 860, width: '100%' }}>
          <div style={S.badge}>
            <span style={S.dot} />
            Trusted by tax professionals & Indian SMBs
          </div>
 
          {/*
            Hero logo: large BrandLogo centered above the headline.
            size="hero" → 52px icon + big text. Acts as the brand anchor.
            Consistent with dashboard, no image background bleed issues.
          */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <BrandLogo size="hero" />
          </div>
 
          <h1 style={S.h1}>
            Get GST/ITR Clients Daily —<br />
            <span style={S.gradText}>Without Cold Calling</span>
          </h1>
          <p style={S.gujarati}>તમારો સ્માર્ટ GST અને ITR ગ્રોથ પાર્ટનર</p>
          <p style={S.heroSub}>AI-powered lead generation & GST automation for Indian CAs and SMB-focused professionals</p>
          <div style={S.btnRow}>
            <Link to="/login" style={S.btnPrimary}>Start Free Trial <ArrowRight size={15} /></Link>
            <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" style={S.btnSecondary}>
              <MessageCircle size={15} /> WhatsApp Us
            </a>
          </div>
 
          {/* Stats bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '32px', marginTop: 56, borderTop: '1px solid rgba(139,92,246,0.12)', paddingTop: 40 }}>
            {[['500+', 'CAs on Waitlist'], ['3 Languages', 'Gujarati · Hindi · English'], ['₹1,499/mo', 'Starting Price'], ['24/7', 'AI Available']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#a78bfa', letterSpacing: -0.5 }}>{val}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* ── FEATURES ── */}
      <section style={{ ...S.section, background: 'rgba(139,92,246,0.03)' }}>
        <div style={S.sectionInner}>
          <div style={S.sectionLabel}>What You Get</div>
          <h2 style={S.sectionTitle}>Everything a CA Needs to Scale</h2>
          <p style={S.sectionDesc}>One platform. AI-powered. Built for Indian tax professionals.</p>
          <div style={S.featGrid}>
            {features.map(f => (
              <div key={f.title} style={S.featCard}>
                <div style={S.featIcon}>{f.icon}</div>
                <div style={S.featTitle}>{f.title}</div>
                <div style={S.featDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* ── HOW IT WORKS ── */}
      <section style={S.section}>
        <div style={S.sectionInner}>
          <div style={S.sectionLabel}>How It Works</div>
          <h2 style={S.sectionTitle}>3 Steps to Your AI-Powered Practice</h2>
          <p style={{ ...S.sectionDesc, marginBottom: 52 }}>Set up in under 5 minutes. No tech skills required.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              { step: '01', title: 'Sign Up & Get Your Link', desc: 'Create your TaxSathi account and receive a unique CA link — taxsathi.online/ca/yourname' },
              { step: '02', title: 'Share with Clients', desc: 'Send your link on WhatsApp or print your QR code. Clients tap it and start chatting instantly.' },
              { step: '03', title: 'Track & Grow', desc: 'See how many clients used it, what they asked, and how much time you saved — all in one dashboard.' },
            ].map(item => (
              <div key={item.step} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: 16, padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 56, fontWeight: 900, color: 'rgba(139,92,246,0.1)', position: 'absolute', top: 10, right: 16, lineHeight: 1 }}>{item.step}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', letterSpacing: 3, marginBottom: 12 }}>STEP {item.step}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{item.title}</div>
                <div style={{ fontSize: 13.5, color: '#9ca3af', lineHeight: 1.65 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* ── PRICING ── */}
      <section style={{ ...S.section, background: 'rgba(139,92,246,0.03)' }}>
        <div style={S.sectionInner}>
          <div style={S.sectionLabel}>Pricing</div>
          <h2 style={S.sectionTitle}>Simple, Transparent Pricing</h2>
          <p style={{ ...S.sectionDesc, marginBottom: 52 }}>Start free. Upgrade when you're ready. No hidden fees.</p>
          <div style={S.plansGrid}>
            {plans.map(plan => (
              <div key={plan.name} style={S.planCard(plan.highlight)}>
                {plan.highlight && <div style={S.planBadge}>MOST POPULAR</div>}
                <div style={S.planName}>{plan.name}</div>
                <div>
                  <span style={S.planPrice}>{plan.price}</span>
                  <span style={S.planPeriod}> {plan.period}</span>
                </div>
                <div style={S.planDesc}>{plan.desc}</div>
                <ul style={S.planFeats}>
                  {plan.features.map(f => (
                    <li key={f} style={S.planFeat}>
                      <Check size={15} style={S.planCheck} />{f}
                    </li>
                  ))}
                </ul>
                {plan.price === '₹0' ? (
                  <Link to="/login" style={{ ...S.planBtn(plan.highlight), display: 'block', textAlign: 'center', textDecoration: 'none', lineHeight: '44px', padding: 0 }}>
                    {plan.cta}
                  </Link>
                ) : (
                  <button onClick={() => handlePayment(plan.name, plan.amount)} style={S.planBtn(plan.highlight)}>
                    {plan.cta}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* ── TESTIMONIALS ── */}
      <section style={S.section}>
        <div style={S.sectionInner}>
          <div style={S.sectionLabel}>What They Say</div>
          <h2 style={S.sectionTitle}>Loved by CAs Across Gujarat</h2>
          <p style={{ ...S.sectionDesc, marginBottom: 48 }}>Real feedback from tax professionals using TaxSathi.</p>
          <div style={S.testiGrid}>
            {testimonials.map(t => (
              <div key={t.name} style={S.testiCard}>
                <div style={S.testiStars}>{[...Array(t.stars)].map((_, i) => <Star key={i} size={14} fill="#8b5cf6" color="#8b5cf6" />)}</div>
                <p style={S.testiText}>"{t.text}"</p>
                <div style={S.testiName}>{t.name}</div>
                <div style={S.testiRole}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* ── FAQ ── */}
      <section style={{ ...S.section, background: 'rgba(139,92,246,0.03)' }}>
        <div style={{ ...S.sectionInner, maxWidth: 720 }}>
          <div style={S.sectionLabel}>FAQ</div>
          <h2 style={S.sectionTitle}>Common Tax Questions</h2>
          <p style={{ ...S.sectionDesc, marginBottom: 44 }}>Answers to questions your clients ask every day.</p>
          {faqs.map((faq, i) => (
            <div key={i} style={S.faqItem}>
              <button style={S.faqQ} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {faq.q}
                <ChevronDown size={16} style={{ color: '#8b5cf6', transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0, marginLeft: 12 }} />
              </button>
              {openFaq === i && <div style={S.faqA}>{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>
 
      {/* ── WAITLIST CTA ── */}
      <section style={S.section}>
        <div style={S.sectionInner}>
          <div style={S.ctaBox}>
            <div style={S.sectionLabel}>Join the Waitlist</div>
            <h2 style={{ ...S.sectionTitle, marginBottom: 8 }}>Start Your Free 14-Day Trial</h2>
            <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 32 }}>Join 500+ CAs already on the waitlist. No credit card required.</p>
            {submitted ? (
              <div style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid #8b5cf6', borderRadius: 14, padding: '28px 20px' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#a78bfa', marginBottom: 6 }}>You're on the list!</div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>We'll contact you on WhatsApp shortly. Check your email too!</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <input style={S.input} type="text" placeholder="Your Full Name" value={name} onChange={e => setName(e.target.value)} required />
                <input style={S.input} type="tel" placeholder="WhatsApp Number (+91...)" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required />
                <input style={S.input} type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required />
                {errorMessage && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>{errorMessage}</div>}
                <button style={S.submitBtn} type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Join Free Waitlist →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
 
      {/* ── FOOTER ── */}
      <footer style={S.footer}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/*
            Footer logo: BrandLogo size="footer" → small 26px icon + compact text.
            Consistent with nav and hero. No image rendering issues.
          */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <BrandLogo size="footer" />
          </div>
          <div style={{ marginBottom: 16 }}>India's AI-powered GST & ITR assistant for CAs and businesses.</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px 32px', marginBottom: 20 }}>
            <Link to="/login" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 13 }}>Login</Link>
            <a href="https://wa.me/919999999999" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 13 }}>WhatsApp</a>
            <span style={{ color: '#374151', fontSize: 13 }}>contact@taxsathi.online</span>
          </div>
          <div>© {new Date().getFullYear()} TaxSathi AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
 
