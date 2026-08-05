import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Trash2, Bot, User, Loader2, Mic, Volume2, MessageCircle } from 'lucide-react';
import { dark as T, SPEECH_LANG, detectLang } from '@/lib/theme';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CA_WHATSAPP = 'https://wa.me/917698877447?text=Hi,%20I%20need%20help%20from%20a%20CA%20on%20a%20tax%20matter';

// ── UI copy (Gujarati-first — that's the brand promise). Reply language is not
// toggled here: the assistant answers in whatever language each message is written in.
const CONTENT = {
  gu: {
    greeting: 'નમસ્તે! 🙏 હું TaxSathi AI છું. GST, ITR કે કોઈપણ ભારતીય ટેક્સનો સવાલ પૂછો — ગુજરાતી, હિન્દી કે English માં.',
    placeholder: 'સવાલ લખો કે 🎤 દબાવીને બોલો…',
    quick: [
      'GST રજિસ્ટ્રેશન માટે કયા ડોક્યુમેન્ટ જોઈએ?',
      'ITR ભરવાની છેલ્લી તારીખ ક્યારે છે?',
      'કમ્પોઝિશન સ્કીમ શું છે?',
      'GSTR-3B લેટ ફી કેટલી છે?',
    ],
    talkCA: 'CA સાથે વાત કરો',
    err: 'કંઈક ખોટું થયું. ફરી પ્રયત્ન કરો.',
  },
};

