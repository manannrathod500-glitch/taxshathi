import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import {
  ArrowRight, Users, Shield, Zap, Check, MessageCircle,
  ChevronDown, Bot, TrendingUp, Globe, Sparkles, IndianRupee, Languages
} from 'lucide-react';

const supabaseUrl = 'https://qjinbmuredxreupqwoqf.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
// Fallback mirrors lib/supabaseClient.js so the page doesn't crash at import
// time when the anon key env var is missing (e.g. local dev without .env).
const supabase = createClient(supabaseUrl, supabaseAnonKey || 'placeholder_anon_key');

// ── Reusable Brand Logo Component ─────────────────────────────────────────────
// Matches the SidebarLogo in Dashboard.jsx exactly.
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

// ── Scroll-reveal wrapper ──────────────────────────────────────────────────────
const Reveal = ({ children, delay = 0, y = 28, style }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.6, delay, ease: [0.21, 0.6, 0.35, 1] }}
    style={style}
  >
    {children}
  </motion.div>
);

// ── Cursor glow: soft light that follows the mouse (desktop only) ─────────────
const CursorGlow = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia('(pointer: fine)').matches) return;
    let raf = null;
    const move = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${e.clientX - 320}px, ${e.clientY - 320}px)`;
        raf = null;
      });
    };
    window.addEventListener('mousemove', move, { passive: true });
    return () => { window.removeEventListener('mousemove', move); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return <div ref={ref} className="ts-cursor-glow" aria-hidden="true" />;
};

// ── Scroll progress bar: fills left→right as you scroll top→bottom ───────────
const ScrollProgress = () => {
  const ref = useRef(null);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? h.scrollTop / max : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${p})`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <div ref={ref} className="ts-progress" aria-hidden="true" />;
};

// ── 3D tilt-toward-mouse wrapper (used on the hero phone, desktop only) ──────
const TiltWrap = ({ children }) => {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el || !window.matchMedia('(pointer: fine)').matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)';
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ transition: 'transform 0.2s ease-out', willChange: 'transform' }}>
      {children}
    </div>
  );
};

// ── Live AI chat demo (the hero animation — the product in motion) ────────────
const DEMO_SCRIPT = [
  { role: 'user', text: 'GSTR-3B late fee kitni hai?' },
  { role: 'ai', text: '₹50/day (₹25 CGST + ₹25 SGST). Nil return: ₹20/day. Plus 18% p.a. interest on late tax. 📌' },
  { role: 'user', text: 'મારે GST રજિસ્ટ્રેશન કરાવવું પડે?' },
  { role: 'ai', text: 'સર્વિસ માટે ₹20 લાખ અને માલ માટે ₹40 લાખ ટર્નઓવર પછી ફરજિયાત. Online વેચાણ હોય તો પહેલા દિવસથી જ. ✅' },
  { role: 'user', text: 'Can I file ITR without Form 16?' },
  { role: 'ai', text: 'Yes! Use salary slips, AIS and Form 26AS — I will guide you step by step. 👍' },
];

