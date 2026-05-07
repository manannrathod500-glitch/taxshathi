import React, { useState } from 'react';
import {
  ArrowRight,
  Users,
  Shield,
  Zap,
  Check,
  MessageCircle,
} from 'lucide-react';

export default function LandingPage() {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // TODO: Supabase waitlist insert here

      await fetch(
        'https://qjinbmuredxreupqwoqf.supabase.co/functions/v1/send-welcome-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            name,
            email,
          }),
        }
      );

      setSubmitted(true);
      setName('');
      setWhatsapp('');
      setEmail('');
    } catch (error) {
      console.error(error);
    }
  };

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
    <div className="bg-[#0a0a0a] text-white overflow-hidden">
      <section className="blueprint-grid relative min-h-screen flex items-center justify-center px-5 py-24 overflow-hidden border-b border-white/6">
        <div className="hero-glow" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-white/12 bg-white/4 rounded-full px-4 py-1.5 text-xs text-zinc-400 mb-8">
            <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full" />
            Trusted by tax professionals & Indian SMBs
          </div>

          <div className="mono-label mb-5">TAXSATHI AI</div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display leading-[1.05] tracking-tight mb-6">
            Get GST/ITR Clients Daily —
            <br />
            <span className="gradient-text">Without Cold Calling</span>
          </h1>

          <p
            className="font-gujarati text-2xl sm:text-3xl text-zinc-300 leading-relaxed mb-4"
            style={{ fontFamily: 'Noto Sans Gujarati, sans-serif' }}
          >
            તમારો સ્માર્ટ GST અને ITR ગ્રોથ પાર્ટનર
          </p>

          <p className="text-zinc-500 text-sm mb-10 max-w-2xl mx-auto leading-relaxed">
            AI-powered lead generation & GST automation for Indian CAs and SMB-focused professionals
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="btn-primary px-7 py-3 flex items-center gap-2 text-sm">
              Start Free Trial <ArrowRight size={16} />
            </button>

            <a
              href="https://wa.me/919999999999"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary px-7 py-3 flex items-center gap-2 text-sm"
            >
              <MessageCircle size={16} />
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      <section className="py-28 px-5 border-b border-white/6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="mono-label mb-3">How It Works</div>
            <h2 className="text-4xl sm:text-5xl font-bold font-display tracking-tight">
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
              <div key={i} className="ts-card p-7 relative overflow-hidden border border-white/10 rounded-3xl bg-[#0d0d0d]">
                <div className="text-[80px] font-bold font-display text-white/5 absolute -top-4 -right-2">
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

      <section className="py-28 px-5 border-b border-white/6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="mono-label mb-3">Pricing</div>
            <h2 className="text-4xl sm:text-5xl font-bold font-display tracking-tight">
              Simple Pricing
            </h2>
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
              <div key={index} className="border border-white/10 rounded-3xl p-8 bg-[#0d0d0d]">
                <h3 className="text-3xl font-bold mb-3">{plan.title}</h3>
                <div className="text-4xl font-display text-zinc-100 mb-8">
                  {plan.price}
                </div>

                <div className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-zinc-400 text-sm">
                      <Check size={15} />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 px-5 border-b border-white/6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="mono-label mb-3">FAQ</div>
            <h2 className="text-4xl sm:text-5xl font-bold font-display tracking-tight">
              Common Questions
            </h2>
          </div>

          <div className="space-y-5">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-white/10 rounded-3xl p-7 bg-[#0d0d0d]">
                <h3 className="text-xl font-semibold mb-3">{faq.q}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 px-5 border-b border-white/6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mono-label mb-3">Founder</div>

          <h2 className="text-4xl sm:text-5xl font-bold font-display tracking-tight mb-6">
            Built by Manan Rathod
          </h2>

          <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl mx-auto">
            Building AI-first tools for Indian SMBs focused on GST automation and AI-powered business operations.
          </p>

          <p className="text-zinc-500 mt-5">
            Based in Gujarat, India 🇮🇳
          </p>
        </div>
      </section>

      <section className="py-28 px-5">
        <div className="max-w-xl mx-auto text-center">
          <div className="mono-label mb-3">Start Free</div>

          <h2 className="text-5xl font-bold font-display tracking-tight mb-6">
            Start Your Free Trial Today
          </h2>

          <p className="text-zinc-400 mb-10 text-sm leading-relaxed">
            Join TaxSathi AI and simplify GST & ITR workflows with AI-powered automation.
          </p>

          {submitted ? (
            <div className="border border-green-500/20 bg-green-500/10 rounded-2xl p-5 text-green-300 text-sm">
              Thank you! Your details have been submitted successfully.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <input
                type="text"
                required
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-white/30"
              />

              <input
                type="tel"
                required
                placeholder="WhatsApp Number"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-white/30"
              />

              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-white/30"
              />

              <button
                type="submit"
                className="btn-primary w-full py-4 flex items-center justify-center gap-2"
              >
                Join Waitlist <ArrowRight size={18} />
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
