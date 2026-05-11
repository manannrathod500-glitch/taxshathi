import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import GSTAssistant from "./GSTAssistant";

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [clients, setClients] = useState([]);
  const [queryCount, setQueryCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const slug = profile?.ca_slug || user?.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") || "ca";
  const shareLink = `https://taxsathi.online/ca/${slug}`;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));

    supabase
      .from("client_queries")
      .select("id, client_name, client_phone, query_summary, created_at")
      .eq("ca_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setClients(data || []));

    supabase
      .from("client_queries")
      .select("id", { count: "exact" })
      .eq("ca_id", user.id)
      .gte("created_at", new Date(Date.now() - 86400000).toISOString())
      .then(({ count }) => setQueryCount(count || 0));
  }, [user]);

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendWhatsApp = () => {
    const msg = encodeURIComponent(
      `Namaste! 🙏 Hu CA ${profile?.full_name || ""} no GST AI Assistant share karu chu.\n\nAa link kholsho to Gujarati, Hindi, English ma tamara GST/ITR na sawalo na jawab malse — 24/7, FREE!\n\n👉 ${shareLink}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const downloadQR = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareLink)}`;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = "taxsathi-qr.png";
    a.target = "_blank";
    a.click();
  };

  const initials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#fff", fontFamily: "sans-serif" }}>
      {/* Top Bar */}
      <div style={{ background: "#0a0a0a", borderBottom: "0.5px solid #1a1a1a", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>TaxSathi AI</div>
          <div style={{ fontSize: 11, color: "#22c55e" }}>CA Dashboard</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{profile?.full_name || user?.email}</div>
            <div style={{ fontSize: 11, color: "#666" }}>Rajkot, Gujarat</div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1a3a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#22c55e" }}>
            {initials(profile?.full_name || user?.email)}
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div style={{ display: "flex", background: "#0a0a0a", borderBottom: "0.5px solid #1a1a1a" }}>
        {["overview", "clients", "share", "plan"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ flex: 1, padding: "12px 4px", background: "transparent", border: "none", borderBottom: activeTab === tab ? "2px solid #22c55e" : "2px solid transparent", color: activeTab === tab ? "#22c55e" : "#555", fontSize: 12, cursor: "pointer", textTransform: "capitalize", fontWeight: activeTab === tab ? 600 : 400 }}
          >
            {tab === "share" ? "Share Tool" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px" }}>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Total clients</div>
                <div style={{ fontSize: 26, fontWeight: 600, color: "#fff" }}>{clients.length}</div>
                <div style={{ fontSize: 10, color: "#22c55e", marginTop: 2 }}>using your AI link</div>
              </div>
              <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>AI queries today</div>
                <div style={{ fontSize: 26, fontWeight: 600, color: "#fff" }}>{queryCount}</div>
                <div style={{ fontSize: 10, color: "#22c55e", marginTop: 2 }}>~{Math.round(queryCount * 3)} min saved</div>
              </div>
            </div>

            {/* Share Card Summary */}
            <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Your client link</div>
              <div style={{ background: "#050505", border: "0.5px solid #333", borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "#22c55e", fontFamily: "monospace" }}>{shareLink}</span>
                <button onClick={copyLink} style={{ fontSize: 11, background: "#22c55e", color: "#000", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <button onClick={sendWhatsApp} style={{ width: "100%", background: "#22c55e", color: "#000", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                📤 Send to clients on WhatsApp
              </button>
            </div>

            {/* Recent Activity */}
            <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Recent client activity</div>
              {clients.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#444", fontSize: 13 }}>
                  No clients yet. Share your link to get started!
                </div>
              ) : (
                clients.slice(0, 5).map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < 4 ? "0.5px solid #1a1a1a" : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a3a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#22c55e", flexShrink: 0 }}>
                      {initials(c.client_name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{c.client_name || "Anonymous"}</div>
                      <div style={{ fontSize: 11, color: "#666" }}>{c.query_summary || "GST query"} · {timeAgo(c.created_at)}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "#0d2a0d", color: "#22c55e", fontWeight: 500 }}>Active</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* CLIENTS TAB */}
        {activeTab === "clients" && (
          <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>All clients</div>
            {clients.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#444", fontSize: 13 }}>
                No clients yet.<br />
                <span style={{ color: "#22c55e", cursor: "pointer" }} onClick={() => setActiveTab("share")}>Share your link →</span>
              </div>
            ) : (
              clients.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: i < clients.length - 1 ? "0.5px solid #1a1a1a" : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1a3a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#22c55e", flexShrink: 0 }}>
                    {initials(c.client_name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{c.client_name || "Anonymous"}</div>
                    <div style={{ fontSize: 11, color: "#666" }}>{c.client_phone || "No phone"}</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{c.query_summary}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#555" }}>{timeAgo(c.created_at)}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SHARE TOOL TAB */}
        {activeTab === "share" && (
          <>
            <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>Your unique client link</div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>Share this with any client. They open it and chat directly — no login needed.</div>
              <div style={{ background: "#050505", border: "0.5px solid #333", borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "#22c55e", fontFamily: "monospace" }}>{shareLink}</span>
                <button onClick={copyLink} style={{ fontSize: 11, background: "#22c55e", color: "#000", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontWeight: 600 }}>
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
              <button onClick={sendWhatsApp} style={{ width: "100%", background: "#22c55e", color: "#000", border: "none", borderRadius: 8, padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 8 }}>
                📤 Send on WhatsApp
              </button>
            </div>

            <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>QR Code</div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 14 }}>Print this and paste it in your office. Clients scan → land on your GST assistant instantly.</div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareLink)}&color=22c55e&bgcolor=050505`}
                  alt="QR Code"
                  style={{ width: 160, height: 160, borderRadius: 10, border: "2px solid #22c55e" }}
                />
              </div>
              <button onClick={downloadQR} style={{ width: "100%", background: "transparent", color: "#22c55e", border: "1px solid #22c55e", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                ⬇ Download QR Code
              </button>
            </div>

            <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 12 }}>How to use</div>
              {[
                ["1", "Copy your link or download QR code"],
                ["2", "Send link on WhatsApp to your clients"],
                ["3", "Print QR code, keep it in your office"],
                ["4", "Client opens link → chats in Gujarati/Hindi/English"],
                ["5", "You see all their questions in Clients tab"],
              ].map(([num, text]) => (
                <div key={num} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#1a3a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#22c55e", flexShrink: 0 }}>{num}</div>
                  <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.5, paddingTop: 3 }}>{text}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* AI CHAT TAB - kept for CA's own use */}
        {activeTab === "plan" && (
          <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Your subscription</div>
            {[
              ["Plan", "Free Trial"],
              ["Client limit", "Up to 5 clients"],
              ["AI queries/day", "50"],
              ["Trial ends", "May 24, 2026"],
              ["Status", "✅ Active"],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "0.5px solid #1a1a1a" }}>
                <span style={{ fontSize: 12, color: "#666" }}>{label}</span>
                <span style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>{val}</span>
              </div>
            ))}
            <button style={{ width: "100%", background: "transparent", color: "#22c55e", border: "1px solid #22c55e", borderRadius: 8, padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 16 }}>
              Upgrade to Pro — ₹999/month
            </button>
            <div style={{ fontSize: 11, color: "#444", textAlign: "center", marginTop: 8 }}>Unlimited clients · Priority support · CA branding</div>
          </div>
        )}

      </div>
    </div>
  );
}
