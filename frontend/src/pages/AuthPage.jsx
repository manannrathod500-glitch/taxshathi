import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Eye, EyeOff, ArrowLeft, User, Mail, Phone, Lock, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const AuthPage = ({ mode: initialMode }) => {
  const [searchParams] = useSearchParams();
  const mode = initialMode || (searchParams.get('mode') === 'register' ? 'register' : initialMode);
  const refCode = searchParams.get('ref') || '';

  const [form, setForm] = useState({ 
    name: '', 
    business_name: '',
    email: '', 
    phone: '', 
    password: '', 
    referral_code: refCode 
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        if (!form.name.trim()) { toast.error('Name is required'); setLoading(false); return; }
        if (!form.business_name.trim()) { toast.error('Business name is required'); setLoading(false); return; }
        if (!form.phone.trim()) { toast.error('Phone is required'); setLoading(false); return; }
        if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); setLoading(false); return; }
        
        await register(
          form.name, 
          form.business_name,
          form.phone, 
          form.email, 
          form.password, 
          form.referral_code
        );
        toast.success('Account created! You get 10 free questions.');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040906] flex flex-col font-['Noto_Sans']"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #061a0e 0%, #040906 60%)' }}>
      <div className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm" data-testid="auth-back-btn">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <Shield size={20} className="text-black" />
              </div>
              <span className="text-white font-bold text-2xl font-['Outfit']">TaxSaathi</span>
            </div>
            <h1 className="text-white text-2xl font-bold font-['Outfit']">
              {mode === 'login' ? 'Welcome back' : 'Start your free trial'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {mode === 'login'
                ? 'Login to your GST advisor dashboard'
                : refCode
                  ? `Referred by a friend — you get 5 bonus questions!`
                  : '10 free AI checks per month, no credit card needed'}
            </p>
          </div>

          {/* Form */}
          <div className="glass-card rounded-2xl p-8"
            style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(22,163,74,0.15)' }}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="text-gray-300 text-sm mb-1.5 block">Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        data-testid="register-name-input"
                        type="text" value={form.name} onChange={e => update('name', e.target.value)}
                        required placeholder="Ramesh Patel"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm mb-1.5 block">Business Name</label>
                    <div className="relative">
                      <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        data-testid="register-business-name-input"
                        type="text" value={form.business_name} onChange={e => update('business_name', e.target.value)}
                        required placeholder="ABC Enterprises"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm mb-1.5 block">Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        data-testid="register-phone-input"
                        type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                        required placeholder="+91 98765 43210"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-500 transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-gray-300 text-sm mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    data-testid="auth-email-input"
                    type="email" value={form.email} onChange={e => update('email', e.target.value)}
                    required placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    data-testid="auth-password-input"
                    type={showPass ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)}
                    required placeholder={mode === 'register' ? 'Min 6 characters' : 'Your password'}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-500 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="text-gray-300 text-sm mb-1.5 block">Referral Code <span className="text-gray-600">(optional)</span></label>
                  <input
                    data-testid="register-referral-input"
                    type="text" value={form.referral_code} onChange={e => update('referral_code', e.target.value)}
                    placeholder="Enter referral code"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>
              )}

              <button
                data-testid="auth-submit-btn"
                type="submit" disabled={loading}
                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white py-3.5 rounded-xl font-bold text-sm transition-all mt-2 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                  : mode === 'login' ? 'Login to Dashboard' : 'Create Free Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              {mode === 'login' ? (
                <p className="text-gray-400 text-sm">
                  Don't have an account?{' '}
                  <Link to="/register" data-testid="auth-switch-to-register" className="text-green-400 hover:text-green-300 font-medium">Register free</Link>
                </p>
              ) : (
                <p className="text-gray-400 text-sm">
                  Already have an account?{' '}
                  <Link to="/login" data-testid="auth-switch-to-login" className="text-green-400 hover:text-green-300 font-medium">Login</Link>
                </p>
              )}
            </div>
          </div>

          {mode === 'register' && (
            <p className="text-center text-gray-600 text-xs mt-4">
              By registering you agree to our terms. ⚠️ TaxSaathi provides AI guidance — always verify with your CA.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
