import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
 
// ── QR Code canvas ─────────────────────────────────────────────────────────────
const QRCanvas = ({ value, size = 180 }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(ref.current, value, {
        width: size,
        margin: 2,
        color: { dark: "#7c3aed", light: "#ffffff" },
      });
    });
  }, [value, size]);
  return <canvas ref={ref} style={{ borderRadius: 12 }} />;
};
 
// ── Theme tokens ───────────────────────────────────────────────────────────────
const dark = {
  bg: "#07050f",
  sidebar: "#0f0a1e",
  card: "#13102a",
  border: "#2a1f4d",
  accent: "#8b5cf6",
  accentDark: "#7c3aed",
  text: "#f0f0ff",
  sub: "#a78bfa",
  muted: "#6b7280",
  tabText: "#f0f0ff",
  tabActive: "#8b5cf6",
  tabActiveBg: "rgba(139,92,246,0.18)",
  tabHover: "rgba(139,92,246,0.10)",
  hamburger: "#f0f0ff",
};
const light = {
  bg: "#f3f0ff",
  sidebar: "#e9e4ff",
  card: "#ffffff",
  border: "#c4b5fd",
  accent: "#7c3aed",
  accentDark: "#6d28d9",
  text: "#1a0a3e",
  sub: "#7c3aed",
  muted: "#6b7280",
  tabText: "#3d2d70",
  tabActive: "#7c3aed",
  tabActiveBg: "rgba(124,58,237,0.15)",
  tabHover: "rgba(124,58,237,0.08)",
  hamburger: "#1a0a3e",
};
 