const ChatDemo = () => {
  const [messages, setMessages] = useState([]);
  const [typingText, setTypingText] = useState(null); // AI text being typed
  const [showDots, setShowDots] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const pending = [];
    const later = (fn, ms) => {
      const t = setTimeout(() => { if (!cancelled) fn(); }, ms);
      pending.push(t);
    };

    const playFrom = (i) => {
      if (i >= DEMO_SCRIPT.length) {
        // pause, then loop
        later(() => { setMessages([]); playFrom(0); }, 4200);
        return;
      }
      const msg = DEMO_SCRIPT[i];
      if (msg.role === 'user') {
        later(() => {
          setMessages(prev => [...prev, msg]);
          playFrom(i + 1);
        }, 900);
      } else {
        // AI: typing dots, then typewriter
        later(() => {
          setShowDots(true);
          later(() => {
            setShowDots(false);
            let pos = 0;
            const typeStep = () => {
              pos += 2;
              if (pos >= msg.text.length) {
                setTypingText(null);
                setMessages(prev => [...prev, msg]);
                playFrom(i + 1);
              } else {
                setTypingText(msg.text.slice(0, pos));
                later(typeStep, 28);
              }
            };
            typeStep();
          }, 1100);
        }, 500);
      }
    };

    playFrom(0);
    return () => { cancelled = true; pending.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typingText, showDots]);

  const bubble = (m, i, partial = false) => (
    <motion.div
      key={partial ? 'typing' : i}
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      style={{
        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
        maxWidth: '82%',
        background: m.role === 'user' ? 'linear-gradient(135deg,#7c3aed,#8b5cf6)' : 'rgba(255,255,255,0.07)',
        border: m.role === 'user' ? 'none' : '1px solid rgba(139,92,246,0.25)',
        color: m.role === 'user' ? '#fff' : '#e8e0ff',
        borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        padding: '10px 14px',
        fontSize: 13.5,
        lineHeight: 1.55,
        fontFamily: "'DM Sans','Noto Sans Gujarati',sans-serif",
      }}
    >
      {m.text}{partial && <span className="ts-caret">▍</span>}
    </motion.div>
  );

  return (
    <div className="ts-phone" aria-hidden="true">
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid rgba(139,92,246,0.18)' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bot size={17} style={{ color: '#a78bfa' }} />
        </div>
        <div>
          <div style={{ color: '#fff', fontSize: 13.5, fontWeight: 700 }}>TaxSathi AI</div>
          <div style={{ color: '#34d399', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, background: '#34d399', borderRadius: '50%', display: 'inline-block' }} className="ts-pulse" /> Online · replies in seconds
          </div>
        </div>
      </div>
      {/* messages */}
      <div ref={scrollRef} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 14px' }}>
        {messages.map((m, i) => bubble(m, i))}
        {typingText !== null && bubble({ role: 'ai', text: typingText }, -1, true)}
        {showDots && (
          <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '16px 16px 16px 4px', padding: '12px 16px', display: 'flex', gap: 4 }}>
            <span className="ts-dot" /><span className="ts-dot" style={{ animationDelay: '0.15s' }} /><span className="ts-dot" style={{ animationDelay: '0.3s' }} />
          </div>
        )}
      </div>
      {/* input bar (decorative) */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(139,92,246,0.18)', display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 13px', color: '#6b7280', fontSize: 12.5 }}>
          GST ya ITR sawaal poochho…
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowRight size={15} color="#fff" />
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

  const audiences = [
    { icon: <Users size={20} />, who: 'CA Firms & Tax Consultants', pain: 'Same 40 questions, 40 times a month, on WhatsApp.', gain: 'Give every client your AI link — it answers the routine 80% so you handle the 20% that needs real judgment.' },
    { icon: <IndianRupee size={20} />, who: 'Small Business Owners', pain: '"GST late fee kitni? Kab file karna hai?" — and your CA is busy.', gain: 'Instant answers in your language, 24/7, plus deadline clarity before penalties hit.' },
    { icon: <Languages size={20} />, who: 'Gujarat Traders & Freelancers', pain: 'Tax content is in English. Your business runs in Gujarati.', gain: 'Ask in ગુજરાતી, get answers in ગુજરાતી. No translation, no confusion.' },
  ];

  const marqueeItems = [
    'ગુજરાતી · हिंदी · English', 'GST Returns', 'ITR Filing', 'Late-fee Calculator', 'TDS / TCS Rules',
    'Notice Explanations', '24/7 Availability', 'WhatsApp Sharing', 'Client QR Codes', 'Compliance Deadlines',
  ];

  const S = {
    page: { background: '#07050f', color: '#e8e0ff', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' },
    nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(7,5,15,0.78)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(139,92,246,0.15)', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    navLinks: { display: 'flex', alignItems: 'center', gap: 26 },
    navLink: { color: '#9ca3af', textDecoration: 'none', fontSize: 13.5, fontWeight: 500 },
    navBtn: { background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' },

    badge: { display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.08)', borderRadius: 999, padding: '6px 16px', fontSize: 12, color: '#a78bfa', marginBottom: 24 },
    dot: { width: 7, height: 7, background: '#8b5cf6', borderRadius: '50%' },
    h1: { fontSize: 'clamp(2.2rem, 5vw, 3.9rem)', fontWeight: 900, lineHeight: 1.07, letterSpacing: '-1.5px', marginBottom: 18, color: '#fff' },
    gradText: { background: 'linear-gradient(90deg, #a78bfa, #7c3aed, #c4b5fd, #a78bfa)', backgroundSize: '300% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'ts-gradshift 6s ease infinite' },
    heroSub: { color: '#9ca3af', fontSize: 'clamp(0.95rem, 2vw, 1.08rem)', maxWidth: 520, margin: '0 0 32px', lineHeight: 1.7 },
    btnRow: { display: 'flex', flexWrap: 'wrap', gap: 12 },
    btnPrimary: { background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', boxShadow: '0 8px 30px rgba(124,58,237,0.35)' },
    btnSecondary: { background: 'rgba(255,255,255,0.03)', color: '#e8e0ff', border: '1.5px solid rgba(139,92,246,0.4)', borderRadius: 12, padding: '13px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' },
    gujarati: { fontFamily: "'Noto Sans Gujarati', sans-serif", fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)', color: '#c4b5fd', marginBottom: 14, lineHeight: 1.8 },

    section: { padding: 'clamp(60px, 8vw, 100px) 20px', position: 'relative' },
    sectionInner: { maxWidth: 1100, margin: '0 auto' },
    sectionLabel: { fontSize: 11, fontWeight: 700, letterSpacing: 4, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' },
    sectionTitle: { fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, textAlign: 'center', color: '#fff', marginBottom: 14, letterSpacing: '-0.5px' },
    sectionDesc: { color: '#9ca3af', textAlign: 'center', fontSize: 15, marginBottom: 56, maxWidth: 540, margin: '0 auto 56px' },

    featGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 },
    featTitle: { fontSize: 15, fontWeight: 700, color: '#e8e0ff', marginBottom: 8 },
    featDesc: { fontSize: 13.5, color: '#9ca3af', lineHeight: 1.65 },

    plansGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 960, margin: '0 auto' },
    planBadge: { position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg,#7c3aed,#8b5cf6)', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '4px 14px', letterSpacing: 1 },
    planName: { fontSize: 14, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
    planPrice: { fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: -1 },
    planPeriod: { fontSize: 14, color: '#9ca3af' },
    planDesc: { fontSize: 13, color: '#9ca3af', marginBottom: 24, marginTop: 4 },
    planFeats: { listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 },
    planFeat: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#d4d0e8' },
    planCheck: { color: '#8b5cf6', flexShrink: 0 },
    planBtn: (h) => ({ width: '100%', background: h ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)' : 'rgba(139,92,246,0.15)', color: '#fff', border: h ? 'none' : '1px solid rgba(139,92,246,0.3)', borderRadius: 12, padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }),

    faqItem: { border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12, marginBottom: 10, overflow: 'hidden' },
    faqQ: { width: '100%', background: 'rgba(139,92,246,0.05)', border: 'none', color: '#e8e0ff', fontSize: 14, fontWeight: 600, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' },
    faqA: { padding: '0 20px 18px', fontSize: 13.5, color: '#9ca3af', lineHeight: 1.7 },

    ctaBox: { position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(139,92,246,0.08))', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 24, padding: 'clamp(40px, 6vw, 70px) clamp(20px, 5vw, 60px)', textAlign: 'center', maxWidth: 700, margin: '0 auto' },
    input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 },
    submitBtn: { width: '100%', background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 },

    footer: { borderTop: '1px solid rgba(139,92,246,0.12)', padding: '40px 20px', textAlign: 'center', color: '#4b5563', fontSize: 13 },
  };

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Noto+Sans+Gujarati:wght@400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: #4b5563; }
        input:focus { border-color: rgba(139,92,246,0.5) !important; }

        /* animated aurora background */
        @keyframes ts-aurora1 { 0%,100% { transform: translate(-10%, -8%) scale(1); } 50% { transform: translate(8%, 6%) scale(1.15); } }
        @keyframes ts-aurora2 { 0%,100% { transform: translate(10%, 5%) scale(1.1); } 50% { transform: translate(-8%, -6%) scale(0.95); } }
        @keyframes ts-gradshift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes ts-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes ts-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes ts-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes ts-blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes ts-dotbounce { 0%,60%,100% { transform: translateY(0); opacity:.4; } 30% { transform: translateY(-4px); opacity:1; } }

        .ts-pulse { animation: ts-pulse 2s infinite; }
        .ts-caret { animation: ts-blink 0.8s infinite; color: #a78bfa; }
        .ts-dot { width: 7px; height: 7px; border-radius: 50%; background: #a78bfa; display: inline-block; animation: ts-dotbounce 1.2s infinite; }

        .ts-aurora { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
        .ts-aurora::before, .ts-aurora::after { content: ''; position: absolute; width: 60vmax; height: 60vmax; border-radius: 50%; filter: blur(90px); opacity: 0.55; }
        .ts-aurora::before { background: radial-gradient(circle, rgba(124,58,237,0.32), transparent 60%); top: -22vmax; left: -12vmax; animation: ts-aurora1 14s ease-in-out infinite; }
        .ts-aurora::after { background: radial-gradient(circle, rgba(59,130,246,0.18), transparent 60%); bottom: -25vmax; right: -15vmax; animation: ts-aurora2 18s ease-in-out infinite; }

        /* hero layout: 2 cols on desktop, stacked on mobile */
        .ts-hero-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 48px; align-items: center; max-width: 1100px; margin: 0 auto; }
        @media (max-width: 880px) { .ts-hero-grid { grid-template-columns: 1fr; gap: 40px; text-align: center; }
          .ts-hero-grid .ts-hero-copy { display: flex; flex-direction: column; align-items: center; }
          .ts-nav-links { display: none !important; } }

        /* phone mockup */
        .ts-phone { width: min(370px, 92vw); height: 480px; margin: 0 auto; display: flex; flex-direction: column;
          background: linear-gradient(160deg, rgba(19,16,42,0.92), rgba(10,7,32,0.96));
          border: 1px solid rgba(139,92,246,0.35); border-radius: 28px;
          box-shadow: 0 30px 80px rgba(124,58,237,0.25), 0 0 0 1px rgba(255,255,255,0.04) inset;
          animation: ts-float 7s ease-in-out infinite; }

        /* marquee */
        .ts-marquee { overflow: hidden; border-top: 1px solid rgba(139,92,246,0.12); border-bottom: 1px solid rgba(139,92,246,0.12); background: rgba(139,92,246,0.04); padding: 14px 0; }
        .ts-marquee-track { display: flex; gap: 44px; width: max-content; animation: ts-marquee 30s linear infinite; }
        .ts-marquee-item { color: #8b87a8; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; white-space: nowrap; display: flex; align-items: center; gap: 10px; }

        /* card hover lift */
        .ts-card { background: rgba(139,92,246,0.05); border: 1px solid rgba(139,92,246,0.15); border-radius: 16px; padding: 28px 24px; transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease; }
        .ts-card:hover { transform: translateY(-5px); border-color: rgba(139,92,246,0.45); box-shadow: 0 16px 40px rgba(124,58,237,0.18); }
        .ts-icon { width: 46px; height: 46px; background: rgba(124,58,237,0.18); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #a78bfa; margin-bottom: 16px; transition: transform .25s ease; }
        .ts-card:hover .ts-icon { transform: scale(1.12) rotate(-4deg); }

        .ts-plan { position: relative; border-radius: 20px; padding: 32px 28px; transition: transform .25s ease, box-shadow .25s ease; }
        .ts-plan:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(124,58,237,0.2); }

        a.ts-navlink:hover { color: #c4b5fd !important; }
        .ts-btn-glow:hover { filter: brightness(1.12); }

        /* cursor-following glow (desktop pointers only) */
        .ts-cursor-glow { position: fixed; top: 0; left: 0; width: 640px; height: 640px; border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.13), rgba(124,58,237,0.05) 42%, transparent 68%);
          pointer-events: none; z-index: 1; will-change: transform; display: none;
          transform: translate(-1000px, -1000px); }
        @media (pointer: fine) { .ts-cursor-glow { display: block; } }

        /* scroll progress bar */
        .ts-progress { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 60;
          background: linear-gradient(90deg, #7c3aed, #a78bfa, #38bdf8);
          transform-origin: 0 50%; transform: scaleX(0); will-change: transform;
          box-shadow: 0 0 12px rgba(139,92,246,0.7); }
      `}</style>

      <ScrollProgress />
      <CursorGlow />

      {/* ── NAV ── */}
      <nav style={S.nav}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <BrandLogo size="nav" />
        </Link>
        <div className="ts-nav-links" style={S.navLinks}>
          <a className="ts-navlink" href="#features" style={S.navLink}>Features</a>
          <a className="ts-navlink" href="#pricing" style={S.navLink}>Pricing</a>
          <a className="ts-navlink" href="#faq" style={S.navLink}>FAQ</a>
          <Link className="ts-navlink" to="/blog" style={S.navLink}>Blog</Link>
        </div>
        <Link to="/login" style={S.navBtn} className="ts-btn-glow">Login</Link>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 20px 70px', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="ts-aurora" />
        <div className="ts-hero-grid" style={{ position: 'relative', zIndex: 2, width: '100%' }}>
          {/* left: copy */}
          <div className="ts-hero-copy">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              <div style={S.badge}>
                <span style={S.dot} className="ts-pulse" />
                <Sparkles size={12} /> AI tax help for Bharat — in your language
              </div>
            </motion.div>

            <motion.h1 style={S.h1} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}>
              Every GST & ITR answer.<br />
              <span style={S.gradText}>In seconds. In ગુજરાતી.</span>
            </motion.h1>

            <motion.p style={S.gujarati} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.16 }}>
              તમારો સ્માર્ટ GST અને ITR ગ્રોથ પાર્ટનર
            </motion.p>

            <motion.p style={S.heroSub} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.22 }}>
              The 24/7 AI tax assistant for Indian CAs and small businesses.
              Your clients ask on their phone — the AI answers instantly in Gujarati, Hindi or English.
              You get your evenings back.
            </motion.p>

            <motion.div style={S.btnRow} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
              <Link to="/register" style={S.btnPrimary} className="ts-btn-glow">Start Free — No Card Needed <ArrowRight size={15} /></Link>
              <a href="https://wa.me/917698877447" target="_blank" rel="noreferrer" style={S.btnSecondary} className="ts-btn-glow">
                <MessageCircle size={15} /> WhatsApp Us
              </a>
            </motion.div>

            {/* trust stats */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '26px', marginTop: 44 }}
            >
              {[['Free Plan', 'No card needed'], ['3 Languages', 'ગુજરાતી · हिंदी · English'], ['24/7', 'AI available'], ['₹1,499/mo', 'Starting price']].map(([val, label]) => (
                <div key={label}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#a78bfa', letterSpacing: -0.5 }}>{val}</div>
                  <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* right: live product demo */}
          <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.35 }}>
            <TiltWrap>
              <ChatDemo />
            </TiltWrap>
            <div style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: '#6b7280' }}>
              ▲ Live demo — this is exactly what your clients see
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="ts-marquee" aria-hidden="true">
        <div className="ts-marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="ts-marquee-item">
              <span style={{ width: 5, height: 5, background: '#7c3aed', borderRadius: '50%', display: 'inline-block' }} />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── WHO IT'S FOR ── */}
      <section style={S.section}>
        <div style={S.sectionInner}>
          <Reveal>
            <div style={S.sectionLabel}>Built For You</div>
            <h2 style={S.sectionTitle}>Made for How India Actually Works</h2>
            <p style={S.sectionDesc}>Not a translated foreign tool. Built ground-up for Indian tax, Indian languages, Indian businesses.</p>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {audiences.map((a, i) => (
              <Reveal key={a.who} delay={i * 0.12}>
                <div className="ts-card" style={{ height: '100%' }}>
                  <div className="ts-icon">{a.icon}</div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{a.who}</div>
                  <div style={{ fontSize: 13, color: '#f0abfc', lineHeight: 1.6, marginBottom: 10, fontStyle: 'italic' }}>"{a.pain}"</div>
                  <div style={{ fontSize: 13.5, color: '#9ca3af', lineHeight: 1.65 }}>{a.gain}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ ...S.section, background: 'rgba(139,92,246,0.03)' }}>
        <div style={S.sectionInner}>
          <Reveal>
            <div style={S.sectionLabel}>What You Get</div>
            <h2 style={S.sectionTitle}>Everything a CA Needs to Scale</h2>
            <p style={S.sectionDesc}>One platform. AI-powered. Built for Indian tax professionals.</p>
          </Reveal>
          <div style={S.featGrid}>
            {features.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.1}>
                <div className="ts-card" style={{ height: '100%' }}>
                  <div className="ts-icon">{f.icon}</div>
                  <div style={S.featTitle}>{f.title}</div>
                  <div style={S.featDesc}>{f.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={S.section}>
        <div style={S.sectionInner}>
          <Reveal>
            <div style={S.sectionLabel}>How It Works</div>
            <h2 style={S.sectionTitle}>3 Steps to Your AI-Powered Practice</h2>
            <p style={{ ...S.sectionDesc, marginBottom: 52 }}>Set up in under 5 minutes. No tech skills required.</p>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              { step: '01', title: 'Sign Up & Get Your Link', desc: 'Create your TaxSathi account and receive a unique CA link — taxsathi.online/ca/yourname' },
              { step: '02', title: 'Share with Clients', desc: 'Send your link on WhatsApp or print your QR code. Clients tap it and start chatting instantly.' },
              { step: '03', title: 'Track & Grow', desc: 'See how many clients used it, what they asked, and how much time you saved — all in one dashboard.' },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 0.14}>
                <div className="ts-card" style={{ position: 'relative', overflow: 'hidden', height: '100%', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 56, fontWeight: 900, color: 'rgba(139,92,246,0.1)', position: 'absolute', top: 10, right: 16, lineHeight: 1 }}>{item.step}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', letterSpacing: 3, marginBottom: 12 }}>STEP {item.step}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{item.title}</div>
                  <div style={{ fontSize: 13.5, color: '#9ca3af', lineHeight: 1.65 }}>{item.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ ...S.section, background: 'rgba(139,92,246,0.03)' }}>
        <div style={S.sectionInner}>
          <Reveal>
            <div style={S.sectionLabel}>Pricing</div>
            <h2 style={S.sectionTitle}>Simple, Transparent Pricing</h2>
            <p style={{ ...S.sectionDesc, marginBottom: 52 }}>Start free. Upgrade when you're ready. No hidden fees.</p>
          </Reveal>
          <div style={S.plansGrid}>
            {plans.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.12}>
                <div
                  className="ts-plan"
                  style={{
                    background: plan.highlight ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(139,92,246,0.1))' : 'rgba(255,255,255,0.03)',
                    border: plan.highlight ? '1.5px solid #8b5cf6' : '1px solid rgba(255,255,255,0.08)',
                    height: '100%',
                  }}
                >
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
                    <Link to="/register" style={{ ...S.planBtn(plan.highlight), display: 'block', textAlign: 'center', textDecoration: 'none', lineHeight: '44px', padding: 0 }} className="ts-btn-glow">
                      {plan.cta}
                    </Link>
                  ) : (
                    <button onClick={() => handlePayment(plan.name, plan.amount)} style={S.planBtn(plan.highlight)} className="ts-btn-glow">
                      {plan.cta}
                    </button>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={S.section}>
        <div style={{ ...S.sectionInner, maxWidth: 720 }}>
          <Reveal>
            <div style={S.sectionLabel}>FAQ</div>
            <h2 style={S.sectionTitle}>Common Tax Questions</h2>
            <p style={{ ...S.sectionDesc, marginBottom: 44 }}>Answers to questions your clients ask every day.</p>
          </Reveal>
          {faqs.map((faq, i) => (
            <Reveal key={i} delay={i * 0.06} y={16}>
              <div style={S.faqItem}>
                <button style={S.faqQ} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {faq.q}
                  <ChevronDown size={16} style={{ color: '#8b5cf6', transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0, marginLeft: 12 }} />
                </button>
                {openFaq === i && <div style={S.faqA}>{faq.a}</div>}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── WAITLIST CTA ── */}
      <section style={{ ...S.section, background: 'rgba(139,92,246,0.03)' }}>
        <div style={S.sectionInner}>
          <Reveal>
            <div style={S.ctaBox}>
              <div className="ts-aurora" style={{ opacity: 0.5 }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={S.sectionLabel}>Get Early Access</div>
                <h2 style={{ ...S.sectionTitle, marginBottom: 8 }}>Start Free Today</h2>
                <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 32 }}>
                  Be among the first CAs in Gujarat to put AI to work. Free plan — no credit card required.
                </p>
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid #8b5cf6', borderRadius: 14, padding: '28px 20px' }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#a78bfa', marginBottom: 6 }}>You're on the list!</div>
                    <div style={{ fontSize: 13, color: '#9ca3af' }}>We'll contact you on WhatsApp shortly. Check your email too!</div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <input style={S.input} type="text" placeholder="Your Full Name" value={name} onChange={e => setName(e.target.value)} required />
                    <input style={S.input} type="tel" placeholder="WhatsApp Number (+91...)" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required />
                    <input style={S.input} type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required />
                    {errorMessage && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>{errorMessage}</div>}
                    <button style={S.submitBtn} type="submit" disabled={loading} className="ts-btn-glow">
                      {loading ? 'Submitting...' : 'Get Early Access →'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={S.footer}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <BrandLogo size="footer" />
          </div>
          <div style={{ marginBottom: 16 }}>India's AI-powered GST & ITR assistant for CAs and businesses.</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px 32px', marginBottom: 20 }}>
            <Link to="/login" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 13 }}>Login</Link>
            <Link to="/blog" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 13 }}>GST Guides (Blog)</Link>
            <a href="https://wa.me/917698877447" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 13 }}>WhatsApp</a>
            <span style={{ color: '#374151', fontSize: 13 }}>contact@taxsathi.online</span>
          </div>
          <div>© {new Date().getFullYear()} TaxSathi AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
