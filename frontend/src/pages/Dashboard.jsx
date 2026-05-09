import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  MessageSquare,
  History,
  CreditCard,
  Gift,
  Sparkles,
  Crown,
  LogOut,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import GSTAssistant from './GSTAssistant';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PLANS = {
  basic: { name: 'Basic', price: 1500 },
  pro: { name: 'Pro', price: 1800 },
  premium: { name: 'Premium', price: 2000 }
};

export default function Dashboard() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState('chat');
  const [history, setHistory] = useState([]);
  const [referralStats, setReferralStats] = useState(null);
  const [subscribeLoading, setSubscribeLoading] = useState(false);

  const questionsUsed = profile?.ai_calls_this_month || 0;
  const bonusQ = profile?.bonus_questions || 0;
  const planFree = profile?.plan !== 'pro' && profile?.plan !== 'premium';
  const totalFreeAvailable = planFree ? Math.max(0, (10 - questionsUsed) + bonusQ) : 'Unlimited';

  useEffect(() => {
    if (tab === 'history') loadHistory();
    if (tab === 'referral') loadReferral();
  }, [tab]);

  useEffect(() => {
    const plan = searchParams.get('subscribe');
    if (plan && PLANS[plan]) handleSubscribe(plan);
  }, [searchParams]);

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API}/conversations`);
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      setHistory([]);
      toast.error('Could not load history');
    }
  };

  const loadReferral = async () => {
    try {
      const res = await axios.get(`${API}/referral/stats`);
      setReferralStats(res.data);
    } catch {
      toast.error('Could not load referral stats');
    }
  };

  const handleSubscribe = async (plan) => {
    setSubscribeLoading(true);

    try {
      await axios.post(`${API}/subscribe`, {
        plan,
        payment_id: `mock_${Date.now()}`
      });

      toast.success(`Subscribed to ${PLANS[plan]?.name} plan!`);
    } catch {
      toast.error('Subscription failed');
    } finally {
      setSubscribeLoading(false);
    }
  };

  const copyReferral = () => {
    if (referralStats?.referral_link) {
      navigator.clipboard.writeText(referralStats.referral_link);
      toast.success('Referral link copied!');
    }
  };

  const tabs = [
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'history', label: 'History', icon: History },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'referral', label: 'Refer & Earn', icon: Gift }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <aside className="w-72 border-r border-zinc-800 bg-black/40 backdrop-blur-xl hidden lg:flex flex-col">
        <div className="p-6 flex-1">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Sparkles className="w-6 h-6 text-black" />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">TaxSathi AI</h1>
              <p className="text-sm text-gray-400">AI Tax Assistant</p>
            </div>
          </div>

          <nav className="space-y-2">
            {(Array.isArray(tabs) ? tabs : []).map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                    active
                      ? 'bg-green-500 text-black shadow-lg shadow-green-500/20'
                      : 'text-gray-300 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold">Upgrade Plan</h3>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              Unlock unlimited AI questions, premium GST support, faster replies and future CA features.
            </p>

            <button
              onClick={() => setTab('subscription')}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              Upgrade to Unlimited
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-zinc-800 bg-black/30 backdrop-blur-xl">
          <div className="px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
              <p className="text-sm text-gray-400 mt-1">Manage taxes smarter with TaxSathi AI</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">
                  {profile?.name || user?.email}
                </p>

                <p className="text-sm text-gray-400 mt-1">
                  {planFree ? 'Free' : profile?.plan} plan —
                  <span className="text-green-400 font-medium ml-1">
                    {totalFreeAvailable}/10 questions remaining
                  </span>
                </p>
              </div>

              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="p-3 rounded-2xl border border-zinc-800 hover:border-red-500/40 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-5 h-5 text-gray-400 hover:text-red-400" />
              </button>
            </div>
          </div>
        </header>

        <div className="lg:hidden border-b border-zinc-800 bg-black px-3 py-3 flex gap-2 overflow-x-auto">
          {(Array.isArray(tabs) ? tabs : []).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-xl text-sm transition-all ${
                  active
                    ? 'bg-green-500 text-black'
                    : 'bg-zinc-900 text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === 'chat' && (
            <div className="h-full">
              <GSTAssistant />
            </div>
          )}

          {tab === 'history' && (
            <div className="p-6 max-w-5xl">
              <h2 className="text-3xl font-bold mb-2">Chat History</h2>
              <p className="text-gray-400 mb-8">Your previous TaxSathi AI conversations.</p>

              <div className="space-y-4">
                {(Array.isArray(history) ? history : []).length === 0 && (
                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center text-gray-400">
                    No conversations yet.
                  </div>
                )}

                {(Array.isArray(history) ? history : []).map((item, index) => (
                  <div
                    key={index}
                    className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 hover:border-green-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg text-white">
                          {item.title || 'GST Discussion'}
                        </h3>
                        <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                          {item.last_message || 'Conversation with TaxSathi AI'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'subscription' && (
            <div className="p-6 max-w-5xl">
              <h2 className="text-3xl font-bold mb-2">Subscription</h2>
              <p className="text-gray-400 mb-8">Upgrade your TaxSathi AI experience.</p>

              <div className="grid lg:grid-cols-3 gap-6">
                {(Array.isArray(Object.entries(PLANS)) ? Object.entries(PLANS) : []).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 hover:border-green-500/30 transition-all"
                  >
                    <h3 className="text-2xl font-bold mb-2">{value.name}</h3>
                    <p className="text-4xl font-bold mb-4">₹{value.price}</p>

                    <div className="space-y-3 mb-8 text-sm text-gray-300">
                      <p>• Unlimited AI Questions</p>
                      <p>• GST Filing Guidance</p>
                      <p>• Faster AI Responses</p>
                      <p>• Premium Support</p>
                    </div>

                    <button
                      disabled={subscribeLoading}
                      onClick={() => handleSubscribe(key)}
                      className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-2xl transition-all disabled:opacity-50"
                    >
                      {subscribeLoading ? 'Processing...' : 'Upgrade to Unlimited'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'referral' && (
            <div className="p-6 max-w-4xl">
              <h2 className="text-3xl font-bold mb-2">Refer & Earn</h2>
              <p className="text-gray-400 mb-8">Invite friends and earn rewards.</p>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
                <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center mb-6">
                  <Gift className="w-8 h-8 text-black" />
                </div>

                <h3 className="text-2xl font-bold mb-3">Share TaxSathi AI</h3>

                <p className="text-gray-400 leading-relaxed mb-6 max-w-2xl">
                  Invite your friends to TaxSathi AI. When they join, both of you can unlock bonus questions and premium rewards.
                </p>

                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    readOnly
                    value={referralStats?.referral_link || 'https://taxsathi.ai/referral'}
                    className="flex-1 bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-gray-300 focus:outline-none focus:border-green-500"
                  />

                  <button
                    onClick={copyReferral}
                    className="bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 rounded-2xl transition-all"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
