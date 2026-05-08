import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Shield, Eye, EyeOff, ArrowLeft, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const AuthPage = ({ mode: initialMode }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const mode = initialMode || (searchParams.get('mode') === 'register' ? 'register' : location.pathname.includes('register') ? 'register' : 'login');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
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
      } else {
        await register(form.name, '', '', form.email, form.password, '');
        toast.success('Account created successfully!');
      }

      navigate(from, { replace: true });
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
                TaxSathi
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {mode === 'login' ? 'Login to Dashboard' : 'Create your account'}
            </h1>

            <p className="text-[rgba(255,255,255,0.6)] text-sm mt-2">
              {mode === 'login'
                ? 'Access your GST advisor dashboard'
                : 'Start using TaxSathi today'}
            </p>
          </div>

          <div className="w-full rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] backdrop-blur-xl p-4 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="text-[rgba(255,255,255,0.6)] text-sm mb-1.5 block">
                    Full Name
                  </label>

                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)]" />

                    <input
                      type="text"
                      value={form.name}
                      onChange={e => update('name', e.target.value)}
                      required
                      placeholder="Your full name"
                      className={inputClassName}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[rgba(255,255,255,0.6)] text-sm mb-1.5 block">
                  Email Address
                </label>

                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)]" />

                  <input
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
                <label className="text-[rgba(255,255,255,0.6)] text-sm mb-1.5 block">
                  Password
                </label>

                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)]" />

                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    required
                    placeholder="Your password"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] rounded-xl bg-[#16a34a] hover:bg-green-500 disabled:opacity-60 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                {loading
                  ? 'Processing...'
                  : mode === 'login'
                    ? 'Login to Dashboard'
                    : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              {mode === 'login' ? (
                <p className="text-[rgba(255,255,255,0.6)] text-sm">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-green-400 hover:text-green-300 font-medium">
                    Register free
                  </Link>
                </p>
              ) : (
                <p className="text-[rgba(255,255,255,0.6)] text-sm">
                  Already have an account?{' '}
                  <Link to="/login" className="text-green-400 hover:text-green-300 font-medium">
                    Login
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
