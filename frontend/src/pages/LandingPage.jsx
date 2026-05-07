import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowRight,
  Sparkles,
  Users,
  Shield,
  Zap,
  X,
  Check,
  MessageCircle,
} from 'lucide-react';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

function WaitlistModal({ open, onClose }) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      if (!supabase) {
        throw new Error('Supabase environment variables missing');
      }

      const { error } = await supabase.from('waitlist').insert([{
        name,
        whatsapp,
        email,
        created_at: new Date().toISOString(),
      }]);

      if (error) throw error;

      setSuccess(true);
      setName('');
      setWhatsapp('');
      setEmail('');
    } catch (err) {
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="mono-label mb-3">Start Free Trial</div>

        <h2 className="text-3xl font-bold text-white mb-4">
          Join TaxSathi AI
        </h2>

        <p className="text-zinc-400 text-sm mb-6">
          Fill in your details to join the TaxSathi waitlist.
        </p>

        {success ? (
          <div className="border border-green-500/20 bg-green-500/10 rounded-xl p-4 text-green-300 text-sm">
            Thank you! Your details have been submitted successfully.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" required placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30" />
            <input type="tel" required placeholder="WhatsApp Number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30" />
            <input type="email" required placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30" />

            {errorMessage && (
              <div className="text-red-400 text-sm">{errorMessage}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? 'Submitting...' : 'Join Waitlist'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => {
    const fetchWaitlistCount = async () => {
      if (!supabase) return;

      const { count } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true });

      setWaitlistCount(count || 0);
    };

    fetchWaitlistCount();
  }, []);

  const faqs = [
    {
      q: 'Do freelancers need GST registration in India?',
      a: 'Yes, if your annual turnover crosses the applicable GST threshold or if you provide interstate services in certain categories.',
    },
    {
      q: 'Can I file ITR without Form 16?',
      a: 'Yes. You can use salary slips, AIS, bank statements, and Form 26AS to file your return accurately.',
    },
    {
      q: 'How can I save tax legally?',
      a: 'You can use deductions like 80C, 80D, HRA, NPS, and smart salary structuring to reduce tax liability.',
    },
    {
      q: 'What happens if GST returns are filed late?',
      a: 'Late filing may lead to penalties, interest, and compliance notices from the GST department.',
    },
    {
      q: 'Can TaxSathi help with tax notices?',
      a: 'Yes. TaxSathi AI explains notices in simple language and connects you with experts if required.',
    },
  ];

  return (
    <div className="bg-[#050505] text-white overflow-hidden">
      <section className="blueprint-grid relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-5 overflow-hidden">
        <div className="hero-glow" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-white/12 bg-white/4 rounded-full px-4 py-1.5 text-xs text-zinc-400 mb-8 animate-fade-up">
            <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse-dot" />
            {waitlistCount}+ professionals already joined TaxSathi
          </div>

          <div className="animate-fade-up stagger-1 mb-5">
            <div className="mono-label mb-4">TAXSATHI AI</div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display text-white leading-[1.05] tracking-tight">
              Grow Your GST & ITR Practice Faster
              <br />
              <span className="gradient-text">
                With AI-Powered Automation
              </span>
            </h1>
          </div>

          <p className="text-zinc-400 text-base sm:text-lg max-w-3xl mx-auto mb-8 leading-relaxed animate-fade-up stagger-3">
            Trusted by Indian tax professionals to generate high-intent leads, automate follow-ups, simplify GST workflows, and convert more clients without cold calling.
          </p>

          <div className="flex items-center justify-center gap-6 text-sm text-zinc-500 mb-10 flex-wrap">
            <span>✓ AI-powered lead generation</span>
            <span>✓ Faster GST workflows</span>
            <span>✓ Built for Indian CAs & SMBs</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up stagger-4">
            <button onClick={() => setWaitlistOpen(true)} className="btn-primary px-6 py-3 flex items-center gap-2 text-sm">
              Join {waitlistCount}+ Users <ArrowRight size={15} />
            </button>

            <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" className="btn-secondary px-6 py-3 flex items-center gap-2 text-sm">
              <MessageCircle size={15} />
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      <section className="py-24 px-5 border-t border-white/6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="mono-label mb-3">Pricing</div>
            <h2 className="text-4xl font-bold font-display">Simple Pricing</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Starter',
                price: '₹999/mo',
                features: ['Lead dashboard', 'Basic GST tools', 'Email support'],
              },
              {
                title: 'Pro',
                price: '₹2999/mo',
                features: ['AI automation', 'Client workflows', 'Priority support'],
              },
              {
                title: 'Enterprise',
                price: 'Coming Soon',
                features: ['Custom integrations', 'Dedicated onboarding', 'Advanced analytics'],
              },
            ].map((plan, index) => (
              <div key={index} className="ts-card p-8 rounded-2xl border border-white/10">
                <h3 className="text-2xl font-bold mb-2">{plan.title}</h3>
                <div className="text-3xl font-display mb-6 text-zinc-200">{plan.price}</div>
                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-zinc-400 text-sm">
                      <Check size={14} />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-5 border-t border-white/6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="mono-label mb-3">FAQ</div>
            <h2 className="text-4xl font-bold font-display">Common Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="ts-card p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold mb-2">{faq.q}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 px-5 border-t border-white/6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mono-label mb-3">Start Free</div>
          <h2 className="text-5xl font-bold font-display text-white tracking-tight mb-6">
            Join The Next Generation Of AI Tax Platforms
          </h2>

          <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
            Join {waitlistCount}+ professionals already exploring TaxSathi to scale GST & ITR services with AI.
          </p>

          <button onClick={() => setWaitlistOpen(true)} className="btn-primary px-10 py-4 text-base inline-flex items-center gap-2">
            Start Free Trial <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
    </div>
  );
}
