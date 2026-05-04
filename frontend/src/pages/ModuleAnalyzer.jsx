import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Zap, Loader, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SECTION_LABELS = {
  '## a)': { label: 'Product Fit', color: '#60a5fa' },
  '## b)': { label: 'Pricing Tier', color: '#a78bfa' },
  '## c)': { label: 'Revenue Impact', color: '#22c55e' },
  '## d)': { label: 'Technical Implementation', color: '#f59e0b' },
  '## e)': { label: 'Stickiness vs Complexity', color: '#fb923c' },
};

// Parse the AI analysis into sections
const parseAnalysis = (text) => {
  if (!text) return [];
  const sections = [];
  const lines = text.split('\n');
  let current = null;
  for (const line of lines) {
    const matchKey = Object.keys(SECTION_LABELS).find(k => line.startsWith(k));
    if (matchKey) {
      if (current) sections.push(current);
      current = { key: matchKey, ...SECTION_LABELS[matchKey], content: [], title: line.replace(matchKey, '').replace(/^[\s#]+/, '').trim() };
    } else if (current) {
      current.content.push(line);
    }
  }
  if (current) sections.push(current);
  return sections;
};

const AnalysisSection = ({ section }) => (
  <div className="ts-card p-5 rounded-xl" style={{ borderColor: `${section.color}20` }}>
    <div className="flex items-center gap-2 mb-3">
      <div className="w-2 h-2 rounded-full" style={{ background: section.color }} />
      <div className="mono-label" style={{ color: section.color }}>{section.label}</div>
    </div>
    <h4 className="text-white font-semibold text-sm mb-3 font-display">{section.title}</h4>
    <div className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
      {section.content.join('\n').trim()}
    </div>
  </div>
);

export default function ModuleAnalyzer() {
  const [form, setForm] = useState({ module_name: '', description: '', target_users: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [rawResult, setRawResult] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionId] = useState(`analyzer_${Date.now()}`);

  useEffect(() => {
    axios.get(`${API}/analyses`).then(r => setHistory(r.data)).catch(() => {});
  }, []);

  const analyze = async (e) => {
    e.preventDefault();
    if (!form.module_name.trim() || !form.description.trim()) {
      toast.error('Module name and description are required.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(`${API}/analyze/module`, { ...form, session_id: sessionId });
      const parsed = parseAnalysis(res.data.analysis);
      setResult(parsed);
      setRawResult(res.data.analysis);
      setHistory(prev => [{ module_name: form.module_name, description: form.description, analysis: res.data.analysis, created_at: new Date().toISOString() }, ...prev.slice(0, 9)]);
      toast.success('Analysis complete!');
    } catch {
      toast.error('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = (item) => {
    setForm({ module_name: item.module_name, description: item.description, target_users: '' });
    const parsed = parseAnalysis(item.analysis);
    setResult(parsed);
    setRawResult(item.analysis);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#050505] font-body text-white">
      {/* Header */}
      <div className="border-b border-white/8 px-5 py-4 flex items-center justify-between bg-[#050505]/80 backdrop-blur-2xl sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link to="/" data-testid="analyzer-back" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5 text-sm">
            <ArrowLeft size={15} /> Home
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center"><Zap size={12} className="text-black" /></div>
            <span className="font-display font-bold text-white text-sm">Module Analyzer</span>
          </div>
        </div>
        <button onClick={() => setShowHistory(!showHistory)} data-testid="toggle-history"
          className="text-zinc-500 hover:text-white text-sm flex items-center gap-1.5 transition-colors">
          <Clock size={14} /> History ({history.length})
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="mb-8">
          <div className="mono-label mb-2">AI Product Strategist</div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">Module Analyzer</h1>
          <p className="text-zinc-500 mt-2 text-sm max-w-xl">Input a new module idea. TaxSathi AI analyzes product fit, pricing tier, revenue impact, tech implementation, and stickiness score.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-2">
            <div className="ts-card p-6 rounded-xl sticky top-24">
              <div className="mono-label mb-4">Module Input</div>
              <form onSubmit={analyze} className="space-y-4">
                <div>
                  <label className="text-zinc-400 text-xs mb-1.5 block">Module Name *</label>
                  <input data-testid="analyzer-name" type="text" value={form.module_name}
                    onChange={e => setForm(p => ({ ...p, module_name: e.target.value }))}
                    placeholder="e.g. Inventory Manager" required
                    className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1.5 block">What does it do? *</label>
                  <textarea data-testid="analyzer-description" value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe the module: what problem it solves, how it works, what integrations it needs..."
                    rows={5} required
                    className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors resize-none" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1.5 block">Target Users <span className="text-zinc-600">(optional)</span></label>
                  <input data-testid="analyzer-target" type="text" value={form.target_users}
                    onChange={e => setForm(p => ({ ...p, target_users: e.target.value }))}
                    placeholder="e.g. Textile exporters, Diamond wholesalers..."
                    className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors" />
                </div>
                <button type="submit" data-testid="analyzer-submit" disabled={loading}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading
                    ? <><Loader size={14} className="animate-spin" /> Analyzing with Gemini...</>
                    : <><Zap size={14} /> Run Analysis</>}
                </button>
              </form>

              {/* Example presets */}
              <div className="mt-5 pt-5 border-t border-white/8">
                <div className="mono-label mb-3">Quick Examples</div>
                <div className="space-y-2">
                  {[
                    { name: 'Inventory Manager', desc: 'Track stock levels, auto-reorder alerts, GST-compliant inventory valuation for textile traders' },
                    { name: 'Multi-Branch Support', desc: 'Single dashboard for businesses with multiple shops/branches, consolidated GST filing' },
                    { name: 'EMI Loan Tracker', desc: 'Track business loans and EMIs, integrate with bank statements, alert on due dates' },
                  ].map((ex, i) => (
                    <button key={i} data-testid={`preset-${i}`}
                      onClick={() => setForm({ module_name: ex.name, description: ex.desc, target_users: '' })}
                      className="w-full text-left ts-card px-3 py-2.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-all">
                      <span className="font-semibold text-zinc-300">{ex.name}</span>
                      <div className="text-zinc-600 mt-0.5 line-clamp-1">{ex.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Output Panel */}
          <div className="lg:col-span-3">
            {!result && !loading && (
              <div className="ts-card rounded-xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-14 h-14 bg-white/4 border border-white/8 rounded-2xl flex items-center justify-center mb-4">
                  <Zap size={22} className="text-zinc-500" />
                </div>
                <div className="text-white font-semibold mb-2 font-display">Analysis will appear here</div>
                <p className="text-zinc-500 text-sm max-w-sm">Enter a module idea on the left and click Run Analysis. Gemini 2.5 Flash will evaluate it across 5 dimensions.</p>
              </div>
            )}

            {loading && (
              <div className="ts-card rounded-xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                <Loader size={28} className="text-zinc-500 animate-spin mb-4" />
                <div className="text-white font-semibold mb-2 font-display">Analyzing "{form.module_name}"</div>
                <p className="text-zinc-500 text-sm">Gemini 2.5 Flash is evaluating product fit, revenue impact, and technical feasibility...</p>
              </div>
            )}

            {result && result.length > 0 && (
              <div className="space-y-4" data-testid="analysis-result">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-white font-bold font-display text-lg">{form.module_name}</h3>
                    <div className="mono-label mt-0.5">Analysis Complete — 5 Dimensions</div>
                  </div>
                  <button onClick={() => { setResult(null); setRawResult(''); }} className="text-zinc-500 hover:text-white text-xs transition-colors">Clear</button>
                </div>
                {result.map((section, i) => <AnalysisSection key={i} section={section} />)}
                {result.length === 0 && rawResult && (
                  <div className="ts-card p-6 rounded-xl">
                    <div className="mono-label mb-3">Full Analysis</div>
                    <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-mono-code">{rawResult}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* History Panel */}
        {showHistory && history.length > 0 && (
          <div className="mt-8 ts-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="mono-label">Past Analyses ({history.length})</div>
              <button onClick={() => setShowHistory(false)} className="text-zinc-500 hover:text-white text-xs"><Trash2 size={12} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {history.map((item, i) => (
                <button key={i} data-testid={`history-item-${i}`} onClick={() => loadHistory(item)}
                  className="text-left ts-card rounded-lg p-4 hover:border-white/20 transition-all">
                  <div className="text-white text-sm font-semibold font-display mb-1">{item.module_name}</div>
                  <div className="text-zinc-500 text-xs line-clamp-2">{item.description}</div>
                  <div className="mono-label mt-2">{new Date(item.created_at).toLocaleDateString('en-IN')}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
