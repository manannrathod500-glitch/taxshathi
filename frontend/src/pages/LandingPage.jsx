import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowRight,
  Sparkles,
  Users,
  Shield,
  Zap,
  X,
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

      const { error } = await supabase
        .from('waitlist')
        .insert([
          {
            name,
            whatsapp,
            email,
            created_at: new Date().toISOString(),
          },
        ]);

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
            <input
              type="text"
              required
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
            />

            <input
              type="tel"
              required
              placeholder="WhatsApp Number"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
            />

            <input
              type="email"
              required
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
            />

            {errorMessage && (
              <div className="text-red-400 text-sm">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
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

  return (
    <div className="bg-[#050505] text-white overflow-hidden">
      <section className="blueprint-grid relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-5 overflow-hidden">
        <div className="hero-glow" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-white/12 bg-white/4 rounded-full px-4 py-1.5 text-xs text-zinc-400 mb-8 animate-fade-up">
            <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse-dot" />
            Trusted by tax professionals & Indian SMBs
          </div>

          <div className="animate-fade-up stagger-1 mb-5">
            <div className="mono-label mb-4">TAXSATHI AI</div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display text-white leading-[1.05] tracking-tight">
              Get GST/ITR Clients Daily —
              <br />
              <span className="gradient-text">
                Without Cold Calling
              </span>
            </h1>
          </div>

          <div className="animate-fade-up stagger-2 my-6">
            <p
              className="font-gujarati text-2xl sm:text-3xl text-zinc-300 leading-relaxed"
              style={{ fontFamily: 'Noto Sans Gujarati, sans-serif' }}
            >
              તમારો સ્માર્ટ GST અને ITR ગ્રોથ પાર્ટનર
            </p>

            <p className="text-zinc-500 text-sm mt-2">
              AI-powered lead generation & GST automation for Indian CAs and SMB-focused professionals
            </p>
          </div>

          <p className="text-zinc-400 text-base sm:text-lg max-w-3xl mx-auto mb-10 leading-relaxed animate-fade-up stagger-3">
            TaxSathi helps CAs, tax consultants, and finance professionals attract
            high-intent GST & ITR clients, automate follow-ups, and scale faster
            using AI-powered workflows built for India.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up stagger-4">
            <button
              onClick={() => setWaitlistOpen(true)}
              className="btn-primary px-6 py-3 flex items-center gap-2 text-sm"
            >
              Start Free Trial <ArrowRight size={15} />
            </button>

            <Link
              to="/demo"
              className="btn-secondary px-6 py-3 flex items-center gap-2 text-sm"
            >
              <Sparkles size={14} className="text-zinc-400" />
              Try Live Demo
            </Link>
          </div>
        </div>
      </section>

      <section className="py-28 px-5 border-t border-white/6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="mono-label mb-3">How It Works</div>
            <h2 className="text-4xl sm:text-5xl font-bold font-display text-white tracking-tight">
              Get Clients In 3 Simple Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Capture High-Intent Leads',
                desc: 'TaxSathi helps attract people actively searching for GST filing, ITR help, notices, and compliance support.',
                icon: Users,
              },
              {
                step: '02',
                title: 'Engage Automatically',
                desc: 'AI handles FAQs, reminders, follow-ups, and qualification so you spend less time chasing prospects.',
                icon: Zap,
              },
              {
                step: '03',
                title: 'Convert Into Paying Clients',
                desc: 'Deliver faster responses and professional experiences that increase trust and conversions.',
                icon: Shield,
              },
            ].map((s, i) => (
              <div key={i} className="ts-card p-7 reveal relative overflow-hidden">
                <div className="text-[80px] font-bold font-display text-white/3 absolute -top-4 -right-2">
                  {s.step}
                </div>

                <div className="w-10 h-10 bg-white/6 border border-white/10 rounded-xl flex items-center justify-center mb-5">
                  <s.icon size={18} className="text-zinc-300" />
                </div>

                <div className="text-white font-semibold text-base mb-2 font-display">
                  {s.title}
                </div>

                <div className="text-zinc-500 text-sm leading-relaxed">
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 px-5 border-t border-white/6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mono-label mb-3">Founder</div>
          <h2 className="text-4xl sm:text-5xl font-bold font-display text-white tracking-tight mb-6">
            Built by Manan Rathod
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl mx-auto">
            Building AI-first tools for Indian SMBs focused on GST automation and AI-powered business operations.
          </p>
          <p className="text-zinc-500 mt-5">Based in Gujarat, India 🇮🇳</p>
        </div>
      </section>

      <section className="py-28 px-5 border-t border-white/6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mono-label mb-3">Start Free</div>

          <h2 className="text-5xl font-bold font-display text-white tracking-tight mb-6">
            Start Your Free Trial Today
          </h2>

          <button
            onClick={() => setWaitlistOpen(true)}
            className="btn-primary px-10 py-4 text-base inline-flex items-center gap-2"
          >
            Start Free Trial <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <WaitlistModal
        open={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
      />
    </div>
  );
}
