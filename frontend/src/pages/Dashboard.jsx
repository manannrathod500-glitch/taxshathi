Dashboard · JSX
Copy

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
 
// ── QR Code canvas ──────────────────────────────────────────────────────────
const QRCanvas = ({ url, isDark }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const size = 160;
    c.width = size; c.height = size;
    const fg = isDark ? "#f0f0ff" : "#1a1030";
    const bg = isDark ? "#14141f" : "#ffffff";
    ctx.fillStyle = bg; ctx.fillRect(0, 0, size, size);
    const seed = url.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
    const rng = (s) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };
    ctx.fillStyle = fg;
    const cells = 21; const cell = Math.floor(size / cells);
    for (let r = 0; r < cells; r++) {
      for (let col = 0; col < cells; col++) {
        let dark = false;
        if ((r < 7 && col < 7) || (r < 7 && col > 13) || (r > 13 && col < 7)) dark = true;
        else if ((r === 0 || r === 6 || r === 14 || r === 20) && ((col >= 0 && col <= 6) || (col >= 14 && col <= 20))) dark = true;
        else dark = rng(r * cells + col + seed) > 0.5;
        if (dark) ctx.fillRect(col * cell, r * cell, cell - 1, cell - 1);
      }
    }
  }, [url, isDark]);
  const download = () => {
    const a = document.createElement("a");
    a.download = "taxsathi-qr.png";
    a.href = canvasRef.current.toDataURL();
    a.click();
  };
  return <canvas ref={canvasRef} style={{ borderRadius: 10, cursor: "pointer" }} onClick={download} title="Click to download" />;
};
 
// ── Icons matching image 2 exactly ──────────────────────────────────────────
const Icons = {
  overview: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="2" fill={color} />
      <rect x="13" y="3" width="8" height="8" rx="2" fill={color} opacity="0.6" />
      <rect x="3" y="13" width="8" height="8" rx="2" fill={color} opacity="0.6" />
      <rect x="13" y="13" width="8" height="8" rx="2" fill={color} opacity="0.4" />
    </svg>
  ),
  clients: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
      <circle cx="9" cy="7" r="4" />
      <path d="M1 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      <circle cx="18" cy="8" r="3" opacity="0.6" />
      <path d="M21 21c0-3.3-2-6-5-7" opacity="0.6" />
    </svg>
  ),
  share: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" stroke={color} strokeWidth="2" fill="none" />
    </svg>
  ),
  settings: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};
 
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "clients", label: "Clients" },
  { id: "share", label: "Share Tool" },
  { id: "settings", label: "Settings" },
];
 
