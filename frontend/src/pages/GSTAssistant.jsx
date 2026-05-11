import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Trash2, Bot, User, Loader2 } from 'lucide-react';
 
const DEEPSEEK_API_KEY = process.env.REACT_APP_DEEPSEEK_API_KEY;
 
const SYSTEM_PROMPT = `You are TaxSathi AI — an expert Indian tax assistant. You help Indian CAs, tax professionals, and SMB owners with:
- GST (Goods and Services Tax) questions
- ITR (Income Tax Return) filing
- TDS/TCS rules
- Indian tax compliance
- Invoice and billing under GST
 
You respond in the same language the user writes in — Hindi, Gujarati, or English.
If asked anything unrelated to Indian tax/finance, politely say: "Main sirf GST, ITR aur Indian tax ke sawaalon mein madad kar sakta hoon."
Keep answers clear, practical, and concise.`;
 
const QUICK_QUESTIONS = [
  "GST registration ke liye kya documents chahiye?",
  "ITR filing last date kab hai?",
  "Composition scheme kya hoti hai?",
  "TDS kab katna padta hai?",
];
 
// Simple markdown renderer
const renderMarkdown = (text) => {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim() !== '');
      const isSeparator = cells.every(c => /^[-\s]+$/.test(c));
      if (isSeparator) return null;
      return (
        <div key={i} className="flex gap-2 text-xs border-b border-white/10 py-1">
          {cells.map((cell, j) => (
            <span key={j} className="flex-1 text-white/80">{formatInline(cell.trim())}</span>
          ))}
        </div>
      );
    }
    if (/^\d+\./.test(line)) {
      return (
        <div key={i} className="flex gap-2 my-0.5">
          <span style={{ color: '#8b5cf6' }} className="font-bold text-xs mt-0.5">{line.match(/^\d+/)[0]}.</span>
          <span>{formatInline(line.replace(/^\d+\.\s*/, ''))}</span>
        </div>
      );
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <div key={i} className="flex gap-2 my-0.5">
          <span style={{ color: '#8b5cf6' }} className="mt-1">•</span>
          <span>{formatInline(line.slice(2))}</span>
        </div>
      );
    }
    if (line.startsWith('  - ') || line.startsWith('  * ')) {
      return (
        <div key={i} className="flex gap-2 my-0.5 ml-4">
          <span style={{ color: '#a78bfa' }} className="mt-1">◦</span>
          <span>{formatInline(line.slice(4))}</span>
        </div>
      );
    }
    if (line.startsWith('> ')) {
      return (
        <div key={i} style={{ borderLeftColor: '#8b5cf6' }} className="border-l-2 pl-2 my-1 text-white/60 italic">
          {formatInline(line.slice(2))}
        </div>
      );
    }
    if (line.trim() === '') return <div key={i} className="h-2" />;
    return <div key={i}>{formatInline(line)}</div>;
  }).filter(Boolean);
};
 
const formatInline = (text) => {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2]) parts.push(<strong key={match.index} className="text-white font-semibold">{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={match.index} className="text-white/80 italic">{match[3]}</em>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
};
 
export default function GSTAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Namaste! 🙏 Main TaxSathi AI hoon. GST, ITR, ya koi bhi Indian tax sawaal poochho — Hindi, Gujarati, ya English mein!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
 
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
 
  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
 
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
 
    try {
      const history = newMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));
 
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });
 
      if (!response.ok) {
        const errData = await response.json();
        console.error('DeepSeek API error:', errData);
        throw new Error('API error');
      }
 
      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content || 'Kuch galat ho gaya. Dobara try karein.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error('sendMessage error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error aaya. Dobara try karein.' }]);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <Link to="/dashboard" className="text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.2)' }}
          >
            <Bot size={16} style={{ color: '#8b5cf6' }} />
          </div>
          <div>
            <div className="font-semibold text-sm">TaxSathi AI</div>
            <div className="text-xs" style={{ color: '#8b5cf6' }}>● Online</div>
          </div>
        </div>
        <button
          onClick={() => setMessages([{
            role: 'assistant',
            content: 'Namaste! 🙏 Main TaxSathi AI hoon. GST, ITR, ya koi bhi Indian tax sawaal poochho!'
          }])}
          className="ml-auto text-white/30 hover:text-white/70 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
 
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: msg.role === 'assistant' ? 'rgba(139,92,246,0.2)' : 'rgba(99,102,241,0.2)' }}
            >
              {msg.role === 'assistant'
                ? <Bot size={14} style={{ color: '#8b5cf6' }} />
                : <User size={14} style={{ color: '#818cf8' }} />
              }
            </div>
            <div
              className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
              style={{
                background: msg.role === 'assistant' ? 'rgba(255,255,255,0.05)' : '#7c3aed',
                color: 'rgba(255,255,255,0.9)'
              }}
            >
              {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.2)' }}
            >
              <Bot size={14} style={{ color: '#8b5cf6' }} />
            </div>
            <div className="bg-white/5 rounded-2xl px-4 py-3">
              <Loader2 size={14} className="animate-spin text-white/50" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
 
      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {QUICK_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              className="text-xs rounded-full px-3 py-1.5 transition-colors"
              style={{
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.25)',
                color: 'rgba(255,255,255,0.7)'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)'; }}
            >
              {q}
            </button>
          ))}
        </div>
      )}
 
      {/* Input */}
      <div className="border-t border-white/10 px-4 py-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="GST ya ITR sawaal poochho..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-white/30"
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: '#7c3aed' }}
          onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#8b5cf6'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#7c3aed'; }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
