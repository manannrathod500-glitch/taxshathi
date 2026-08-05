import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, FileText, CalendarClock, AlertTriangle, ArrowRight, Bot, Mic } from 'lucide-react';
import { bright as T } from '@/lib/theme';
import { upcomingDeadlines, lateFee } from '@/lib/gstCalendar';

const CA_WHATSAPP = 'https://wa.me/917698877447?text=Hi,%20I%20need%20help%20from%20a%20CA';

// Local business-owner home. Unlike the CA dashboard (client links/QR), this is
// for the shop owner / trader themselves: their GST deadlines up front, a
// late-fee calculator, and one-tap actions — Gujarati-first, Bright Trust theme.
export default function OwnerHome() {
  const deadlines = upcomingDeadlines();
  const [lateDays, setLateDays] = useState(7);
  const [nil, setNil] = useState(false);
  const fee = lateFee({ daysLate: lateDays, nilReturn: nil });

  const statusColor = (s) => (s === 'due' ? T.danger : s === 'soon' ? '#d97706' : T.send);
  const statusText = (d) =>
    d.daysLeft <= 0 ? `Overdue by ${Math.abs(d.daysLeft)} days` : `In ${d.daysLeft} days`;

  const tiles = [
    { icon: <MessageSquare size={22} />, title: 'સવાલ પૂછો', sub: 'Ask any GST/ITR question', to: '/gst-assistant', primary: true },
    { icon: <FileText size={22} />, title: 'ઇન્વોઇસ બનાવો', sub: 'Make a GST invoice', to: '/invoice' },
    { icon: <CalendarClock size={22} />, title: 'મારી ડેડલાઇન', sub: 'GST due dates', to: '/gst-assistant' },
  ];

  const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, boxShadow: '0 1px 3px rgba(15,23,42,0.05)' };

  return (
    <div style={{ minHeight: '100vh', background: T.page, color: T.text, fontFamily: T.fontUI }}>
      {/* Header with brand + differentiating tagline */}
      <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(79,70,229,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bot size={22} style={{ color: T.primary }} />
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: T.text, letterSpacing: '0.01em' }}>TAX SATHI</div>
          <div style={{ fontSize: 11.5, color: T.accent, fontWeight: 700, fontFamily: T.fontGu }}>ગુજરાતનો AI ટેક્સ સાથી</div>
        </div>
        <Link to="/gst-assistant" style={{ marginLeft: 'auto', background: T.primary, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14, padding: '9px 16px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Mic size={15} /> પૂછો
        </Link>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px 60px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, fontFamily: T.fontGu }}>નમસ્તે! 🙏</h1>
        <p style={{ color: T.textSub, fontSize: 15.5, marginBottom: 24, fontFamily: T.fontGu }}>તમારો ટેક્સ એક નજરમાં — ડેડલાઇન, લેટ ફી અને જવાબ.</p>

        {/* ── GST deadline value panel (the "show real value" piece) ── */}
        <div style={{ ...card, padding: '20px 20px 8px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <CalendarClock size={18} style={{ color: T.primary }} />
            <span style={{ fontWeight: 800, fontSize: 16 }}>તમારી GST ડેડલાઇન</span>
          </div>
          {deadlines.map((d) => (
            <div key={d.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{d.label}</div>
                <div style={{ fontSize: 12.5, color: T.textMute }}>{d.desc} · due {d.dueText}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: statusColor(d.status), background: `${statusColor(d.status)}14`, borderRadius: 999, padding: '5px 12px', whiteSpace: 'nowrap' }}>
                {statusText(d)}
              </span>
            </div>
          ))}
          <div style={{ fontSize: 11.5, color: T.textMute, padding: '10px 0', borderTop: `1px solid ${T.border}` }}>
            General monthly due dates — verify special cases with your CA.
          </div>
        </div>

        {/* ── Late-fee calculator (exact math ChatGPT guesses wrong) ── */}
        <div style={{ ...card, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <AlertTriangle size={18} style={{ color: '#d97706' }} />
            <span style={{ fontWeight: 800, fontSize: 16 }}>લેટ ફી કેલ્ક્યુલેટર</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 14, color: T.textSub }}>
              Days late:{' '}
              <input type="number" min={0} value={lateDays} onChange={(e) => setLateDays(Math.max(0, +e.target.value || 0))}
                style={{ width: 70, padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, color: T.text, background: T.page }} />
            </label>
            <label style={{ fontSize: 14, color: T.textSub, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={nil} onChange={(e) => setNil(e.target.checked)} /> Nil return
            </label>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: T.danger }}>₹{fee.amount.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 11.5, color: T.textMute }}>₹{fee.perDay}/day{fee.capped ? ' (capped)' : ''} + 18% p.a. interest on tax</div>
            </div>
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14, marginBottom: 18 }}>
          {tiles.map((t) => (
            <Link key={t.title} to={t.to} style={{ ...card, padding: 18, textDecoration: 'none', color: T.text, display: 'flex', flexDirection: 'column', gap: 10,
              ...(t.primary ? { background: 'linear-gradient(135deg, rgba(79,70,229,0.10), rgba(79,70,229,0.03))', borderColor: 'rgba(79,70,229,0.35)' } : {}) }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(79,70,229,0.12)', color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.icon}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, fontFamily: T.fontGu }}>{t.title}</div>
                <div style={{ fontSize: 12.5, color: T.textMute }}>{t.sub}</div>
              </div>
              <ArrowRight size={16} style={{ color: T.primary, marginTop: 'auto' }} />
            </Link>
          ))}
        </div>

        <a href={CA_WHATSAPP} target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...card, padding: '14px', textDecoration: 'none', color: T.send, fontWeight: 700, fontSize: 15, fontFamily: T.fontGu, borderColor: T.send }}>
          <MessageSquare size={17} /> કોઈ ગૂંચવણ? CA સાથે વાત કરો
        </a>
      </main>
    </div>
  );
}
