import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Zap, CheckCircle, Circle, ArrowRight, ChevronRight, RefreshCw } from 'lucide-react';
import { FileText, Receipt, Users, CalendarCheck, Briefcase, BarChart3 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_CONFIG = {
  live: { label: 'Live', color: '#22c55e', bgColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', textColor: '#22c55e' },
  next: { label: 'Up Next', color: '#60a5fa', bgColor: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.3)', textColor: '#60a5fa' },
  building: { label: 'Building', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)', textColor: '#f59e0b' },
  planned: { label: 'Planned', color: '#52525b', bgColor: 'rgba(82,82,91,0.1)', borderColor: 'rgba(82,82,91,0.2)', textColor: '#71717a' },
};

const MODULE_ICONS = {
  website: Zap, gst: FileText, invoice: Receipt, crm: Users, compliance: CalendarCheck, ca: Briefcase, insights: BarChart3
};

const ROADMAP = [
  { id: 'website', name: 'Marketing Website', tier: '-', effort: 'Low', phase: 'Phase 0' },
  { id: 'gst', name: 'AI GST Assistant', tier: 'Starter ₹2,999', effort: 'High', phase: 'Phase 1' },
  { id: 'invoice', name: 'Smart Invoice Engine', tier: 'Starter ₹2,999', effort: 'High', phase: 'Phase 1' },
  { id: 'crm', name: 'Buyer/Supplier CRM', tier: 'Growth ₹7,999', effort: 'Medium', phase: 'Phase 2' },
  { id: 'compliance', name: 'Compliance Calendar', tier: 'Growth ₹7,999', effort: 'Medium', phase: 'Phase 2' },
  { id: 'ca', name: 'CA Connect Marketplace', tier: 'Enterprise ₹19,999', effort: 'Medium', phase: 'Phase 3' },
  { id: 'insights', name: 'Business Insights', tier: 'Enterprise ₹19,999', effort: 'Low', phase: 'Phase 3' },
];

const ARR_MATH = [
  { tier: 'Starter', price: 2999, customers: 100, label: '100 Starter businesses' },
  { tier: 'Growth', price: 7999, customers: 500, label: '500 Growth businesses' },
  { tier: 'Enterprise', price: 19999, customers: 200, label: '200 Enterprise businesses' },
];

export default function ProgressTracker() {
  const [modules, setModules] = useState([]);
  const [completionPct, setCompletionPct] = useState(0);
  const [nextStep, setNextStep] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusOverrides, setStatusOverrides] = useState({});

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/progress`);
      setModules(res.data.modules);
      setCompletionPct(res.data.completion_pct);
      setNextStep(res.data.next_step);
    } catch {
      // fallback
      setModules(ROADMAP.map((m, i) => ({ ...m, status: i === 0 ? 'live' : i === 1 ? 'next' : 'planned', desc: '', revenue_impact: '' })));
      setCompletionPct(14);
    } finally { setLoading(false); }
  };

  const toggleStatus = async (moduleId, currentStatus) => {
    const cycle = { planned: 'building', building: 'next', next: 'live', live: 'planned' };
    const newStatus = cycle[currentStatus] || 'planned';
    setStatusOverrides(prev => ({ ...prev, [moduleId]: newStatus }));
    try {
      await axios.patch(`${API}/progress/${moduleId}`, { status: newStatus });
    } catch {}
  };

  const getStatus = (mod) => statusOverrides[mod.id] || mod.status;

  const liveCount = modules.filter(m => getStatus(m) === 'live').length;
  const pct = modules.length > 0 ? Math.round((liveCount / modules.length) * 100) : completionPct;

  // ARR calculation
  const totalARR = ARR_MATH.reduce((sum, t) => sum + t.price * t.customers * 12, 0);
  const targetARR = 100_000_000; // 10 crore

  return (
    <div className="min-h-screen bg-[#050505] font-body text-white">
      {/* Header */}
      <div className="border-b border-white/8 px-5 py-4 flex items-center justify-between bg-[#050505]/80 backdrop-blur-2xl sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link to="/" data-testid="progress-back" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5 text-sm">
            <ArrowLeft size={15} /> Home
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center"><Zap size={12} className="text-black" /></div>
            <span className="font-display font-bold text-white text-sm">Progress Tracker</span>
          </div>
        </div>
        <button onClick={loadProgress} data-testid="refresh-progress" className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/6">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="mb-8">
          <div className="mono-label mb-2">Build Dashboard</div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">Product Progress</h1>
          <p className="text-zinc-500 mt-2 text-sm">Track TaxSathi AI's build journey to ₹10 Crore ARR. Click status badges to update.</p>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Overall Completion', value: `${pct}%`, sub: `${liveCount}/${modules.length} modules live` },
            { label: 'ARR Potential (Model)', value: `₹${(totalARR / 10_000_000).toFixed(1)}Cr`, sub: 'When all tiers filled' },
            { label: 'ARR Target', value: '₹10 Crore', sub: 'In 18-24 months' },
            { label: 'Months to Target', value: pct >= 100 ? 'Now!' : `~${Math.max(1, Math.round(18 * (1 - pct / 100)))}mo`, sub: 'Estimated at current pace' },
          ].map((m, i) => (
            <div key={i} className="ts-card p-5 rounded-xl">
              <div className="mono-label mb-2">{m.label}</div>
              <div className="text-2xl font-bold font-display text-white">{m.value}</div>
              <div className="text-zinc-600 text-xs mt-0.5">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="ts-card p-6 rounded-xl mb-10">
          <div className="flex items-center justify-between mb-3">
            <div className="text-white font-semibold font-display">Overall Build Progress</div>
            <div className="text-4xl font-bold font-display text-white">{pct}%</div>
          </div>
          <div className="h-2 bg-white/6 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-zinc-600">
            <span>0% — Idea</span>
            <span>50% — MVP</span>
            <span>100% — Full Launch</span>
          </div>
        </div>

        {/* Modules grid */}
        <div className="mb-10">
          <div className="mono-label mb-4">Module Status <span className="text-zinc-700 font-normal normal-case tracking-normal ml-2 text-[10px]">(Click status to cycle: Planned → Building → Up Next → Live)</span></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((mod, i) => {
              const status = getStatus(mod);
              const sc = STATUS_CONFIG[status] || STATUS_CONFIG.planned;
              const Icon = MODULE_ICONS[mod.id] || Zap;
              const isLive = status === 'live';
              return (
                <div key={mod.id} data-testid={`module-card-${mod.id}`}
                  className="ts-card p-5 rounded-xl transition-all duration-300 flex items-start gap-4"
                  style={isLive ? { borderColor: sc.borderColor, boxShadow: `0 0 0 1px ${sc.borderColor}` } : {}}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: sc.bgColor, border: `1px solid ${sc.borderColor}` }}>
                    <Icon size={16} style={{ color: sc.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="mono-label mb-0.5">{mod.phase || `Phase ${i}`}</div>
                        <div className={`font-semibold text-sm font-display ${isLive ? 'text-white' : 'text-zinc-300'}`}>{mod.name}</div>
                      </div>
                      <button data-testid={`toggle-status-${mod.id}`}
                        onClick={() => toggleStatus(mod.id, status)}
                        className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium transition-all hover:scale-105"
                        style={{ background: sc.bgColor, color: sc.textColor, border: `1px solid ${sc.borderColor}` }}>
                        {sc.label}
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                      <span>{mod.tier || 'Infrastructure'}</span>
                      {mod.effort && <><span>•</span><span>Effort: {mod.effort}</span></>}
                      {mod.revenue_impact && <><span>•</span><span>{mod.revenue_impact}</span></>}
                    </div>
                    {mod.desc && <div className="text-zinc-500 text-xs mt-1.5 leading-relaxed">{mod.desc}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next step */}
        {nextStep && (
          <div className="ts-card p-6 rounded-xl mb-10 border-[#60a5fa]/20">
            <div className="mono-label mb-2" style={{ color: '#60a5fa' }}>Next Recommended Action</div>
            <div className="text-white font-semibold font-display text-lg flex items-center gap-2">
              <ArrowRight size={18} style={{ color: '#60a5fa' }} /> {nextStep}
            </div>
          </div>
        )}

        {/* ARR Math */}
        <div className="ts-card p-6 rounded-xl mb-10">
          <div className="mono-label mb-4">₹10 Crore ARR — Revenue Model</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {ARR_MATH.map((t, i) => {
              const annualRev = t.price * t.customers * 12;
              const pctOfTarget = Math.round((annualRev / targetARR) * 100);
              return (
                <div key={i} className="bg-white/3 border border-white/8 rounded-xl p-4">
                  <div className="mono-label mb-2">{t.tier}</div>
                  <div className="text-white font-bold font-display text-lg">₹{t.price.toLocaleString()}<span className="text-zinc-500 text-sm font-normal">/mo</span></div>
                  <div className="text-zinc-400 text-sm mt-1">{t.customers} businesses × 12</div>
                  <div className="text-[#22c55e] font-semibold mt-2">= ₹{(annualRev / 100000).toFixed(0)}L/yr</div>
                  <div className="h-1.5 bg-white/6 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-[#22c55e]/60 rounded-full" style={{ width: `${pctOfTarget}%` }} />
                  </div>
                  <div className="text-zinc-600 text-xs mt-1">{pctOfTarget}% of ₹10Cr</div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-white/8 pt-4 flex items-center justify-between">
            <div>
              <div className="text-zinc-500 text-sm">Total Modeled ARR</div>
              <div className="text-2xl font-bold font-display text-white mt-0.5">₹{(totalARR / 10_000_000).toFixed(1)} Crore</div>
            </div>
            <div className="text-right">
              <div className="text-zinc-500 text-sm">Target Gap</div>
              <div className="text-lg font-semibold text-[#f59e0b] mt-0.5">
                {totalARR >= targetARR ? 'Target Achieved!' : `₹${((targetARR - totalARR) / 10_000_000).toFixed(1)}Cr remaining`}
              </div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Try AI Demo', to: '/demo', desc: 'Test the live Gemini AI' },
            { label: 'Module Analyzer', to: '/analyzer', desc: 'Analyze new module ideas' },
            { label: 'Back to Website', to: '/', desc: 'View marketing landing page' },
          ].map((link, i) => (
            <Link key={i} to={link.to} className="ts-card p-4 rounded-xl flex items-center justify-between hover:border-white/20 transition-all group">
              <div>
                <div className="text-white text-sm font-semibold font-display group-hover:text-white">{link.label}</div>
                <div className="text-zinc-600 text-xs mt-0.5">{link.desc}</div>
              </div>
              <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
