import React, { useState } from "react";
import { trackFeatureUsed } from "../lib/analytics";

// ── Reconciliation workspace (Phase 1 — UI + mock data only) ─────────────────
// Real GSTR-2B / purchase-register parsing and matching comes in Phase 2.
// Everything below the "Run Reconciliation" button is sample data so the
// layout and flow can be reviewed first.

const STATUS = {
  matched: { label: "Matched", color: "#22c55e", bg: "rgba(34,197,94,0.14)" },
  mismatched: { label: "Mismatched", color: "#eab308", bg: "rgba(234,179,8,0.14)" },
  missing_books: { label: "Missing in Books", color: "#ef4444", bg: "rgba(239,68,68,0.14)" },
  missing_2b: { label: "Missing in GSTR-2B", color: "#ef4444", bg: "rgba(239,68,68,0.14)" },
};

const MOCK_ROWS = [
  { inv: "INV-1021", supplier: "Shree Krishna Traders", gstin: "24ABCDE1234F1Z5", date: "05-07-2026", taxable: 48200, gst: 8676, status: "matched" },
  { inv: "INV-1022", supplier: "Rajkot Hardware Co.", gstin: "24FGHIJ5678K2Z3", date: "07-07-2026", taxable: 21500, gst: 3870, status: "matched" },
  { inv: "INV-1024", supplier: "Om Packaging", gstin: "24KLMNO9012P3Z1", date: "09-07-2026", taxable: 12750, gst: 2295, status: "matched" },
  { inv: "ST-334", supplier: "Saurashtra Transport", gstin: "24PQRST3456U4Z9", date: "11-07-2026", taxable: 9600, gst: 1728, status: "mismatched" },
  { inv: "INV-1027", supplier: "New Bharat Stationers", gstin: "24UVWXY7890Z5Z7", date: "14-07-2026", taxable: 5340, gst: 961, status: "mismatched" },
  { inv: "GJ-778", supplier: "Gokul Dairy Products", gstin: "24ZAQWS1234X6Z2", date: "16-07-2026", taxable: 18400, gst: 3312, status: "missing_books" },
  { inv: "INV-1031", supplier: "Maruti Electricals", gstin: "24BNMKO4567L8Z4", date: "18-07-2026", taxable: 27600, gst: 4968, status: "missing_books" },
  { inv: "PC-009", supplier: "Petty Cash Purchase", gstin: "—", date: "19-07-2026", taxable: 2100, gst: 378, status: "missing_2b" },
];

const inr = (n) => `₹${n.toLocaleString("en-IN")}`;

