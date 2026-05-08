import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowRight,
  Users,
  Shield,
  Zap,
  Check,
  MessageCircle,
} from 'lucide-react';

const supabaseUrl = 'https://qjinbmuredxreupqwoqf.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LandingPage() {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setErrorMessage('');

    try {
      const { error } = await supabase.from('waitlist').insert([
        {
          name,
          whatsapp,
          email,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        throw error;
      }

      await fetch(
        'https://qjinbmuredxreupqwoqf.supabase.co/functions/v1/send-welcome-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
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
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(0,0,0,0.8)] backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="text-white text-xl sm:text-2xl font-bold tracking-tight"
          >
            TaxSathi AI
          </Link>

          <Link
            to="/login"
            className="border border-white text-white px-4 sm:px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white hover:text-black"
          >
            Login
          </Link>
        </div>
      </nav>

      <section className="blueprint-grid relative min-h-screen flex items-center justify-center px-5 pt-32 pb-24 overflow-hidden border-b border-white/6">
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
    </div>
  );
}
