import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import {
  Send, LogOut, MessageCircle, History, CreditCard, Share2,
  Download, Copy, Shield, Bot, CheckCircle, AlertTriangle, XCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PLANS = {
  basic: { name: 'Basic', price: 1500 },
  pro: { name: 'Pro', price: 1800 },
  premium: { name: 'Premium', price: 2000 }
};

export default function Dashboard() {
  const { user, logout, refreshUser, authHeaders } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState('chat');
  const [messages, setMessages] = useState([{
    role: 'ai',
    text: `Namaste ${user?.name?.split(' ')[0] || ''}! 🙏\n\nMain TaxSaathi AI hun — aapka personal GST advisor. Aap koi bhi GST sawaal poochh sakte hain:\n\n• GSTR-1, GSTR-3B, GSTR-9 filing\n• Input Tax Credit (ITC)\n• E-way bills & E-invoicing\n• GST rates & HSN codes\n• GST notices & compliance\n\nKya sawaal hai aapka?`
  }]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId] = useState(`advisor_${user?.id}_${Date.now()}`);
  const [history, setHistory] = useState([]);
  const [referralStats, setReferralStats] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const chatEndRef = useRef(null);

  const questionsUsed = user?.free_questions_used || 0;
  const bonusQ = user?.bonus_questions || 0;
  const planFree = user?.plan === 'free';
  const totalFreeAvailable = planFree ? Math.max(0, (10 - questionsUsed) + bonusQ) : -1;

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (tab === 'history') loadHistory();
    if (tab === 'referral') loadReferral();
  }, [tab]);

  // Auto-open subscribe modal from URL param
  useEffect(() => {
    const plan = searchParams.get('subscribe');
    if (plan && PLANS[plan]) handleSubscribe(plan);
  }, []);

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API}/conversations`, authHeaders());
      setHistory(res.data);
    } catch { toast.error('Could not load history'); }
  };

  const loadReferral = async () => {
    try {
      const res = await axios.get(`${API}/referral/stats`, authHeaders());
      setReferralStats(res.data);
    } catch { toast.error('Could not load referral stats'); }
  };

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setChatLoading(true);
    try {
      const res = await axios.post(`${API}/chat/advisor`, { message: text, session_id: sessionId }, authHeaders());
      setMessages(prev => [...prev, { role: 'ai', text: res.data.response }]);
      if (res.data.questions_remaining === 0 && planFree) setShowPaywall(true);
      if (res.data.questions_remaining <= 2 && res.data.questions_remaining > 0 && planFree) {
        toast(`Only ${res.data.questions_remaining} free questions left!`, { icon: '⚠️' });
      }
      await refreshUser();
    } catch (err) {
      if (err.response?.status === 402) {
        setShowPaywall(true);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, there was an error. Please try again.' }]);
      }
    } finally {
      setChatLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
    setSubscribeLoading(true);
    try {
      await axios.post(`${API}/subscribe`, { plan, payment_id: `mock_${Date.now()}` }, authHeaders());
      await refreshUser();
      setShowPaywall(false);
      toast.success(`Subscribed to ${PLANS[plan]?.name} plan! Unlimited questions unlocked.`);
    } catch (err) {
      toast.error('Subscription failed. Please try again.');
    } finally {
      setSubscribeLoading(false);
    }
  };

  const downloadPDF = (msg, prevMsg) => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(22, 163, 74);
    doc.text('TaxSaathi — GST Advisory', 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 20, 28);
    doc.line(20, 32, 190, 32);
    if (prevMsg) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text('Your Question:', 20, 40);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const qLines = doc.splitTextToSize(prevMsg.text, 160);
      doc.text(qLines, 20, 48);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text('TaxSaathi Answer:', 20, 70);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(msg.text, 165);
    doc.text(lines, 20, 80);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('⚠️ TaxSaathi provides AI guidance. Verify with your CA before filing.', 20, 280);
    doc.save('taxsaathi-gst-advice.pdf');
    toast.success('PDF downloaded!');
  };

  const copyReferral = () => {
    if (referralStats?.referral_link) {
      navigator.clipboard.writeText(referralStats.referral_link);
      toast.success('Referral link copied!');
    }
  };

  const subEnd = user?.subscription_end ? new Date(user.subscription_end) : null;
  const daysLeft = subEnd ? Math.max(0, Math.ceil((subEnd - new Date()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <div className="min-h-screen bg-gray-50 font-['Noto_Sans'] flex flex-col">
      {/* ── HEADER ── */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Shield size={15} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg font-['Outfit']">TaxSaathi</span>
        </div>
        <div className="flex items-center gap-3">
          {user?.is_admin && (
            <button onClick={() => navigate('/admin')} className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-200 transition-colors">
              Admin Panel
            </button>
          )}
          <div className="hidden sm:block text-right">
            <div className="text-sm font-medium text-gray-900">{user?.name}</div>
            <div className="text-xs text-gray-400">{user?.email}</div>
          </div>
          <button data-testid="logout-btn" onClick={() => { logout(); navigate('/'); }} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ── WELCOME BANNER ── */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-4 md:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <span className="font-semibold">Namaste, {user?.name?.split(' ')[0]}! </span>
          {planFree
            ? <span className="text-green-100 text-sm">Free plan — <strong className="text-white">{totalFreeAvailable}/10</strong> questions remaining</span>
            : <span className="text-green-100 text-sm">{user?.plan?.toUpperCase()} plan — {daysLeft !== null ? `${daysLeft} days left` : 'Active'}</span>}
        </div>
        {planFree && (
          <button onClick={() => setTab('subscription')} className="text-xs bg-white/20 hover:bg-white/30 border border-white/30 px-3 py-1.5 rounded-lg font-medium transition-all">
            Upgrade to Unlimited
          </button>
        )}
      </div>

      {/* ── FREE QUESTION WARNINGS ── */}
      {planFree && questionsUsed >= 5 && questionsUsed < 8 && (
        <div data-testid="halfway-warning" className="bg-amber-50 border-b border-amber-200 px-4 md:px-6 py-2 text-sm text-amber-700 flex items-center gap-2">
          <AlertTriangle size={14} /> Aap halfway hain — <button onClick={() => setTab('subscription')} className="underline font-medium ml-1">subscribe karke unlimited karo</button>
        </div>
      )}
      {planFree && questionsUsed >= 8 && questionsUsed < 10 && (
        <div data-testid="low-questions-warning" className="bg-orange-50 border-b border-orange-300 px-4 md:px-6 py-2 text-sm text-orange-700 flex items-center gap-2">
          <AlertTriangle size={14} className="text-orange-500" /> Sirf {10 - questionsUsed + bonusQ} questions bache hain! <button onClick={() => setTab('subscription')} className="underline font-medium ml-1">Abhi subscribe karo!</button>
        </div>
      )}

      {/* ── TABS ── */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6">
        <div className="flex gap-0 max-w-4xl mx-auto">
          {[
            { id: 'chat', icon: MessageCircle, label: 'AI Chat' },
            { id: 'history', icon: History, label: 'History' },
            { id: 'subscription', icon: CreditCard, label: 'Subscription' },
            { id: 'referral', icon: Share2, label: 'Refer & Earn' },
          ].map(t => (
            <button
              key={t.id}
              data-testid={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition-all ${tab === t.id ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <t.icon size={15} /> <span className="hidden sm:block">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-6 py-4">

        {/* CHAT TAB */}
        {tab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-240px)] bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-green-50">
              <Bot size={18} className="text-green-600" />
              <span className="text-sm font-semibold text-green-800">TaxSaathi AI Advisor</span>
              {planFree && (
                <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {totalFreeAvailable} questions left
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide" data-testid="chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Bot size={14} className="text-green-600" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                    {msg.text}
                    {msg.role === 'ai' && i > 0 && (
                      <button onClick={() => downloadPDF(msg, messages[i - 1]?.role === 'user' ? messages[i - 1] : null)}
                        className="flex items-center gap-1 mt-2 text-xs text-green-600 hover:text-green-800 transition-colors" data-testid={`download-pdf-${i}`}>
                        <Download size={12} /> Download PDF
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Bot size={14} className="text-green-600" />
                  </div>
                  <div className="chat-bubble-ai px-4 py-3">
                    <div className="flex gap-1.5 items-center h-4">
                      {[0, 1, 2].map(d => <div key={d} className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t border-gray-100 p-3">
              <div className="flex gap-2">
                <input
                  data-testid="chat-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="GST ka koi bhi sawaal poochho... (Hindi, English, Gujarati)"
                  disabled={chatLoading || (planFree && totalFreeAvailable === 0)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 transition-colors disabled:opacity-50"
                />
                <button
                  data-testid="chat-send-btn"
                  onClick={sendMessage}
                  disabled={chatLoading || !input.trim() || (planFree && totalFreeAvailable === 0)}
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl transition-all flex items-center justify-center"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">⚠️ Filing se pehle apne CA se confirm zaroor karein</p>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 font-['Outfit']">Conversation History</h2>
              <button onClick={loadHistory} className="text-gray-400 hover:text-green-600 transition-colors"><RefreshCw size={16} /></button>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <History size={32} className="mx-auto mb-3 opacity-40" />
                <p>No conversations yet. Ask your first GST question!</p>
                <button onClick={() => setTab('chat')} className="mt-3 text-green-600 text-sm hover:underline">Go to Chat</button>
              </div>
            ) : (
              history.map((conv, i) => (
                <div key={i} data-testid={`history-item-${i}`} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <p className="text-sm font-semibold text-gray-800 flex-1">Q: {conv.message}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">{new Date(conv.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap border-l-2 border-green-200 pl-3">{conv.response}</p>
                  <button
                    onClick={() => downloadPDF({ text: conv.response }, { text: conv.message })}
                    className="mt-2 text-xs text-green-600 hover:underline flex items-center gap-1">
                    <Download size={12} /> Download PDF
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* SUBSCRIPTION TAB */}
        {tab === 'subscription' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 font-['Outfit']">Subscription Status</h2>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${planFree ? 'bg-gray-100' : 'bg-green-100'}`}>
                  {planFree ? <XCircle size={18} className="text-gray-400" /> : <CheckCircle size={18} className="text-green-600" />}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{planFree ? 'Free Plan' : `${user?.plan?.toUpperCase()} Plan`}</div>
                  <div className="text-sm text-gray-500">
                    {planFree
                      ? `${totalFreeAvailable} free questions remaining`
                      : daysLeft !== null ? `Expires in ${daysLeft} days` : 'Active'}
                  </div>
                </div>
              </div>
              {!planFree && <div className="text-green-700 bg-green-50 rounded-xl p-3 text-sm font-medium">Unlimited questions active — 24/7 AI GST advisor.</div>}
            </div>

            {(planFree || (daysLeft !== null && daysLeft <= 7)) && (
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-4 font-['Outfit']">Upgrade Plan</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {Object.entries(PLANS).map(([key, plan]) => (
                    <div key={key} data-testid={`sub-card-${key}`} className={`rounded-xl border p-5 ${key === 'pro' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                      <div className="font-semibold text-gray-900 mb-1">{plan.name}</div>
                      <div className="text-2xl font-bold text-gray-900 mb-3 font-['Outfit']">₹{plan.price}<span className="text-sm text-gray-500 font-normal">/mo</span></div>
                      <button
                        data-testid={`subscribe-plan-${key}`}
                        onClick={() => handleSubscribe(key)}
                        disabled={subscribeLoading || user?.plan === key}
                        className={`w-full py-2 rounded-xl text-sm font-semibold transition-all ${key === 'pro' ? 'bg-green-600 text-white hover:bg-green-500' : 'border border-green-600 text-green-700 hover:bg-green-50'} disabled:opacity-50`}
                      >
                        {user?.plan === key ? 'Current Plan' : subscribeLoading ? 'Processing...' : 'Subscribe'}
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">⚠️ Payment integration (Razorpay) will be live when keys are configured.</p>
              </div>
            )}
          </div>
        )}

        {/* REFERRAL TAB */}
        {tab === 'referral' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 font-['Outfit']">Refer & Earn</h2>
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-1">Refer a friend, get 5 free questions!</h3>
              <p className="text-green-100 text-sm">When your friend subscribes, you get ₹200 off next month.</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="text-sm text-gray-600 mb-2 font-medium">Your referral link:</div>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <span data-testid="referral-link" className="text-sm text-gray-700 flex-1 truncate">
                  {referralStats?.referral_link || `https://taxsaathi.info/ref/${user?.referral_code}`}
                </span>
                <button data-testid="copy-referral-btn" onClick={copyReferral} className="text-green-600 hover:text-green-700 flex-shrink-0">
                  <Copy size={16} />
                </button>
              </div>
            </div>
            {referralStats && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Friends Referred', value: referralStats.total_referrals },
                  { label: 'Bonus Questions', value: referralStats.bonus_questions },
                  { label: 'Discount Earned', value: `₹${referralStats.discount_earned}` },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-green-700 font-['Outfit']">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── PAYWALL OVERLAY ── */}
      {showPaywall && (
        <div data-testid="paywall-overlay" className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 font-['Outfit']">Aapke free questions khatam ho gaye!</h2>
            <p className="text-gray-500 text-sm mb-6">TaxSaathi pasand aaya? Sirf ₹1,500/month mein unlimited questions — aaj subscribe karein.</p>
            <div className="space-y-3 mb-6">
              {Object.entries(PLANS).map(([key, plan]) => (
                <button
                  key={key}
                  data-testid={`paywall-subscribe-${key}`}
                  onClick={() => handleSubscribe(key)}
                  disabled={subscribeLoading}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${key === 'pro' ? 'bg-green-600 text-white hover:bg-green-500' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'} disabled:opacity-50`}
                >
                  {plan.name} — ₹{plan.price}/month
                </button>
              ))}
            </div>
            <p className="text-gray-400 text-sm">Or <button onClick={() => { setTab('referral'); setShowPaywall(false); }} className="text-green-600 hover:underline font-medium">Refer 1 friend → get 5 more free questions</button></p>
          </div>
        </div>
      )}
    </div>
  );
}
