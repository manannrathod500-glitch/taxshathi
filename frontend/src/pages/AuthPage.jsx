import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Shield, Eye, EyeOff, ArrowLeft, User, Mail, Phone, Lock, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const AuthPage = ({ mode: initialMode }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
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

  const from = location.state?.from?.pathname || '/dashboard';

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      } else {
        if (!form.name.trim()) {
          toast.error('Name is required');
          setLoading(false);
          return;
        }

        if (!form.business_name.trim()) {
          toast.error('Business name is required');
          setLoading(false);
          return;
        }

        if (!form.phone.trim()) {
          toast.error('Phone is required');
          setLoading(false);
          return;
        }

        if (form.password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        await register(
          form.name,
          form.business_name,
          form.phone,
          form.email,
          form.password,
          form.referral_code
        );

        toast.success('Account created! You get 10 free questions.');
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = 'w-full min-h-[44px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-[rgba(255,255,255,0.35)] text-sm focus:outline-none focus:border-[#16a34a] transition-colors';

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
      <div className="px-4 sm:px-8 py-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[rgba(255,255,255,0.6)] hover:text-white transition-colors text-sm"
          data-testid="auth-back-btn"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-6 sm:py-10">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.1)] flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <span className="text-white font-bold text-2xl sm:text-3xl tracking-tight">
                TaxSathi AI
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {mode === 'login' ? 'Welcome back' : 'Start your free trial'}
            </h1>

            <p className="text-[rgba(255,255,255,0.6)] text-sm mt-2 leading-relaxed px-2">
              {mode === 'login'
                ? 'Login to your GST advisor dashboard'
                : refCode
                  ? 'Referred by a friend — you get 5 bonus questions!'
                  : '10 free AI checks per month, no credit card needed'}
            </p>
          </div>

          <div
            className="w-full rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] backdrop-blur-xl p-4 sm:p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="text-[rgba(255,255,255,0.6)] text-sm mb-1.5 block">Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)]" />
                      <input
                        data-testid="register-name-input"
                        type="text"
                        value={form.name}
                        onChange={e => update('name', e.target.value)}
                        required
                        placeholder="Ramesh Patel"
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[rgba(255,255,255,0.6)] text-sm mb-1.5 block">Business Name</label>
                    <div className="relative">
                      <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)]" />
                      <input
                        data-testid="register-business-name-input"
                        type="text"
                        value={form.business_name}
                        onChange={e => update('business_name', e.target.value)}
                        required
                        placeholder="ABC Enterprises"
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[rgba(255,255,255,0.6)] text-sm mb-1.5 block">Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)]" />
                      <input
                        data-testid="register-phone-input"
                        type="tel"
                        value={form.phone}
                        onChange={e => update('phone', e.target.value)}
                        required
                        placeholder="+91 98765 43210"
                        className={inputClassName}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-[rgba(255,255,255,0.6)] text-sm mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)]" />
                  <input
                    data-testid="auth-email-input"
                    type="email"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    required
                    placeholder="you@example.com"
                    className={inputClassName}
                  />
                </div>
              </div>

              <div>
                <label className="text-[rgba(255,255,255,0.6)] text-sm mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)]" />
                  <input
                    data-testid="auth-password-input"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    required
                    placeholder={mode === 'register' ? 'Min 6 characters' : 'Your password'}
                    className={`${inputClassName} pr-10`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)] hover:text-white"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="text-[rgba(255,255,255,0.6)] text-sm mb-1.5 block">
                    Referral Code <span className="text-[rgba(255,255,255,0.35)]">(optional)</span>
                  </label>
                  <input
                    data-testid="register-referral-input"
                    type="text"
                    value={form.referral_code}
                    onChange={e => update('referral_code', e.target.value)}
                    placeholder="Enter referral code"
                    className="w-full min-h-[44px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white text-sm placeholder:text-[rgba(255,255,255,0.35)] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>
              )}

              <button
                data-testid="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] rounded-xl bg-[#16a34a] hover:bg-green-500 disabled:opacity-60 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                  : mode === 'login' ? 'Login to Dashboard' : 'Create Free Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