const UploadZone = ({ D, isDark, label, hint, file, onPick }) => (
  <label
    style={{
      flex: "1 1 240px",
      background: D.card,
      border: `1.5px dashed ${file ? D.accent : D.border}`,
      borderRadius: 14,
      padding: "22px 20px",
      textAlign: "center",
      cursor: "pointer",
      display: "block",
    }}
  >
    <input
      type="file"
      accept=".csv,.xlsx"
      style={{ display: "none" }}
      onChange={(e) => onPick(e.target.files?.[0] || null)}
    />
    <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
    <div style={{ color: D.text, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{label}</div>
    <div style={{ color: file ? D.accent : D.muted, fontSize: 12 }}>
      {file ? `✓ ${file.name}` : hint}
    </div>
  </label>
);

export default function Reconciliation({ D, isDark, clients = [] }) {
  const [selectedClient, setSelectedClient] = useState("");
  const [gstr2bFile, setGstr2bFile] = useState(null);
  const [booksFile, setBooksFile] = useState(null);
  const [ran, setRan] = useState(false);
  const [running, setRunning] = useState(false);

  const runReconciliation = () => {
    // Phase 1: mock only — simulate a short processing delay, then show sample results
    trackFeatureUsed("reconciliation_run");
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setRan(true);
    }, 700);
  };

  const counts = {
    matched: MOCK_ROWS.filter((r) => r.status === "matched").length,
    mismatched: MOCK_ROWS.filter((r) => r.status === "mismatched").length,
    missing_books: MOCK_ROWS.filter((r) => r.status === "missing_books").length,
    missing_2b: MOCK_ROWS.filter((r) => r.status === "missing_2b").length,
  };
  const itcAvailable = MOCK_ROWS.filter((r) => r.status === "matched").reduce((s, r) => s + r.gst, 0);

  return (
    <div>
      <h2 style={{ color: D.text, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        Reconciliation
      </h2>
      <p style={{ color: D.muted, fontSize: 14, marginBottom: 24 }}>
        Upload a client's GSTR-2B and purchase register to compare ITC.
      </p>

      {/* Client selector */}
      <div
        style={{
          background: D.card,
          border: `1px solid ${D.border}`,
          borderRadius: 14,
          padding: "18px 20px",
          marginBottom: 16,
        }}
      >
        <div style={{ color: D.sub, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
          SELECT CLIENT
        </div>
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: `1px solid ${D.border}`,
            background: isDark ? "#0a0720" : "#ede9ff",
            color: D.text,
            fontSize: 14,
            boxSizing: "border-box",
          }}
        >
          <option value="">Choose a client…</option>
          {clients.map((c) => (
            <option key={`${c.source}-${c.id}`} value={c.id}>
              {c.name}
              {c.gstin ? ` (${c.gstin})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Upload zones */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <UploadZone
          D={D}
          isDark={isDark}
          label="GSTR-2B"
          hint="Click to upload .csv or .xlsx"
          file={gstr2bFile}
          onPick={(file) => {
            setGstr2bFile(file);
            if (file) trackFeatureUsed("reconciliation_gstr2b_uploaded");
          }}
        />
        <UploadZone
          D={D}
          isDark={isDark}
          label="Purchase Register"
          hint="Click to upload .csv or .xlsx"
          file={booksFile}
          onPick={(file) => {
            setBooksFile(file);
            if (file) trackFeatureUsed("reconciliation_books_uploaded");
          }}
        />
      </div>

      <button
        onClick={runReconciliation}
        disabled={running}
        style={{
          width: "100%",
          padding: "13px 0",
          borderRadius: 10,
          border: "none",
          background: D.accent,
          color: "#fff",
          fontWeight: 700,
          fontSize: 15,
          cursor: running ? "default" : "pointer",
          opacity: running ? 0.7 : 1,
          marginBottom: 24,
        }}
      >
        {running ? "Running…" : "▶ Run Reconciliation"}
      </button>

      {/* Results (mock) */}
      {ran && (
        <div>
          {/* Summary cards */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            {[
              { label: "Matched", value: counts.matched, status: "matched" },
              { label: "Mismatched", value: counts.mismatched, status: "mismatched" },
              { label: "Missing in Books", value: counts.missing_books, status: "missing_books" },
              { label: "Missing in GSTR-2B", value: counts.missing_2b, status: "missing_2b" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  flex: "1 1 130px",
                  background: D.card,
                  border: `1px solid ${D.border}`,
                  borderRadius: 14,
                  padding: "14px 18px",
                }}
              >
                <div style={{ fontSize: 26, fontWeight: 800, color: STATUS[s.status].color }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: D.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ITC available + export */}
          <div
            style={{
              background: D.card,
              border: `1px solid ${D.border}`,
              borderRadius: 14,
              padding: "16px 20px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ color: D.muted, fontSize: 12, fontWeight: 700 }}>ITC AVAILABLE</div>
              <div style={{ color: "#22c55e", fontSize: 24, fontWeight: 800 }}>{inr(itcAvailable)}</div>
            </div>
            {/* Phase 1: present in UI, wired up in Phase 2 */}
            <button
              onClick={() => {
                trackFeatureUsed("reconciliation_export_clicked");
                alert("Export coming soon — report generation is part of Phase 2.");
              }}
              style={{
                background: "transparent",
                color: D.accent,
                border: `1px solid ${D.accent}`,
                borderRadius: 10,
                padding: "10px 20px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              ⬇️ Export Report
            </button>
          </div>

          {/* Line items */}
          <div
            style={{
              background: D.card,
              border: `1px solid ${D.border}`,
              borderRadius: 14,
              padding: "8px 0",
              overflowX: "auto",
            }}
          >
            {/* header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 1.6fr 1fr 0.9fr 0.9fr 1.3fr",
                gap: 10,
                padding: "10px 18px",
                borderBottom: `1px solid ${D.border}`,
                color: D.muted,
                fontSize: 11,
                fontWeight: 700,
                minWidth: 640,
              }}
            >
              <span>INVOICE</span>
              <span>SUPPLIER</span>
              <span>DATE</span>
              <span>TAXABLE</span>
              <span>GST</span>
              <span>STATUS</span>
            </div>
            {MOCK_ROWS.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 1.6fr 1fr 0.9fr 0.9fr 1.3fr",
                  gap: 10,
                  padding: "12px 18px",
                  borderBottom: i < MOCK_ROWS.length - 1 ? `1px solid ${D.border}` : "none",
                  alignItems: "center",
                  fontSize: 13,
                  minWidth: 640,
                }}
              >
                <span style={{ color: D.text, fontWeight: 600 }}>{r.inv}</span>
                <span style={{ color: D.text }}>{r.supplier}</span>
                <span style={{ color: D.muted }}>{r.date}</span>
                <span style={{ color: D.text }}>{inr(r.taxable)}</span>
                <span style={{ color: D.text }}>{inr(r.gst)}</span>
                <span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: 20,
                      whiteSpace: "nowrap",
                      background: STATUS[r.status].bg,
                      color: STATUS[r.status].color,
                    }}
                  >
                    {STATUS[r.status].label}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
