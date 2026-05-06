import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { ArrowRight, Sparkles, Users, Shield, Zap, X } from 'lucide-react';

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

function WaitlistModal({ open, onClose }) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('waitlist').insert([{ name, whatsapp, email, created_at: new Date().toISOString() }]);

    setLoading(false);

    if (!error) {
      setSuccess(true);
      setName('');
      setWhatsapp('');
      setEmail('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
          <X size={18} />
        </button>

        <div className="mono-label mb-3">Start Free Trial</div>
        <h2 className="text-3xl font-bold text-white mb-4">Join TaxSathi AI</h2>

        {success ? (
          <div className="text-green-400">Successfully joined waitlist.</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" required placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white" />
            <input type="tel" required placeholder="WhatsApp Number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white" />
            <input type="email" required placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white" />

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
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

  return <div className="bg-[#050505] text-white overflow-hidden"><WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} /></div>;
}