const stripMd = (t) => t.replace(/[*_`>#|]/g, '').replace(/\s+/g, ' ').trim();

// ── Markdown renderer ────────────────────────────────────────────────────────
const formatInline = (text) => {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2]) parts.push(<strong key={match.index} style={{ color: T.text, fontWeight: 700 }}>{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={match.index} style={{ color: T.textSub }}>{match[3]}</em>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
};

const renderMarkdown = (text) => text.split('\n').map((line, i) => {
  if (line.startsWith('|')) {
    const cells = line.split('|').filter((c) => c.trim() !== '');
    if (cells.every((c) => /^[-\s]+$/.test(c))) return null;
    return (
      <div key={i} style={{ display: 'flex', gap: 8, borderBottom: `1px solid ${T.border}`, padding: '4px 0', fontSize: 14 }}>
        {cells.map((cell, j) => <span key={j} style={{ flex: 1, color: T.textSub }}>{formatInline(cell.trim())}</span>)}
      </div>
    );
  }
  if (/^\d+\./.test(line)) {
    return (
      <div key={i} style={{ display: 'flex', gap: 8, margin: '2px 0' }}>
        <span style={{ color: T.primary, fontWeight: 700 }}>{line.match(/^\d+/)[0]}.</span>
        <span>{formatInline(line.replace(/^\d+\.\s*/, ''))}</span>
      </div>
    );
  }
  if (line.startsWith('- ') || line.startsWith('* ')) {
    return (
      <div key={i} style={{ display: 'flex', gap: 8, margin: '2px 0' }}>
        <span style={{ color: T.primary }}>•</span><span>{formatInline(line.slice(2))}</span>
      </div>
    );
  }
  if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
  return <div key={i}>{formatInline(line)}</div>;
}).filter(Boolean);

export default function GSTAssistant() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: CONTENT.gu.greeting }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  const C = CONTENT.gu;
  const sttSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    const next = [...messages, { role: 'user', content: userText }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const history = next.filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API}/chat/assistant`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data?.reply || C.err }]);
    } catch (err) {
      console.error('sendMessage error:', err);
      setMessages((prev) => [...prev, { role: 'assistant', content: `❌ ${C.err}` }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, C.err]);

  // ── Voice input (Web Speech API; production: Sarvam / Bhashini) ─────────────
  const toggleMic = () => {
    if (!sttSupported) return;
    if (listening) { recognitionRef.current?.stop(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = SPEECH_LANG.gu;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => { const t = e.results[0][0].transcript; setInput(t); sendMessage(t); };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  // ── Voice readback — speaks in the language the answer is written in ────────
  const speak = (text, id) => {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    if (speakingId === id) { setSpeakingId(null); return; }
    const u = new SpeechSynthesisUtterance(stripMd(text));
    u.lang = SPEECH_LANG[detectLang(text)];
    const v = window.speechSynthesis.getVoices().find((vo) => vo.lang === u.lang)
      || window.speechSynthesis.getVoices().find((vo) => vo.lang.startsWith(u.lang.slice(0, 2)));
    if (v) u.voice = v;
    u.onend = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(u);
  };

  const resetChat = () => {
    window.speechSynthesis?.cancel();
    setMessages([{ role: 'assistant', content: C.greeting }]);
  };

  const iconBtn = { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', flexShrink: 0 };

  return (
    <div style={{ minHeight: '100vh', background: T.page, color: T.text, display: 'flex', flexDirection: 'column', fontFamily: T.fontUI }}>
      {/* ── Header ── */}
      <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <Link to="/dashboard" style={{ color: T.textMute, display: 'flex' }}><ArrowLeft size={22} /></Link>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bot size={20} style={{ color: T.primary }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>TaxSathi AI</div>
          <div style={{ fontSize: 12.5, color: T.send, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.send, display: 'inline-block' }} /> Online
          </div>
        </div>
        <button onClick={resetChat} title="Clear chat" style={{ ...iconBtn, background: 'transparent', color: T.textMute }}><Trash2 size={18} /></button>
      </header>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div key={i} style={{ display: 'flex', gap: 10, flexDirection: isUser ? 'row-reverse' : 'row' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isUser ? 'rgba(124,58,237,0.25)' : 'rgba(139,92,246,0.15)' }}>
                {isUser ? <User size={15} style={{ color: T.send }} /> : <Bot size={15} style={{ color: T.primary }} />}
              </div>
              <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4 }}>
                <div style={{
                  borderRadius: isUser ? `${T.radiusLg}px ${T.radiusLg}px 4px ${T.radiusLg}px` : `${T.radiusLg}px ${T.radiusLg}px ${T.radiusLg}px 4px`,
                  padding: '11px 15px', fontSize: 15.5, lineHeight: 1.6, fontFamily: T.fontGu,
                  background: isUser ? T.primary : T.surface, color: isUser ? '#fff' : T.text,
                  border: isUser ? 'none' : `1px solid ${T.border}`, boxShadow: isUser ? 'none' : '0 1px 2px rgba(15,23,42,0.04)',
                }}>
                  {isUser ? msg.content : renderMarkdown(msg.content)}
                </div>
                {!isUser && ttsSupported && (
                  <button onClick={() => speak(msg.content, i)} title="Listen"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', cursor: 'pointer',
                      color: speakingId === i ? T.send : T.textMute, fontSize: 12.5, padding: '2px 4px' }}>
                    <Volume2 size={15} /> {speakingId === i ? '...' : 'સાંભળો'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={15} style={{ color: T.primary }} />
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '12px 16px' }}>
              <Loader2 size={16} className="animate-spin" style={{ color: T.primary }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Quick questions + Talk to a CA ── */}
      {messages.length <= 1 && (
        <div style={{ padding: '0 16px 6px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {C.quick.map((q, i) => (
            <button key={i} onClick={() => sendMessage(q)}
              style={{ fontSize: 13.5, fontFamily: T.fontGu, borderRadius: 999, padding: '7px 14px', cursor: 'pointer',
                background: T.surface, border: `1px solid ${T.border}`, color: T.textSub }}>
              {q}
            </button>
          ))}
        </div>
      )}
      <div style={{ padding: '0 16px 8px' }}>
        <a href={CA_WHATSAPP} target="_blank" rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontFamily: T.fontGu, fontWeight: 700,
            color: T.send, textDecoration: 'none', border: `1px solid ${T.send}`, borderRadius: 999, padding: '7px 14px' }}>
          <MessageCircle size={15} /> {C.talkCA}
        </a>
      </div>

      {/* ── Disclaimer ── */}
      <div style={{ padding: '4px 16px', fontSize: 12, lineHeight: 1.5, textAlign: 'center', color: T.textMute }}>
        ⚠️ AI can make mistakes — general info, not professional advice. Verify important matters with a CA.
      </div>

      {/* ── Input bar ── */}
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder={C.placeholder}
          style={{ flex: 1, background: T.page, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 16px',
            fontSize: 15.5, fontFamily: T.fontGu, color: T.text, outline: 'none' }}
        />
        {sttSupported && (
          <button onClick={toggleMic} title="Speak"
            style={{ ...iconBtn, width: 44, height: 44, background: listening ? T.danger : T.surfaceAlt, color: listening ? '#fff' : T.textSub,
              animation: listening ? 'tsPulse 1s infinite' : 'none' }}>
            <Mic size={19} />
          </button>
        )}
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
          style={{ ...iconBtn, width: 44, height: 44, background: T.send, color: '#fff', opacity: !input.trim() || loading ? 0.4 : 1,
            cursor: !input.trim() || loading ? 'not-allowed' : 'pointer' }}>
          <Send size={19} />
        </button>
      </div>
      <style>{`@keyframes tsPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.5); } 50% { box-shadow: 0 0 0 8px rgba(220,38,38,0); } }`}</style>
    </div>
  );
}
