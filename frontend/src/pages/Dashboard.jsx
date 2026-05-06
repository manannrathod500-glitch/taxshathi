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
  const { user, profile, logout, checkAILimits } = useAuth();
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

  const questionsUsed = profile?.ai_calls_this_month || 0;
  const bonusQ = profile?.bonus_questions || 0;
  const planFree = profile?.plan !== 'pro' && profile?.plan !== 'premium';
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
  }, [searchParams]);

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API}/conversations`);
      setHistory(res.data);
    } catch { toast.error('Could not load history'); }
  };

  const loadReferral = async () => {
    try {
      const res = await axios.get(`${API}/referral/stats`);
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
      // Ensure AI limit is checked
      if (!checkAILimits()) {
        setShowPaywall(true);
        setChatLoading(false);
        return;
      }
      const res = await axios.post(`${API}/chat/advisor`, { message: text, session_id: sessionId });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.response }]);
      // We don't check res.data.questions_remaining since we rely on our profile now
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
      const res = await axios.post(`${API}/subscribe`, { plan, payment_id: `mock_${Date.now()}` });
      // In a real app we would update the profile in Supabase here
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
            <div className="text-sm font-medium text-gray-900">{profile?.name || user?.email}</div>
            <div className="text-xs text-gray-400">{profile?.business_name || 'Business'}</div>
          </div>
          <button data-testid="logout-btn" onClick={() => { logout(); navigate('/'); }} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ── WELCOME BANNER ── */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-4 md:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <span className="font-semibold">Namaste, {profile?.name?.split(' ')[0] || user?.email}! </span>
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
      </div>
    </div>
  );
}