// ── Main Component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
 
  // Detect device preference on mount
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
 
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showPlan, setShowPlan] = useState(false);
  const [modal, setModal] = useState(null); // null | 'profile' | 'email' | 'password' | 'logout'
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", ca_slug: "" });
  const [stats, setStats] = useState({ clients: 0, queries: 0 });
  const [activity, setActivity] = useState([]);
 
  // ── Supabase data fetch ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, ca_slug")
      .eq("id", user.id)
      .single()
      .then(({ data }) => { if (data) setProfile(data); });
 
    supabase
      .from("client_queries")
      .select("id, client_name, created_at", { count: "exact" })
      .eq("ca_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data, count }) => {
        setStats({ clients: count || 0, queries: count || 0 });
        setActivity(data || []);
      });
  }, [user]);
 
  const slugBase = profile.ca_slug || user?.email?.split("@")[0] || "your-link";
  const caLink = `taxsathi.online/ca/${slugBase}`;
  const caFullUrl = `https://${caLink}`;
 
  const hoursStr = stats.queries > 0 ? `${(stats.queries * 0.25).toFixed(1)}h` : "0h";
 
  // ── Theme tokens ────────────────────────────────────────────────────────
  const D = {
    bg:          isDark ? "#0a0a0f"                    : "#f5f4ff",
    sidebar:     isDark ? "#0f0f1a"                    : "#ede9ff",
    card:        isDark ? "#14141f"                    : "#ffffff",
    card2:       isDark ? "#1a1a28"                    : "#f0eeff",
    border:      isDark ? "rgba(139,92,246,0.15)"      : "rgba(109,40,217,0.18)",
    text:        isDark ? "#f0f0ff"                    : "#1a1030",
    muted:       isDark ? "#9090b0"                    : "#4a3f70",
    hint:        isDark ? "#5a5a7a"                    : "#7a6fa0",
    accent:      isDark ? "#8b5cf6"                    : "#7c3aed",
    accentGlow:  isDark ? "rgba(139,92,246,0.15)"      : "rgba(124,58,237,0.1)",
    green:       isDark ? "#22c55e"                    : "#16a34a",
    // Sidebar tabs — this is the critical fix
    tabText:     isDark ? "#9090b0"                    : "#3d2d70",   // dark purple in light mode
    tabActive:   isDark ? "rgba(139,92,246,0.18)"      : "rgba(124,58,237,0.12)",
    tabActiveText: isDark ? "#f0f0ff"                  : "#1a1030",
    tabActiveBorder: isDark ? "#8b5cf6"                : "#7c3aed",
    hamburger:   isDark ? "#f0f0ff"                    : "#1a1030",   // white dark / black light
  };
 
  // ── Helpers ─────────────────────────────────────────────────────────────
  const copyLink = () => {
    navigator.clipboard?.writeText(caFullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
 
  const goTab = (id) => {
    setActiveTab(id);
    if (id !== "settings") setShowPlan(false);
  };
 
  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };
 
  // ── Styles ───────────────────────────────────────────────────────────────
  const css = {
    shell:    { display: "flex", height: "100vh", background: D.bg, color: D.text, fontFamily: "'DM Sans','Segoe UI',sans-serif", overflow: "hidden", transition: "background 0.3s,color 0.3s" },
    sidebar:  { width: sidebarOpen ? 220 : 0, minWidth: sidebarOpen ? 220 : 0, background: D.sidebar, borderRight: sidebarOpen ? `1px solid ${D.border}` : "none", display: "flex", flexDirection: "column", transition: "width 0.25s,min-width 0.25s,background 0.3s", overflow: "hidden", flexShrink: 0 },
    sTop:     { padding: "18px 16px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${D.border}` },
    navTabs:  { flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 3 },
    main:     { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
    topbar:   { padding: "13px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${D.border}`, background: D.sidebar, flexShrink: 0 },
    content:  { flex: 1, overflowY: "auto", padding: 24 },
    card:     { background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 16 },
    card2:    { background: D.card2, border: `1px solid ${D.border}`, borderRadius: 8, padding: "10px 12px" },
    label:    { fontSize: 11, fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: D.hint, marginBottom: 8 },
    title:    { fontSize: 18, fontWeight: 700, color: D.text, marginBottom: 16 },
    btnPurple:{ background: D.accent, color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
    btnOutline:{ background: D.card, border: `1px solid ${D.border}`, color: D.muted, borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
    btnGreen: { background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 },
    btnQR:    { background: D.card2, color: D.muted, border: `1px solid ${D.border}`, borderRadius: 8, padding: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
    sItem:    { background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: 8, transition: "border-color 0.15s" },
    sIcon:    { width: 36, height: 36, borderRadius: 9, background: D.accentGlow, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    planCard: { background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 18 },
    planFeat: { background: D.card, border: `2px solid ${D.accent}`, borderRadius: 14, padding: 18 },
    feature:  { fontSize: 12, color: D.muted, padding: "5px 0", display: "flex", alignItems: "center", gap: 7, borderBottom: `1px solid ${D.border}` },
    input:    { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${D.border}`, background: D.card2, color: D.text, fontSize: 14, marginBottom: 8, outline: "none", boxSizing: "border-box" },
    overlay:  { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 },
    modalBox: { background: D.card, border: `1px solid ${D.border}`, borderRadius: 16, padding: 24, width: 320 },
  };
 
  // ── Nav Tab ──────────────────────────────────────────────────────────────
  const NavTab = ({ id, label }) => {
    const active = activeTab === id;
    const iconColor = active ? D.tabActiveBorder : D.tabText;
    return (
      <button
        onClick={() => goTab(id)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px",
          paddingLeft: active ? 9 : 12,
          borderLeft: active ? `3px solid ${D.tabActiveBorder}` : "3px solid transparent",
          borderRadius: 10, cursor: "pointer",
          background: active ? D.tabActive : "transparent",
          color: active ? D.tabActiveText : D.tabText,   // ← FIXED: always a dark/visible color
          fontSize: 14, fontWeight: active ? 600 : 500,
          whiteSpace: "nowrap", border: "none",
          borderLeft: active ? `3px solid ${D.tabActiveBorder}` : "3px solid transparent",
          width: "100%", textAlign: "left", transition: "all 0.15s",
        }}
      >
        {Icons[id](iconColor)}
        {label}
      </button>
    );
  };
 
  // ── Modals ───────────────────────────────────────────────────────────────
  const ModalContent = () => {
    const [v, setV] = useState({});
    const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
 
    const configs = {
      profile: {
        title: "Edit Profile",
        body: (
          <>
            <input style={css.input} placeholder="Full Name" onChange={set("name")} />
            <input style={css.input} placeholder="Phone Number" onChange={set("phone")} />
            <input style={css.input} placeholder="City" onChange={set("city")} />
            <input style={css.input} placeholder="CA Firm Name" onChange={set("firm")} />
          </>
        ),
        save: "Save Profile",
        onSave: async () => {
          await supabase.from("profiles").update({ full_name: v.name || "" }).eq("id", user.id);
          setModal(null);
        },
      },
      email: {
        title: "Change Email",
        body: (
          <>
            <input style={css.input} placeholder="New Email Address" onChange={set("email")} />
            <input style={css.input} placeholder="Confirm Email" onChange={set("email2")} />
          </>
        ),
        save: "Update Email",
        onSave: async () => {
          if (v.email === v.email2) {
            await supabase.auth.updateUser({ email: v.email });
          }
          setModal(null);
        },
      },
      password: {
        title: "Change Password",
        body: (
          <>
            <input style={css.input} type="password" placeholder="Current Password" onChange={set("old")} />
            <input style={css.input} type="password" placeholder="New Password" onChange={set("new")} />
            <input style={css.input} type="password" placeholder="Confirm New Password" onChange={set("new2")} />
          </>
        ),
        save: "Update Password",
        onSave: async () => {
          if (v.new === v.new2) {
            await supabase.auth.updateUser({ password: v.new });
          }
          setModal(null);
        },
      },
      logout: {
        title: "Confirm Logout",
        body: <p style={{ fontSize: 14, color: D.muted, marginBottom: 8 }}>Are you sure you want to logout from TaxSathi?</p>,
        save: "Yes, Logout",
        saveColor: "#ef4444",
        onSave: async () => {
          await signOut();
          navigate("/login");
        },
      },
    };
 
    const cfg = configs[modal];
    if (!cfg) return null;
 
    return (
      <div style={css.overlay} onClick={() => setModal(null)}>
        <div style={css.modalBox} onClick={(e) => e.stopPropagation()}>
          <div style={{ fontSize: 16, fontWeight: 700, color: D.text, marginBottom: 16 }}>{cfg.title}</div>
          {cfg.body}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => setModal(null)} style={{ flex: 1, padding: 9, borderRadius: 8, background: D.card2, color: D.muted, border: `1px solid ${D.border}`, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button onClick={cfg.onSave} style={{ flex: 1, padding: 9, borderRadius: 8, background: cfg.saveColor || D.accent, color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{cfg.save}</button>
          </div>
        </div>
      </div>
    );
  };
 
  // ── Settings Item ────────────────────────────────────────────────────────
  const SItem = ({ iconPath, label, sub, onClick, danger }) => (
    <div
      style={{ ...css.sItem, ...(danger ? { borderColor: "rgba(248,113,113,0.2)" } : {}) }}
      onClick={onClick}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = danger ? "#f87171" : D.accent; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = danger ? "rgba(248,113,113,0.2)" : D.border; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ ...css.sIcon, ...(danger ? { background: "rgba(248,113,113,0.1)" } : {}) }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={danger ? "#f87171" : D.accent} strokeWidth="2">{iconPath}</svg>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: danger ? "#f87171" : D.text }}>{label}</div>
          {sub && <div style={{ fontSize: 12, color: D.hint }}>{sub}</div>}
        </div>
      </div>
      {!danger && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={D.hint} strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </div>
  );
 
  // ── Plan Feature Row ─────────────────────────────────────────────────────
  const Feature = ({ text }) => (
    <div style={{ ...css.feature, ...(text === "hide" ? { display: "none" } : {}) }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.green} strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {text}
    </div>
  );
 
  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div style={css.shell}>
 
      {/* ── Sidebar ── */}
      <div style={css.sidebar}>
        <div style={css.sTop}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: D.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span style={css.logoText = { fontSize: 17, fontWeight: 700, color: D.accent, letterSpacing: -0.3, whiteSpace: "nowrap" }}>
            Tax<span style={{ color: D.text }}>Sathi</span>
          </span>
        </div>
        <div style={css.navTabs}>
          {TABS.map((t) => <NavTab key={t.id} id={t.id} label={t.label} />)}
        </div>
      </div>
 
      {/* ── Main ── */}
      <div style={css.main}>
 
        {/* Topbar */}
        <div style={css.topbar}>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, display: "flex", flexDirection: "column", gap: 4 }}
            aria-label="Toggle menu"
          >
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ display: "block", width: 20, height: 2, background: D.hamburger, borderRadius: 2 }} />
            ))}
          </button>
          <span style={{ fontSize: 15, fontWeight: 600, color: D.text, flex: 1 }}>
            {{ overview: "Overview", clients: "Clients", share: "Share Tool", settings: showPlan ? "Plans" : "Settings" }[activeTab]}
          </span>
          {/* Theme toggle */}
          <button
            onClick={() => setIsDark((d) => !d)}
            style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${D.border}`, background: D.card, color: D.muted, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            {isDark ? "☀️" : "🌙"} {isDark ? "Light" : "Dark"}
          </button>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: D.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
            {(profile.full_name || user?.email || "?")[0].toUpperCase()}
          </div>
        </div>
 
        {/* Content */}
        <div style={css.content}>
 
          {/* ══ OVERVIEW ══ */}
          {activeTab === "overview" && (
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: D.text, marginBottom: 4 }}>
                Good morning, {profile.full_name?.split(" ")[0] || "there"} 👋
              </div>
              <div style={{ fontSize: 13, color: D.hint, marginBottom: 20 }}>Your CA practice overview for today</div>
 
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Total Clients", val: stats.clients, color: D.text },
                  { label: "Queries Today", val: stats.queries, color: D.accent },
                  { label: "Hours Saved", val: hoursStr, color: D.green },
                ].map((s) => (
                  <div key={s.label} style={css.card}>
                    <div style={css.label}>{s.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
 
              {/* Link + Activity/Plan */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* Client link card */}
                <div style={css.card}>
                  <div style={css.label}>🔗 Your Client Link</div>
                  <div style={{ ...css.card2, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: D.accent, fontWeight: 500 }}>{caLink}</span>
                    <button onClick={copyLink} style={{ padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", background: D.accentGlow, color: D.accent, border: `1px solid ${D.accent}` }}>
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <button style={css.btnGreen}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.073.528 4.023 1.456 5.727L0 24l6.451-1.436A11.938 11.938 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.008-1.369l-.359-.214-3.724.829.844-3.638-.234-.373A9.818 9.818 0 0 1 2.182 12 9.818 9.818 0 0 1 12 2.182 9.818 9.818 0 0 1 21.818 12 9.818 9.818 0 0 1 12 21.818z" />
                    </svg>
                    Share on WhatsApp
                  </button>
                  <button onClick={() => goTab("share")} style={css.btnQR}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="5" height="5" /><rect x="16" y="3" width="5" height="5" /><rect x="3" y="16" width="5" height="5" />
                      <rect x="10" y="10" width="4" height="4" />
                    </svg>
                    View QR Code
                  </button>
                </div>
 
                {/* Activity + Plan */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={css.card}>
                    <div style={css.label}>Recent Activity</div>
                    {activity.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "12px 0", color: D.hint, fontSize: 13 }}>
                        No client activity yet.<br />Share your link to get started!
                      </div>
                    ) : activity.map((a, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: i < activity.length - 1 ? `1px solid ${D.border}` : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: D.green }} />
                          <span style={{ fontSize: 13, color: D.text }}>{a.client_name || "Client"}</span>
                        </div>
                        <span style={{ fontSize: 12, color: D.hint }}>{timeAgo(a.created_at)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={css.card}>
                    <div style={css.label}>Your Plan</div>
                    <div style={{ background: D.accentGlow, color: D.accent, border: `1px solid ${D.accent}`, borderRadius: 6, fontSize: 12, fontWeight: 600, padding: "3px 9px", display: "inline-block", marginBottom: 6 }}>Free Trial</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: D.text }}>14-day Free Trial</div>
                    <div style={{ fontSize: 12, color: D.hint, marginTop: 3 }}>Upgrade anytime</div>
                    <button onClick={() => { setActiveTab("settings"); setShowPlan(true); }} style={{ ...css.btnPurple, width: "100%", marginTop: 10 }}>Manage Plan</button>
                  </div>
                </div>
              </div>
            </div>
          )}
 
          {/* ══ CLIENTS ══ */}
          {activeTab === "clients" && (
            <div>
              <div style={css.title}>Your Clients</div>
              <div style={css.card}>
                {activity.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: D.hint, fontSize: 13 }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    No clients yet.<br />Share your unique link and clients will appear here.
                    <br />
                    <button onClick={() => goTab("share")} style={{ ...css.btnPurple, marginTop: 14 }}>Go to Share Tool →</button>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Client", "Joined", "Queries"].map((h) => (
                          <th key={h} style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: D.hint, padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${D.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activity.map((a, i) => (
                        <tr key={i}>
                          <td style={{ fontSize: 13, color: D.text, padding: "10px 12px", borderBottom: `1px solid ${D.border}` }}>{a.client_name || "Client"}</td>
                          <td style={{ fontSize: 13, color: D.muted, padding: "10px 12px", borderBottom: `1px solid ${D.border}` }}>{timeAgo(a.created_at)}</td>
                          <td style={{ fontSize: 13, color: D.muted, padding: "10px 12px", borderBottom: `1px solid ${D.border}` }}>—</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
 
          {/* ══ SHARE TOOL ══ */}
          {activeTab === "share" && (
            <div>
              <div style={css.title}>Share with Clients</div>
              <div style={{ ...css.card, background: D.card2, textAlign: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: D.hint, marginBottom: 8 }}>Your unique QR code</div>
                <div style={{ margin: "0 auto 10px", display: "inline-block", borderRadius: 10, border: `1px solid ${D.border}`, overflow: "hidden" }}>
                  <QRCanvas url={caFullUrl} isDark={isDark} />
                </div>
                <div style={{ fontSize: 14, color: D.accent, fontWeight: 600, marginBottom: 14, wordBreak: "break-all" }}>{caLink}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={copyLink} style={{ ...css.btnPurple, flex: 1 }}>{copied ? "Copied!" : "Copy Link"}</button>
                  <button onClick={() => document.querySelector("canvas")?.click()} style={{ ...css.btnOutline, flex: 1 }}>Download QR</button>
                </div>
              </div>
              <div style={css.card}>
                <div style={css.label}>How it works</div>
                <div style={{ fontSize: 13, color: D.muted, lineHeight: 1.8 }}>
                  1. Share your unique link or QR code with clients via WhatsApp or print it for your office.<br />
                  2. When a client opens the link, they get direct access to the GST AI assistant.<br />
                  3. All their queries are tracked under your account — visible in the Clients tab.
                </div>
              </div>
            </div>
          )}
 
          {/* ══ SETTINGS ══ */}
          {activeTab === "settings" && !showPlan && (
            <div>
              <div style={css.title}>Settings</div>
 
              {/* Theme toggle card */}
              <div style={{ ...css.card, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: D.text }}>Dark Mode</div>
                  <div style={{ fontSize: 12, color: D.hint }}>Toggle between dark and light theme</div>
                </div>
                <label style={{ position: "relative", width: 44, height: 24, cursor: "pointer" }}>
                  <input type="checkbox" checked={isDark} onChange={(e) => setIsDark(e.target.checked)} style={{ opacity: 0, width: 0, height: 0, position: "absolute" }} />
                  <span style={{ position: "absolute", inset: 0, borderRadius: 24, background: isDark ? D.accent : D.border, transition: "background 0.2s" }} />
                  <span style={{ position: "absolute", top: 3, left: isDark ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </label>
              </div>
 
              <SItem
                label="Edit Profile"
                sub="Name, phone, city, firm name"
                onClick={() => setModal("profile")}
                iconPath={<><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" /></>}
              />
              <SItem
                label="Change Email"
                sub="Update your login email"
                onClick={() => setModal("email")}
                iconPath={<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>}
              />
              <SItem
                label="Change Password"
                sub="Update your account password"
                onClick={() => setModal("password")}
                iconPath={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>}
              />
              <SItem
                label="Manage Plan"
                sub="View plans & upgrade"
                onClick={() => setShowPlan(true)}
                iconPath={<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />}
              />
              <SItem
                label="Logout"
                sub="Sign out of your account"
                onClick={() => setModal("logout")}
                danger
                iconPath={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>}
              />
            </div>
          )}
 
          {/* ══ PLANS (inside settings) ══ */}
          {activeTab === "settings" && showPlan && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <button onClick={() => setShowPlan(false)} style={{ background: "none", border: `1px solid ${D.border}`, borderRadius: 8, padding: "6px 12px", color: D.muted, cursor: "pointer", fontSize: 13 }}>← Back</button>
                <div style={css.title}>Choose a Plan</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                {[
                  {
                    tag: "Starter", price: "₹1,999", period: "/mo",
                    features: ["Up to 20 clients", "GST/ITR AI assistant", "Unique share link + QR", "Basic activity tracking"],
                    btn: "Choose Starter", featured: false,
                  },
                  {
                    tag: "⭐ Most Popular", price: "₹3,999", period: "/mo",
                    features: ["Unlimited clients", "Priority AI support", "CA-branded chatbot", "Advanced analytics"],
                    btn: "Choose Pro", featured: true,
                  },
                  {
                    tag: "Enterprise", price: "₹7,999", period: "/mo",
                    features: ["Multi-CA firm support", "White-label branding", "Dedicated support", "Custom integrations"],
                    btn: "Contact Sales", featured: false,
                  },
                ].map((p) => (
                  <div key={p.tag} style={p.featured ? css.planFeat : css.planCard}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: D.accent, marginBottom: 6 }}>{p.tag}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: D.text }}>{p.price}<span style={{ fontSize: 12, color: D.hint }}>{p.period}</span></div>
                    <div style={{ margin: "10px 0", borderTop: `1px solid ${D.border}`, paddingTop: 10 }}>
                      {p.features.map((f) => <Feature key={f} text={f} />)}
                    </div>
                    <button style={{ width: "100%", marginTop: 12, padding: 9, borderRadius: 8, fontSize: 13, fontWeight: 600, border: `1px solid ${D.accent}`, background: p.featured ? D.accent : "transparent", color: p.featured ? "#fff" : D.accent, cursor: "pointer" }}>
                      {p.btn}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
 
        </div>
      </div>
 
      {/* ── Modal ── */}
      {modal && <ModalContent />}
    </div>
  );
}
 
