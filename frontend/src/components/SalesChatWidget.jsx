import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { X, Send, Bot, Minimize2, MessageCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SalesChatWidget = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`sales_${Date.now()}`);
  const [initialized, setInitialized] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && !initialized) {
      setInitialized(true);
      sendGreeting();
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendGreeting = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/chat/sales`, {
        message: 'Hello, I just visited your website',
        session_id: sessionId
      });
      setMessages([{ role: 'ai', text: res.data.response }]);
    } catch {
      setMessages([{ role: 'ai', text: 'Namaste! Main TaxSaathi AI hun. Aapka koi bhi GST sawaal ho — bilkul free mein poochh sakte ho. Aapka business kya hai?' }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await axios.post(`${API}/chat/sales`, { message: text, session_id: sessionId });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, ek second mein try karein.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div data-testid="sales-chat-widget" className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 shadow-2xl rounded-2xl overflow-hidden flex flex-col"
      style={{ height: '520px', background: '#040906', border: '1px solid rgba(22,163,74,0.3)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-green-900/40"
        style={{ background: 'linear-gradient(135deg, #0d4d20, #16a34a)' }}>
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <Bot size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="text-white font-semibold text-sm font-['Outfit']">TaxSaathi AI Sales</div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
            <span className="text-green-200 text-xs">Online — GST expert</span>
          </div>
        </div>
        <button data-testid="close-chat-widget" onClick={onClose} className="text-white/60 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide" style={{ background: '#040906' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-6 h-6 bg-green-800 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <Bot size={11} className="text-green-300" />
              </div>
            )}
            <div className={`max-w-[82%] px-3.5 py-2.5 text-sm rounded-2xl leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-green-600 text-white rounded-br-sm'
                : 'bg-[#0d1f12] border border-green-900/50 text-gray-200 rounded-bl-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-800 rounded-full flex items-center justify-center">
              <Bot size={11} className="text-green-300" />
            </div>
            <div className="bg-[#0d1f12] border border-green-900/50 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(d => <div key={d} className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-green-900/30" style={{ background: '#061a0e' }}>
        <div className="flex gap-2">
          <input
            data-testid="sales-chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="GST sawaal poochho..."
            disabled={loading}
            className="flex-1 bg-black/40 border border-green-900/40 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-600 transition-colors"
          />
          <button
            data-testid="sales-chat-send"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-3 py-2 rounded-xl transition-all"
          >
            <Send size={15} />
          </button>
        </div>
        <p className="text-center text-xs text-gray-700 mt-2">taxsaathi.info</p>
      </div>
    </div>
  );
};

export default SalesChatWidget;
