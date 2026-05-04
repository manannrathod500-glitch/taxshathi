import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Send, Zap, RotateCcw, ChevronDown } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SUGGESTED = [
  'How do I file GSTR-3B for a textile business in Surat?',
  'GSTR-1 filing deadline for quarterly filer?',
  'GST rate on diamond jewellery exports?',
  'How to claim ITC on raw material purchases?',
  'What is the composition scheme limit for 2025?',
  'E-way bill required for goods under ₹50,000?',
];

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3">
    {[0, 1, 2].map(i => (
      <div key={i} className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
    ))}
  </div>
);

export default function DemoPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(`demo_${Date.now()}`);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setShowSuggestions(false);
    setMessages(prev => [...prev, { role: 'user', text: msg, ts: new Date() }]);
    setLoading(true);
    try {
      const res = await axios.post(`${API}/chat/demo`, { message: msg, session_id: sessionId });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.response, ts: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Connection error. Please try again.', ts: new Date(), error: true }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const reset = () => {
    setMessages([]);
    setSessionId(`demo_${Date.now()}`);
    setShowSuggestions(true);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-body">
      {/* Header */}
      <div className="border-b border-white/8 px-5 py-4 flex items-center justify-between bg-[#050505]/80 backdrop-blur-2xl sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link to="/" data-testid="demo-back" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5 text-sm">
            <ArrowLeft size={15} /> Back
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
              <Zap size={12} className="text-black" />
            </div>
            <span className="font-display font-bold text-white text-sm">TaxSathi AI</span>
            <span className="mono-label px-2 py-0.5 border border-white/10 rounded-full">Demo</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse-dot" />
            Gemini 2.5 Flash
          </div>
          <button data-testid="demo-reset" onClick={reset} className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/6">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 flex flex-col" style={{ minHeight: 'calc(100vh - 130px)' }}>
        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center pb-8">
            <div className="w-14 h-14 bg-white/4 border border-white/10 rounded-2xl flex items-center justify-center mb-5 animate-float">
              <Zap size={22} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold font-display text-white mb-2 text-center">Ask TaxSathi AI</h2>
            <p className="text-zinc-500 text-sm text-center max-w-sm mb-8">
              Ask any GST question in English, Hindi, or Gujarati. Powered by Gemini 2.5 Flash.
            </p>
            {showSuggestions && (
              <div className="w-full max-w-2xl">
                <div className="mono-label mb-3 text-center">Suggested Questions</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED.map((s, i) => (
                    <button key={i} data-testid={`suggestion-${i}`} onClick={() => sendMessage(s)}
                      className="ts-card text-left px-4 py-3 text-sm text-zinc-400 hover:text-white hover:border-white/20 transition-all text-[13px]">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="flex-1 space-y-6 pb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                    <Zap size={12} className="text-black" />
                  </div>
                )}
                <div className={`max-w-[85%] ${msg.role === 'user'
                  ? 'bg-white/8 border border-white/12 text-white rounded-2xl rounded-tr-md px-4 py-3'
                  : `terminal-bg text-zinc-300 rounded-2xl rounded-tl-md px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-wrap ${msg.error ? 'border-red-500/20 text-red-400' : ''}`
                } font-${msg.role === 'ai' ? 'mono-code' : 'body'} text-sm`}>
                  {msg.text}
                  {msg.role === 'ai' && (
                    <div className="mono-label mt-3 pt-3 border-t border-white/6 flex items-center gap-2">
                      <div className="w-1 h-1 bg-[#22c55e] rounded-full" /> Gemini 2.5 Flash • TaxSathi AI
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <Zap size={12} className="text-black" />
                </div>
                <div className="terminal-bg rounded-2xl rounded-tl-md">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input area */}
        <div className="sticky bottom-0 pt-4 bg-[#050505]">
          <div className="terminal-bg p-1 rounded-xl flex items-end gap-2">
            <textarea
              ref={inputRef}
              data-testid="demo-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask a GST question... (Enter to send, Shift+Enter for new line)"
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent text-white text-sm px-3 py-2.5 focus:outline-none resize-none placeholder-zinc-600 font-mono-code min-h-[42px] max-h-[120px]"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            />
            <button
              data-testid="demo-send"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="bg-white text-black p-2.5 rounded-lg hover:bg-zinc-200 disabled:opacity-30 transition-all flex-shrink-0 mb-0.5 mr-0.5"
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-zinc-700 text-[11px] text-center mt-2">
            ⚠️ Filing se pehle apne CA se verify zaroor karein — TaxSathi AI provides guidance only
          </p>
        </div>
      </div>
    </div>
  );
}
