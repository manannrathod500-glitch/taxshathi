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
        await register(form.name, form.business_name, form.phone, form.email, form.password, form.referral_code);
        toast.success('Account created!');
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = 'w-full min-h-[44px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-[rgba(255,255,255,0.35)] text-sm focus:outline-none focus:border-[#16a34a] transition-colors';

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
      <div className="px-4 sm:px-8 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-[rgba(255,255,255,0.6)] hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-6 sm:py-10">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <img src="/logo.jpeg.jpeg" alt="TaxSathi" className="w-10 h-10 rounded-lg object-cover" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {mode === 'login' ? 'Welcome back' : 'Start your free trial'}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
