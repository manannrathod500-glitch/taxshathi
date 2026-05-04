import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  FileText, Receipt, Users, CalendarCheck, Briefcase, BarChart3,
  ArrowRight, ChevronRight, Check, Zap, Globe, Shield, Menu, X, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ── NAVBAR ────────────────────────────────────────────────────────────────────
const Navbar = ({ onOpenWaitlist }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <nav data-testid="navbar" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#050505]/80 backdrop-blur-2xl border-b border-white/8' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" data-testid="nav-logo">
          <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
            <Zap size={14} className="text-black" />
          </div>
          <span className="font-display font-bold text-white text-base">TaxSathi AI</span>
        </Link>
        <div className="hidden md:flex items-center gap-7 text-sm text-zinc-400">
          {[['#modules', 'Modules'], ['#pricing', 'Pricing'], ['/demo', 'AI Demo'], ['/progress', 'Progress']].map(([href, label]) => (
            href.startsWith('#')
              ? <a key={label} href={href} className="hover:text-white transition-colors duration-200">{label}</a>
              : <Link key={label} to={href} className="hover:text-white transition-colors duration-200">{label}</Link>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/analyzer" data-testid="nav-analyzer" className="btn-secondary text-sm py-2 px-4">Module Analyzer</Link>
          <button data-testid="nav-join-waitlist" onClick={onOpenWaitlist} className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
            Join Waitlist <ArrowRight size={14} />
          </button>
        </div>
        <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-[#050505] border-t border-white/8 px-5 py-4 space-y-3">
          {[['#modules', 'Modules'], ['#pricing', 'Pricing'], ['/demo', 'AI Demo'], ['/progress', 'Progress'], ['/analyzer', 'Module Analyzer']].map(([href, label]) => (
            href.startsWith('#')
              ? <a key={label} href={href} onClick={() => setMenuOpen(false)} className="block text-zinc-400 hover:text-white text-sm">{label}</a>
              : <Link key={label} to={href} onClick={() => setMenuOpen(false)} className="block text-zinc-400 hover:text-white text-sm">{label}</Link>
          ))}
          <button onClick={() => { onOpenWaitlist(); setMenuOpen(false); }} className="btn-primary w-full mt-2">Join Waitlist</button>
        </div>
      )}
    </nav>
  );
};

// ── MODULE DATA ───────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'gst', icon: FileText, name: 'AI GST Assistant', desc: 'Auto-draft GSTR-1 & GSTR-3B from your sales data. Smart reminders in Gujarati. Never miss a filing deadline.', status: 'MVP', tier: 'Starter', color: '#22c55e', large: true },
  { id: 'invoice', icon: Receipt, name: 'Smart Invoice Engine', desc: 'WhatsApp order → GST invoice → buyer email → Tally sync. Fully automated.', status: 'MVP', tier: 'Starter', color: '#60a5fa' },
  { id: 'crm', icon: Users, name: 'Buyer/Supplier CRM', desc: 'Track outstanding payments. AI-powered follow-ups in Gujarati. Never lose a rupee.', status: 'Coming Soon', tier: 'Growth', color: '#a78bfa' },
  { id: 'compliance', icon: CalendarCheck, name: 'Compliance Calendar', desc: 'TDS, advance tax, GST deadlines auto-tracked. WhatsApp alerts 7 days before due date.', status: 'Coming Soon', tier: 'Growth', color: '#f59e0b' },
  { id: 'ca', icon: Briefcase, name: 'CA Connect Marketplace', desc: 'Get matched with verified CAs. TaxSathi takes 20-30% platform fee. Done in hours, not days.', status: 'Coming Soon', tier: 'Enterprise', color: '#fb923c' },
  { id: 'insights', icon: BarChart3, name: 'Business Insights', desc: 'Monthly AI-generated P&L, GST summary, and growth report — all in Gujarati/Hindi.', status: 'Coming Soon', tier: 'Enterprise', color: '#e879f9' },
];

const STATUS_BADGE = {
  'MVP': 'badge-live',
  'Coming Soon': 'badge-planned',
  'Building': 'badge-building',
};