export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
 
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
 
  const [isDark, setIsDark] = useState(prefersDark);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [modal, setModal] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ clients: 0, queries: 0, hours: 0 });
 
  const D = isDark ? dark : light;
 
  // ── fetch profile & stats ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id);
      const p = data?.[0] || {};
      setProfile(p);
 
      const { count: clientCount } = await supabase
        .from("ca_clients")
        .select("*", { count: "exact", head: true })
        .eq("ca_id", user.id);
 
      const { count: queryCount } = await supabase
        .from("ca_queries")
        .select("*", { count: "exact", head: true })
        .eq("ca_id", user.id);
 
      setStats({
        clients: clientCount || 0,
        queries: queryCount || 0,
        hours: Math.floor((queryCount || 0) * 0.5),
      });
    })();
  }, [user]);
 
  const caSlug = profile?.ca_slug || user?.email?.split("@")[0] || "ca";
  const shareLink = `${window.location.origin}/ca/${caSlug}`;
 
  // ── WhatsApp share ───────────────────────────────────────────────────────────
  const shareOnWhatsApp = () => {
    const msg = encodeURIComponent(
      `🙏 Namaste! Maro naam ${profile?.name || "CA"} che.\n\nTamara GST / ITR sawalo mate aa AI Assistant use karo — Gujarati, Hindi, English ma 24/7 jawab aapo che.\n\n👉 ${shareLink}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };
 
  // ── Logout ────────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    setModal({
      title: "Confirm Logout",
      body: (
        <p style={{ fontSize: 14, color: D.muted, marginBottom: 8 }}>
          Are you sure you want to logout from TaxSathi?
        </p>
      ),
      save: "Yes, Logout",
      saveColor: "#ef4444",
      onSave: () => {
        supabase.auth.signOut().then(() => {
          window.location.href = "/login";
        });
      },
    });
  };
 
  // ── Tabs config ───────────────────────────────────────────────────────────────
  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      id: "clients",
      label: "Clients",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ),
    },
    {
      id: "share",
      label: "Share Tool",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "Settings",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </svg>
      ),
    },
  ];
 
  // ── Plans content ─────────────────────────────────────────────────────────────
  const PlansContent = () => (
    <div>
      <h2 style={{ color: D.text, fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
        Choose Your Plan
      </h2>
      <p style={{ color: D.muted, fontSize: 14, marginBottom: 28 }}>
        Upgrade to serve more clients and unlock premium features.
      </p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          {
            name: "Free Trial",
            price: "₹0",
            period: "14 days",
            clients: "5 clients",
            features: ["Basic AI chatbot", "Share link", "Email support"],
            color: D.muted,
            current: true,
          },
          {
            name: "Starter",
            price: "₹1,999",
            period: "/month",
            clients: "20 clients",
            features: ["Full AI chatbot", "QR code", "WhatsApp sharing", "Priority support"],
            color: D.accent,
            popular: true,
          },
          {
            name: "Pro",
            price: "₹3,999",
            period: "/month",
            clients: "Unlimited clients",
            features: ["Everything in Starter", "CA branding", "Analytics dashboard", "Dedicated support"],
            color: "#f59e0b",
          },
        ].map((plan) => (
          <div
            key={plan.name}
            style={{
              flex: "1 1 220px",
              background: D.card,
              border: `2px solid ${plan.popular ? D.accent : D.border}`,
              borderRadius: 16,
              padding: "24px 20px",
              position: "relative",
            }}
          >
            {plan.popular && (
              <div
                style={{
                  position: "absolute",
                  top: -12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: D.accent,
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 12px",
                  borderRadius: 20,
                  whiteSpace: "nowrap",
                }}
              >
                MOST POPULAR
              </div>
            )}
            <div style={{ color: plan.color, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
              {plan.name}
            </div>
            <div style={{ color: D.text, fontSize: 28, fontWeight: 800 }}>
              {plan.price}
              <span style={{ fontSize: 14, fontWeight: 400, color: D.muted }}>{plan.period}</span>
            </div>
            <div style={{ color: D.sub, fontSize: 13, margin: "8px 0 16px" }}>{plan.clients}</div>
            {plan.features.map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ color: D.accent, fontSize: 16 }}>✓</span>
                <span style={{ color: D.muted, fontSize: 13 }}>{f}</span>
              </div>
            ))}
            <button
              style={{
                marginTop: 16,
                width: "100%",
                padding: "10px 0",
                borderRadius: 10,
                border: "none",
                background: plan.current ? D.border : D.accent,
                color: plan.current ? D.muted : "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: plan.current ? "default" : "pointer",
              }}
            >
              {plan.current ? "Current Plan" : "Upgrade Now"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
 
  // ── Tab content ────────────────────────────────────────────────────────────────
  const renderContent = () => {
    if (activeTab === "overview") {
      return (
        <div>
          <h2 style={{ color: D.text, fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
            Welcome back, {profile?.name || "CA"} 👋
          </h2>
          {/* Stats */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
            {[
              { label: "Total Clients", value: stats.clients, icon: "👥" },
              { label: "Queries Today", value: stats.queries, icon: "💬" },
              { label: "Hours Saved", value: stats.hours, icon: "⏱️" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  flex: "1 1 140px",
                  background: D.card,
                  border: `1px solid ${D.border}`,
                  borderRadius: 14,
                  padding: "18px 20px",
                }}
              >
                <div style={{ fontSize: 24 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: D.accent, margin: "6px 0 2px" }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 13, color: D.muted }}>{s.label}</div>
              </div>
            ))}
          </div>
          {/* Share link */}
          <div
            style={{
              background: D.card,
              border: `1px solid ${D.border}`,
              borderRadius: 14,
              padding: "20px",
              marginBottom: 16,
            }}
          >
            <div style={{ color: D.sub, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              YOUR CLIENT SHARE LINK
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: isDark ? "#0a0720" : "#ede9ff",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 12,
                overflowX: "auto",
              }}
            >
              <span style={{ color: D.accent, fontSize: 13, flexGrow: 1, whiteSpace: "nowrap" }}>
                {shareLink}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareLink);
                  alert("Link copied!");
                }}
                style={{
                  background: D.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                Copy
              </button>
            </div>
            <button
              onClick={shareOnWhatsApp}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 10,
                border: "none",
                background: "#7c3aed",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              📲 Send on WhatsApp
            </button>
          </div>
          {/* Plan status */}
          <div
            style={{
              background: D.card,
              border: `1px solid ${D.border}`,
              borderRadius: 14,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ color: D.text, fontWeight: 600 }}>Free Trial Active</div>
              <div style={{ color: D.muted, fontSize: 13 }}>Upgrade to serve unlimited clients</div>
            </div>
            <button
              onClick={() => setActiveTab("settings")}
              style={{
                background: D.accent,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "8px 16px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Upgrade
            </button>
          </div>
        </div>
      );
    }
 
    if (activeTab === "clients") {
      return (
        <div>
          <h2 style={{ color: D.text, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Client Activity
          </h2>
          <p style={{ color: D.muted, fontSize: 14, marginBottom: 24 }}>
            Clients who used your share link will appear here.
          </p>
          <div
            style={{
              background: D.card,
              border: `1px solid ${D.border}`,
              borderRadius: 14,
              padding: "40px 20px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <div style={{ color: D.text, fontWeight: 600, fontSize: 16, marginBottom: 6 }}>
              No clients yet
            </div>
            <div style={{ color: D.muted, fontSize: 14, marginBottom: 20 }}>
              Share your link with clients to get started
            </div>
            <button
              onClick={() => setActiveTab("share")}
              style={{
                background: D.accent,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 24px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Get Share Link
            </button>
          </div>
        </div>
      );
    }
 
    if (activeTab === "share") {
      return (
        <div>
          <h2 style={{ color: D.text, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Share with Clients
          </h2>
          <p style={{ color: D.muted, fontSize: 14, marginBottom: 24 }}>
            Give clients instant access to the AI GST assistant — no login needed for them.
          </p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {/* Link card */}
            <div
              style={{
                flex: "1 1 280px",
                background: D.card,
                border: `1px solid ${D.border}`,
                borderRadius: 16,
                padding: "24px",
              }}
            >
              <div style={{ color: D.sub, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                🔗 YOUR UNIQUE LINK
              </div>
              <div
                style={{
                  background: isDark ? "#0a0720" : "#ede9ff",
                  borderRadius: 10,
                  padding: "12px 14px",
                  marginBottom: 12,
                  wordBreak: "break-all",
                }}
              >
                <span style={{ color: D.accent, fontSize: 14 }}>{shareLink}</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    alert("Link copied!");
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 10,
                    border: `1px solid ${D.border}`,
                    background: "transparent",
                    color: D.accent,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  📋 Copy Link
                </button>
                <button
                  onClick={shareOnWhatsApp}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 10,
                    border: "none",
                    background: "#7c3aed",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  📲 WhatsApp
                </button>
              </div>
            </div>
            {/* QR card */}
            <div
              style={{
                flex: "1 1 240px",
                background: D.card,
                border: `1px solid ${D.border}`,
                borderRadius: 16,
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ color: D.sub, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                📱 QR CODE — PRINT FOR OFFICE
              </div>
              <div
                style={{
                  background: "#fff",
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <QRCanvas value={shareLink} size={160} />
              </div>
              <button
                onClick={() => {
                  const canvas = document.querySelector("canvas");
                  if (!canvas) return;
                  const a = document.createElement("a");
                  a.download = "taxsathi-qr.png";
                  a.href = canvas.toDataURL();
                  a.click();
                }}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 10,
                  border: `1px solid ${D.border}`,
                  background: "transparent",
                  color: D.accent,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                ⬇️ Download QR
              </button>
            </div>
          </div>
        </div>
      );
    }
 
    if (activeTab === "settings") {
      return (
        <div>
          <h2 style={{ color: D.text, fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
            Settings
          </h2>
 
          {/* Plan banner */}
          <div
            style={{
              background: `linear-gradient(135deg, ${D.accentDark}, #4f46e5)`,
              borderRadius: 14,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ color: "#fff", fontWeight: 700 }}>Free Trial</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                Upgrade to serve more clients
              </div>
            </div>
            <button
              onClick={() =>
                setModal({
                  title: "Upgrade Plan",
                  body: <PlansContent />,
                  save: null,
                })
              }
              style={{
                background: "#fff",
                color: D.accentDark,
                border: "none",
                borderRadius: 10,
                padding: "8px 18px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Manage Plan
            </button>
          </div>
 
          {/* Settings items */}
          {[
            {
              icon: "👤",
              label: "Edit Profile",
              sub: "Name, phone, city, firm name",
              action: () =>
                setModal({
                  title: "Edit Profile",
                  body: (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {["Full Name", "Phone", "City", "Firm Name"].map((f) => (
                        <div key={f}>
                          <div style={{ color: D.muted, fontSize: 12, marginBottom: 4 }}>{f}</div>
                          <input
                            defaultValue={
                              f === "Full Name" ? profile?.name :
                              f === "Phone" ? profile?.phone :
                              f === "City" ? profile?.city :
                              profile?.business_name || ""
                            }
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              borderRadius: 10,
                              border: `1px solid ${D.border}`,
                              background: isDark ? "#0a0720" : "#ede9ff",
                              color: D.text,
                              fontSize: 14,
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ),
                  save: "Save Changes",
                  onSave: () => setModal(null),
                }),
            },
            {
              icon: "✉️",
              label: "Change Email",
              sub: user?.email,
              action: () =>
                setModal({
                  title: "Change Email",
                  body: (
                    <div>
                      <div style={{ color: D.muted, fontSize: 12, marginBottom: 4 }}>New Email</div>
                      <input
                        type="email"
                        placeholder="Enter new email"
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: 10,
                          border: `1px solid ${D.border}`,
                          background: isDark ? "#0a0720" : "#ede9ff",
                          color: D.text,
                          fontSize: 14,
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  ),
                  save: "Update Email",
                  onSave: () => setModal(null),
                }),
            },
            {
              icon: "🔒",
              label: "Change Password",
              sub: "Update your password",
              action: () =>
                setModal({
                  title: "Change Password",
                  body: (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {["Current Password", "New Password", "Confirm Password"].map((f) => (
                        <div key={f}>
                          <div style={{ color: D.muted, fontSize: 12, marginBottom: 4 }}>{f}</div>
                          <input
                            type="password"
                            placeholder={f}
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              borderRadius: 10,
                              border: `1px solid ${D.border}`,
                              background: isDark ? "#0a0720" : "#ede9ff",
                              color: D.text,
                              fontSize: 14,
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ),
                  save: "Update Password",
                  onSave: () => setModal(null),
                }),
            },
            {
              icon: "🌓",
              label: isDark ? "Switch to Light Mode" : "Switch to Dark Mode",
              sub: "Toggle theme",
              action: () => setIsDark(!isDark),
            },
            {
              icon: "🚪",
              label: "Logout",
              sub: "Sign out of TaxSathi",
              action: handleLogout,
              danger: true,
            },
          ].map((item) => (
            <div
              key={item.label}
              onClick={item.action}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: D.card,
                border: `1px solid ${D.border}`,
                borderRadius: 12,
                padding: "14px 18px",
                marginBottom: 10,
                cursor: "pointer",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <div style={{ flexGrow: 1 }}>
                <div style={{ color: item.danger ? "#ef4444" : D.text, fontWeight: 600, fontSize: 14 }}>
                  {item.label}
                </div>
                <div style={{ color: D.muted, fontSize: 12 }}>{item.sub}</div>
              </div>
              <span style={{ color: D.muted }}>›</span>
            </div>
          ))}
        </div>
      );
    }
 
    return null;
  };
 
  // ── Sidebar width ──────────────────────────────────────────────────────────────
  const SW = sidebarOpen ? 220 : 0;
 
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: D.bg,
        fontFamily: "'Segoe UI', sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── Sidebar ── */}
      <div
        style={{
          width: SW,
          minWidth: SW,
          background: D.sidebar,
          borderRight: `1px solid ${D.border}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "width 0.25s ease, min-width 0.25s ease",
        }}
      >
        {/* ── LOGO AREA ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "14px 12px",
            borderBottom: `1px solid ${D.border}`,
            whiteSpace: "nowrap",
            overflow: "hidden",
            minHeight: 64,
          }}
        >
          {/*
            og-image.png is the full horizontal logo (icon + "TAX SATHI AI" text).
            We show it as the primary logo in the sidebar.
            The favicon.png is reserved for the browser tab only (set in public/index.html).
            Sizing: height 36px lets the wide og-image fill the sidebar naturally.
            object-fit: contain keeps correct proportions with no cropping.
            The dark background on og-image.png blends with the sidebar in dark mode.
            In light mode we add a subtle rounded container so it doesn't look floating.
          */}
          <img
            src="/og-image.png"
            alt="TaxSathi AI"
            style={{
              height: 36,
              maxWidth: 188,
              objectFit: "contain",
              objectPosition: "left center",
              borderRadius: isDark ? 0 : 8,
              background: isDark ? "transparent" : "#1a0a3e",
              padding: isDark ? 0 : "4px 8px",
              flexShrink: 0,
            }}
          />
        </div>
 
        {/* Nav tabs */}
        <nav style={{ flex: 1, padding: "12px 8px", overflow: "hidden" }}>
          {tabs.map((t) => (
            <div
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 12px",
                borderRadius: 10,
                marginBottom: 4,
                cursor: "pointer",
                background: activeTab === t.id ? D.tabActiveBg : "transparent",
                color: activeTab === t.id ? D.tabActive : D.tabText,
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: 14,
                whiteSpace: "nowrap",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== t.id)
                  e.currentTarget.style.background = D.tabHover;
              }}
              onMouseLeave={(e) => {
                if (activeTab !== t.id)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                style={{
                  color: activeTab === t.id ? D.tabActive : D.tabText,
                  flexShrink: 0,
                }}
              >
                {t.icon}
              </span>
              {t.label}
            </div>
          ))}
        </nav>
 
        {/* User info */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: `1px solid ${D.border}`,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          <div style={{ color: D.text, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>
            {profile?.name || user?.email}
          </div>
          <div style={{ color: D.muted, fontSize: 11 }}>Free Trial</div>
        </div>
      </div>
 
      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            borderBottom: `1px solid ${D.border}`,
            background: D.sidebar,
            minHeight: 64,
          }}
        >
          {/* Left side: hamburger + logo (shown only when sidebar is collapsed) */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: D.hamburger,
                fontSize: 22,
                lineHeight: 1,
                padding: 4,
                flexShrink: 0,
              }}
            >
              ☰
            </button>
 
            {/*
              When sidebar is collapsed the full logo disappears.
              We show favicon (32px icon) + og-image (text logo) in the topbar
              so the brand is always visible — same pattern as Notion, Linear, Vercel.
            */}
            {!sidebarOpen && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <img
                  src="/favicon.png"
                  alt="TaxSathi"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
                <img
                  src="/og-image.png"
                  alt="TaxSathi AI"
                  style={{
                    height: 28,
                    maxWidth: 130,
                    objectFit: "contain",
                    objectPosition: "left center",
                    borderRadius: isDark ? 0 : 6,
                    background: isDark ? "transparent" : "#1a0a3e",
                    padding: isDark ? 0 : "3px 7px",
                    flexShrink: 0,
                  }}
                />
              </div>
            )}
          </div>
 
          {/* Right side: theme toggle + avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setIsDark(!isDark)}
              style={{
                background: isDark ? "#1e1040" : "#e0d9ff",
                border: "none",
                borderRadius: 20,
                padding: "6px 14px",
                cursor: "pointer",
                color: D.text,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {isDark ? "☀️ Light" : "🌙 Dark"}
            </button>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: D.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {(profile?.name || user?.email || "U")[0].toUpperCase()}
            </div>
          </div>
        </div>
 
        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "28px 24px" }}>
          {renderContent()}
        </div>
      </div>
 
      {/* ── Modal ── */}
      {modal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div
            style={{
              background: D.card,
              border: `1px solid ${D.border}`,
              borderRadius: 18,
              padding: "28px 24px",
              width: "100%",
              maxWidth: 480,
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h3 style={{ color: D.text, fontSize: 18, fontWeight: 700, margin: 0 }}>
                {modal.title}
              </h3>
              <button
                onClick={() => setModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: D.muted,
                  fontSize: 22,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            {modal.body}
            {modal.save && (
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => setModal(null)}
                  style={{
                    flex: 1,
                    padding: "11px 0",
                    borderRadius: 10,
                    border: `1px solid ${D.border}`,
                    background: "transparent",
                    color: D.muted,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={modal.onSave}
                  style={{
                    flex: 1,
                    padding: "11px 0",
                    borderRadius: 10,
                    border: "none",
                    background: modal.saveColor || D.accent,
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {modal.save}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
 