// ── WAITLIST MODAL ────────────────────────────────────────────────────────────
const WaitlistModal = ({ open, onClose, initialCount }) => {
  const [form, setForm] = useState({ name: '', email: '', business_type: 'Textile', city: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/waitlist`, form);
      setSuccess(true);
      setPosition(res.data.position);
    } catch { toast.error('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0a0a0a] border border-white/12 rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        {!success ? (
          <>
            <div className="mb-6">
              <div className="mono-label mb-2">Early Access</div>
              <h2 className="text-2xl font-bold text-white font-display">Join the Waitlist</h2>
              <p className="text-zinc-400 text-sm mt-1.5">{initialCount + 1}+ businesses already waiting. Be among the first to get access.</p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              {[
                { key: 'name', label: 'Your Name', placeholder: 'Ramesh Patel', type: 'text' },
                { key: 'email', label: 'Business Email *', placeholder: 'you@business.com', type: 'email', required: true },
                { key: 'city', label: 'City', placeholder: 'Surat, Ahmedabad...', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-zinc-400 text-xs mb-1.5 block">{f.label}</label>
                  <input type={f.type} required={f.required} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} data-testid={`waitlist-${f.key}`}
                    className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors" />
                </div>
              ))}
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">Business Type</label>
                <select value={form.business_type} onChange={e => setForm(p => ({ ...p, business_type: e.target.value }))} data-testid="waitlist-business"
                  className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30">
                  {['Textile', 'Diamond', 'Pharmaceutical', 'Kirana/FMCG', 'Manufacturing', 'Services', 'Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading} data-testid="waitlist-submit"
                className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <>Join Waitlist <ArrowRight size={14} /></>}
              </button>
            </form>
            <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={18} /></button>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Check size={24} className="text-[#22c55e]" />
            </div>
            <h3 className="text-xl font-bold text-white font-display mb-2">You're on the list!</h3>
            <p className="text-zinc-400 text-sm mb-1">You are <span className="text-white font-semibold">#{position}</span> on the waitlist.</p>
            <p className="text-zinc-500 text-xs">We'll notify you when TaxSathi AI launches.</p>
            <button onClick={onClose} className="btn-primary mt-6 px-6 py-2.5">Done</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── LANDING PAGE ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(500);

  useEffect(() => {
    axios.get(`${API}/waitlist/count`).then(r => setWaitlistCount(r.data.count + 487)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] font-body text-white">
      <Navbar onOpenWaitlist={() => setWaitlistOpen(true)} />
      <WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} initialCount={waitlistCount} />

      {/* ── HERO ── */}
      <section className="blueprint-grid relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-5 overflow-hidden">
        <div className="hero-glow" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-white/12 bg-white/4 rounded-full px-4 py-1.5 text-xs text-zinc-400 mb-8 animate-fade-up">
            <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse-dot" />
            Now in Beta — {waitlistCount}+ businesses on waitlist
          </div>
          <div className="animate-fade-up stagger-1 mb-3">
            <div className="mono-label mb-4">TAXSATHI AI</div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display text-white leading-[1.05] tracking-tight">
              <span className="gradient-text">GST. Invoice.</span><br />
              <span className="text-white">CRM. Compliance.</span>
            </h1>
          </div>
          <div className="animate-fade-up stagger-2 my-5">
            <p className="font-gujarati text-2xl sm:text-3xl text-zinc-300 leading-relaxed" style={{ fontFamily: 'Noto Sans Gujarati, sans-serif' }}>
              તમારો સ્માર્ટ GST સાથી
            </p>
            <p className="text-zinc-500 text-sm mt-1">Your Smart GST Companion — Gujarati • Hindi • English</p>
          </div>
          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up stagger-3">
            The complete AI-powered business OS for Indian SMBs. Auto-draft GSTR filings, generate invoices via WhatsApp, track payments, and never miss a compliance deadline — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up stagger-4">
            <button data-testid="hero-join-waitlist" onClick={() => setWaitlistOpen(true)}
              className="btn-primary px-6 py-3 flex items-center gap-2 text-sm">
              Join Waitlist <ArrowRight size={15} />
            </button>
            <Link to="/demo" data-testid="hero-try-demo" className="btn-secondary px-6 py-3 flex items-center gap-2 text-sm">
              <Sparkles size={14} className="text-zinc-400" /> Try AI Demo
            </Link>
          </div>
          <p className="text-zinc-600 text-xs mt-6 animate-fade-up stagger-5">
            Built for Gujarat's 75,000+ textile & diamond traders • All India GST businesses
          </p>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="border-y border-white/8 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-5 py-5 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            ['75,000+', 'SMBs Targeted'],
            ['6', 'AI Modules'],
            ['3', 'Languages (GJ/HI/EN)'],
            ['₹10Cr', 'ARR Goal (18-24 mo)'],
          ].map(([val, label], i) => (
            <div key={i} className="text-center reveal">
              <div className="text-2xl font-bold font-display text-white">{val}</div>
              <div className="text-zinc-500 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <section className="py-28 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 reveal">
            <div className="mono-label mb-3">The Problem</div>
            <h2 className="text-4xl sm:text-5xl font-bold font-display text-white tracking-tight max-w-2xl">
              Why Indian SMBs Are Struggling
            </h2>
            <p className="text-zinc-500 mt-3 max-w-xl">Every month, thousands of Gujarat traders waste hours on manual processes that AI can handle in minutes.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { num: '15+', unit: 'hours/month', title: 'GST Filing Hell', desc: 'Manually entering GSTR-1 data from WhatsApp order lists into the portal.', color: '#ef4444' },
              { num: '30%', unit: 'invoices lost', title: 'Invoice Chaos', desc: 'WhatsApp orders go untracked. Buyers dispute amounts. Tally entry takes hours.', color: '#f59e0b' },
              { num: '₹2L+', unit: 'uncollected/month', title: 'Payment Leakage', desc: 'Outstanding invoices pile up. No automated follow-ups. Cash flow suffers.', color: '#a78bfa' },
              { num: '4x', unit: 'higher CA cost', title: 'Compliance Anxiety', desc: 'TDS, advance tax, annual returns — each deadline costs ₹3,000+ with a CA.', color: '#60a5fa' },
            ].map((p, i) => (
              <div key={i} className="ts-card p-6 reveal" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-3xl font-bold font-display mb-0.5" style={{ color: p.color }}>{p.num}</div>
                <div className="text-zinc-500 text-xs mb-3">{p.unit}</div>
                <div className="text-white font-semibold text-sm mb-2">{p.title}</div>
                <div className="text-zinc-500 text-xs leading-relaxed">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULES BENTO ── */}
      <section id="modules" className="py-28 px-5 border-t border-white/6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 reveal">
            <div className="mono-label mb-3">6 Modules</div>
            <h2 className="text-4xl sm:text-5xl font-bold font-display text-white tracking-tight">One Platform. Six Superpowers.</h2>
            <p className="text-zinc-500 mt-3">Built in sequence. Each module standalone. All better together.</p>
          </div>
          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 reveal">
            {/* Large: GST Assistant */}
            <div className="md:col-span-2 ts-card p-8 min-h-[220px] flex flex-col justify-between group hover:border-[#22c55e]/30 transition-all duration-300">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl flex items-center justify-center">
                    <FileText size={18} style={{ color: '#22c55e' }} />
                  </div>
                  <span className="badge-live mono-label px-2.5 py-1 rounded-full text-[10px]">MVP</span>
                </div>
                <div className="text-white font-semibold text-lg mb-2 font-display">AI GST Assistant</div>
                <p className="text-zinc-500 text-sm leading-relaxed">Auto-draft GSTR-1 & GSTR-3B from sales data. Smart reminders in Gujarati. Connect Google Sheets or Tally — AI does the rest.</p>
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/6">
                <span className="text-zinc-600 text-xs">Starter tier</span>
                <span className="text-zinc-700 text-xs">•</span>
                <span className="text-zinc-600 text-xs">Gemini AI + Composio</span>
              </div>
            </div>
            {/* Invoice Engine */}
            <div className="ts-card p-6 flex flex-col justify-between group hover:border-[#60a5fa]/30 transition-all duration-300">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 bg-[#60a5fa]/10 border border-[#60a5fa]/20 rounded-xl flex items-center justify-center">
                    <Receipt size={16} style={{ color: '#60a5fa' }} />
                  </div>
                  <span className="badge-live mono-label px-2.5 py-1 rounded-full text-[10px]">MVP</span>
                </div>
                <div className="text-white font-semibold text-base mb-2 font-display">Smart Invoice Engine</div>
                <p className="text-zinc-500 text-xs leading-relaxed">WhatsApp order → GST invoice → buyer → Tally sync. Fully automated.</p>
              </div>
              <div className="text-zinc-600 text-xs mt-3 pt-3 border-t border-white/6">Starter tier</div>
            </div>
            {/* CRM */}
            {[
              { id: 'crm', icon: Users, name: 'Buyer/Supplier CRM', desc: 'Track outstanding payments. AI follow-ups in Gujarati.', color: '#a78bfa', tier: 'Growth' },
              { id: 'compliance', icon: CalendarCheck, name: 'Compliance Calendar', desc: 'TDS, GST, advance tax alerts via WhatsApp.', color: '#f59e0b', tier: 'Growth' },
              { id: 'ca', icon: Briefcase, name: 'CA Connect Marketplace', desc: 'Verified CA matching. 20-30% platform revenue.', color: '#fb923c', tier: 'Enterprise' },
            ].map(m => (
              <div key={m.id} className="ts-card p-6 group transition-all duration-300" style={{ '--hover-color': m.color }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${m.color}15`, border: `1px solid ${m.color}25` }}>
                    <m.icon size={16} style={{ color: m.color }} />
                  </div>
                  <span className="badge-planned mono-label px-2.5 py-1 rounded-full text-[10px]">Soon</span>
                </div>
                <div className="text-white font-semibold text-sm mb-1.5 font-display">{m.name}</div>
                <p className="text-zinc-500 text-xs leading-relaxed">{m.desc}</p>
                <div className="text-zinc-600 text-xs mt-3 pt-3 border-t border-white/6">{m.tier} tier</div>
              </div>
            ))}
            {/* Business Insights - full width */}
            <div className="md:col-span-3 ts-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#e879f9]/10 border border-[#e879f9]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BarChart3 size={18} style={{ color: '#e879f9' }} />
                </div>
                <div>
                  <div className="text-white font-semibold font-display">Business Insights</div>
                  <div className="text-zinc-500 text-xs mt-0.5">Monthly AI-generated P&L, GST summary & growth report — in Gujarati, Hindi, or English.</div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="badge-planned mono-label px-2.5 py-1 rounded-full text-[10px]">Coming Soon</span>
                <span className="text-zinc-600 text-xs">Enterprise tier</span>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Link to="/progress" className="text-zinc-500 hover:text-white text-sm transition-colors flex items-center gap-1.5 justify-center">
              View build progress tracker <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-28 px-5 border-t border-white/6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-14 reveal text-center">
            <div className="mono-label mb-3">How It Works</div>
            <h2 className="text-4xl sm:text-5xl font-bold font-display text-white tracking-tight">Simple. Powerful. Automated.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Connect Your Data', desc: 'Link your Google Sheets, WhatsApp Business, or Tally ERP. TaxSathi reads your sales and invoice data automatically.', icon: Globe },
              { step: '02', title: 'AI Does the Work', desc: 'Gemini AI drafts your GSTR filings, generates GST invoices, reconciles ITC, and identifies compliance risks — in minutes.', icon: Zap },
              { step: '03', title: 'Get Alerts in Gujarati', desc: 'Receive WhatsApp alerts, reports, and reminders in Gujarati, Hindi, or English. CA-verified guidance always available.', icon: Shield },
            ].map((s, i) => (
              <div key={i} className="ts-card p-7 reveal relative overflow-hidden" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="text-[80px] font-bold font-display text-white/3 absolute -top-4 -right-2 leading-none select-none">{s.step}</div>
                <div className="w-10 h-10 bg-white/6 border border-white/10 rounded-xl flex items-center justify-center mb-5">
                  <s.icon size={18} className="text-zinc-300" />
                </div>
                <div className="text-white font-semibold text-base mb-2 font-display">{s.title}</div>
                <div className="text-zinc-500 text-sm leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-28 px-5 border-t border-white/6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-14 reveal">
            <div className="mono-label mb-3">Pricing</div>
            <h2 className="text-4xl sm:text-5xl font-bold font-display text-white tracking-tight">Start Free. Scale as You Grow.</h2>
            <p className="text-zinc-500 mt-3">All plans include 14-day free trial. No credit card required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                name: 'Starter', price: '₹2,999', period: '/month', desc: 'For small traders just getting started with GST automation.',
                features: ['AI GST Assistant (GSTR-1 & 3B)', 'Smart Invoice Engine', 'WhatsApp invoice delivery', 'Gujarati reminders', 'Up to 500 invoices/month', 'Email support'],
                cta: 'Start Free Trial', tier: 'starter'
              },
              {
                name: 'Growth', price: '₹7,999', period: '/month', desc: 'For growing businesses needing full compliance automation.', highlight: true,
                features: ['Everything in Starter', 'Buyer/Supplier CRM', 'Compliance Calendar', 'TDS & advance tax alerts', 'WhatsApp payment follow-ups', 'Priority support'],
                cta: 'Start Free Trial', tier: 'growth'
              },
              {
                name: 'Enterprise', price: '₹19,999', period: '/month', desc: 'For large traders with complex needs and CA workflows.',
                features: ['Everything in Growth', 'CA Connect Marketplace', 'AI Business Insights (Gujarati)', 'Unlimited invoices', 'Tally deep integration', 'Dedicated account manager'],
                cta: 'Contact Sales', tier: 'enterprise'
              },
            ].map((plan, i) => (
              <div key={i} data-testid={`pricing-card-${plan.tier}`} className={`rounded-xl p-7 flex flex-col reveal ${plan.highlight ? 'bg-white text-black' : 'ts-card'}`} style={{ animationDelay: `${i * 0.1}s` }}>
                {plan.highlight && <div className="mono-label text-black/50 mb-4">Most Popular</div>}
                {!plan.highlight && <div className="mono-label mb-4">{plan.name.toUpperCase()}</div>}
                <div className={`text-4xl font-bold font-display mb-1 ${plan.highlight ? 'text-black' : 'text-white'}`}>{plan.price}</div>
                <div className={`text-sm mb-3 ${plan.highlight ? 'text-black/50' : 'text-zinc-500'}`}>{plan.period} per business</div>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-black/70' : 'text-zinc-500'}`}>{plan.desc}</p>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Check size={14} className={`mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-black' : 'text-zinc-400'}`} />
                      <span className={plan.highlight ? 'text-black/80' : 'text-zinc-400'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button data-testid={`pricing-cta-${plan.tier}`} onClick={() => setWaitlistOpen(true)}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${plan.highlight ? 'bg-black text-white hover:bg-zinc-800' : 'btn-secondary'}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WAITLIST SECTION ── */}
      <section className="py-28 px-5 border-t border-white/6">
        <div className="max-w-2xl mx-auto text-center reveal">
          <div className="mono-label mb-4">Early Access</div>
          <h2 className="text-4xl sm:text-5xl font-bold font-display text-white tracking-tight mb-4">
            Be Among the First 500 Businesses
          </h2>
          <p className="text-zinc-400 mb-8">Get early access, founder pricing, and direct input into the product roadmap.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button data-testid="section-join-waitlist" onClick={() => setWaitlistOpen(true)}
              className="btn-primary px-8 py-3.5 flex items-center gap-2 justify-center text-base">
              Join Waitlist — It's Free <ArrowRight size={16} />
            </button>
            <Link to="/demo" className="btn-secondary px-8 py-3.5 flex items-center gap-2 justify-center text-base">
              Try AI Demo First
            </Link>
          </div>
          <p className="text-zinc-600 text-xs mt-5">No credit card. No commitment. Just early access.</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/8 py-10 px-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center"><Zap size={12} className="text-black" /></div>
            <span className="font-display font-bold text-white text-sm">TaxSathi AI</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-zinc-500 text-xs justify-center">
            {[['/', 'Home'], ['/demo', 'AI Demo'], ['/analyzer', 'Module Analyzer'], ['/progress', 'Progress Tracker']].map(([to, label]) => (
              <Link key={label} to={to} className="hover:text-white transition-colors">{label}</Link>
            ))}
          </div>
          <div className="text-zinc-600 text-xs text-center">
            Built for India's 75,000+ SMBs<br />
            <span className="text-zinc-700">Goal: ₹10 Crore ARR in 18 months</span>
          </div>
        </div>
      </footer>

      {/* ── WHATSAPP FLOATING BUTTON ── */}
      <a
        data-testid="whatsapp-cta"
        href="https://wa.me/917698877447?text=Hi%20TaxSathi%20AI%20-%20I%20want%20to%20know%20more"
        target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-white text-black w-12 h-12 rounded-full shadow-xl flex items-center justify-center hover:bg-zinc-200 transition-all hover:scale-110"
        title="Chat on WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}
