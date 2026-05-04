import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Sparkles, Loader2, Globe, FileText, Download,
  Plus, Trash2, MessageSquare, Wand2, Receipt, Zap, AlertCircle, RefreshCcw, Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '@/contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ── i18n ──────────────────────────────────────────────────────────────────────
const T = {
  en: {
    code: 'EN',
    title: 'Smart Invoice Engine',
    subtitle: 'Paste a WhatsApp order. AI extracts items, calculates GST, and generates a print-ready GSTIN-compliant invoice.',
    waInput: 'WhatsApp Order Message',
    waPlaceholder: 'e.g.  Hi, please send 100 meters cotton fabric @ ₹250/m and 50m polyester @ ₹180/m to Ramesh Garments, Surat. GSTIN 24AABCR1234M1Z5',
    parseBtn: 'Parse with AI',
    parsing: 'AI parsing your order…',
    sellerInfo: 'Seller (Your Business)',
    buyerInfo: 'Buyer Details',
    items: 'Line Items',
    addItem: 'Add Item',
    sellerName: 'Business Name',
    sellerGSTIN: 'Your GSTIN',
    sellerAddr: 'Address',
    sellerState: 'State',
    buyerName: 'Buyer Name',
    buyerGSTIN: 'Buyer GSTIN (optional)',
    buyerAddr: 'Buyer Address',
    buyerState: 'Buyer State',
    buyerPhone: 'Buyer WhatsApp # (with country code)',
    invNo: 'Invoice #',
    invDate: 'Invoice Date',
    description: 'Item / Description',
    hsn: 'HSN/SAC',
    qty: 'Qty',
    unit: 'Unit',
    rate: 'Rate',
    gstRate: 'GST %',
    amount: 'Amount',
    preview: 'Invoice Preview',
    download: 'Download PDF',
    sendWA: 'Send on WhatsApp',
    needPhone: 'Add buyer WhatsApp number first.',
    waCaption: 'Opens WhatsApp with a pre-filled invoice summary. Download the PDF and attach in chat.',
    regen: 'Re-parse Order',
    notice: 'AI may misread complex messages. Always verify line items, HSN codes, and GSTIN before sending the invoice to your buyer.',
    subtotal: 'Subtotal',
    cgst: 'CGST', sgst: 'SGST', igst: 'IGST', totalTax: 'Total Tax',
    grandTotal: 'Grand Total',
    placeOfSupply: 'Place of Supply',
    intra: 'Intra-state', inter: 'Inter-state',
    poweredBy: 'AI parses unstructured WhatsApp orders into structured invoices. Powered by Gemini 2.5 Flash.',
    nothingParsed: 'Click "Parse with AI" first or fill items manually.',
  },
  hi: {
    code: 'HI',
    title: 'स्मार्ट इनवॉइस इंजन',
    subtitle: 'WhatsApp ऑर्डर पेस्ट करें। AI आइटम निकालता है, GST गणना करता है, और GSTIN-अनुपालित इनवॉइस तैयार करता है।',
    waInput: 'WhatsApp ऑर्डर संदेश',
    waPlaceholder: 'जैसे: 100 मीटर सूती कपड़ा ₹250/मीटर और 50 मीटर पॉलिएस्टर ₹180/मीटर रमेश गारमेंट्स, सूरत को भेजें। GSTIN 24AABCR1234M1Z5',
    parseBtn: 'AI से पार्स करें',
    parsing: 'AI आपका ऑर्डर पार्स कर रहा है…',
    sellerInfo: 'विक्रेता (आपका व्यवसाय)',
    buyerInfo: 'खरीदार विवरण',
    items: 'पंक्ति आइटम',
    addItem: 'आइटम जोड़ें',
    sellerName: 'व्यवसाय का नाम',
    sellerGSTIN: 'आपका GSTIN',
    sellerAddr: 'पता',
    sellerState: 'राज्य',
    buyerName: 'खरीदार का नाम',
    buyerGSTIN: 'खरीदार GSTIN (वैकल्पिक)',
    buyerAddr: 'खरीदार का पता',
    buyerState: 'खरीदार राज्य',
    buyerPhone: 'खरीदार WhatsApp # (देश कोड सहित)',
    invNo: 'इनवॉइस #',
    invDate: 'इनवॉइस तिथि',
    description: 'आइटम / विवरण',
    hsn: 'HSN/SAC',
    qty: 'मात्रा',
    unit: 'इकाई',
    rate: 'दर',
    gstRate: 'GST %',
    amount: 'राशि',
    preview: 'इनवॉइस पूर्वावलोकन',
    download: 'PDF डाउनलोड',
    sendWA: 'WhatsApp पर भेजें',
    needPhone: 'पहले खरीदार का WhatsApp नंबर डालें।',
    waCaption: 'पहले से भरा इनवॉइस सारांश के साथ WhatsApp खुलता है। PDF डाउनलोड कर के चैट में अटैच करें।',
    regen: 'फिर से पार्स करें',
    notice: 'AI जटिल संदेशों को गलत पढ़ सकता है। खरीदार को इनवॉइस भेजने से पहले हमेशा आइटम, HSN कोड और GSTIN सत्यापित करें।',
    subtotal: 'उप-योग',
    cgst: 'CGST', sgst: 'SGST', igst: 'IGST', totalTax: 'कुल कर',
    grandTotal: 'कुल देय',
    placeOfSupply: 'आपूर्ति का स्थान',
    intra: 'अंतर्राज्यीय (समान)', inter: 'अंतरराज्यीय',
    poweredBy: 'AI WhatsApp ऑर्डर को संरचित इनवॉइस में बदलता है। Gemini 2.5 Flash द्वारा संचालित।',
    nothingParsed: 'पहले "AI से पार्स करें" दबाएँ या आइटम मैन्युअल भरें।',
  },
  gu: {
    code: 'GU',
    title: 'સ્માર્ટ ઇન્વૉઇસ એન્જિન',
    subtitle: 'WhatsApp ઓર્ડર પેસ્ટ કરો. AI આઇટમ કાઢે છે, GST ગણે છે, અને GSTIN-અનુપાલિત ઇન્વૉઇસ બનાવે છે.',
    waInput: 'WhatsApp ઓર્ડર સંદેશ',
    waPlaceholder: 'દા.ત. 100 મીટર સૂતી કાપડ ₹250/મીટર અને 50 મીટર પોલિએસ્ટર ₹180/મીટર રમેશ ગાર્મેન્ટ્સ, સુરત ને મોકલો. GSTIN 24AABCR1234M1Z5',
    parseBtn: 'AI થી પાર્સ કરો',
    parsing: 'AI તમારો ઓર્ડર પાર્સ કરી રહ્યું છે…',
    sellerInfo: 'વેચનાર (તમારો વ્યવસાય)',
    buyerInfo: 'ખરીદનાર વિગત',
    items: 'લાઇન આઇટમ્સ',
    addItem: 'આઇટમ ઉમેરો',
    sellerName: 'વ્યવસાય નામ',
    sellerGSTIN: 'તમારો GSTIN',
    sellerAddr: 'સરનામું',
    sellerState: 'રાજ્ય',
    buyerName: 'ખરીદનારનું નામ',
    buyerGSTIN: 'ખરીદનાર GSTIN (વૈકલ્પિક)',
    buyerAddr: 'ખરીદનારનું સરનામું',
    buyerState: 'ખરીદનાર રાજ્ય',
    buyerPhone: 'ખરીદનાર WhatsApp # (દેશ કોડ સાથે)',
    invNo: 'ઇન્વૉઇસ #',
    invDate: 'ઇન્વૉઇસ તારીખ',
    description: 'આઇટમ / વર્ણન',
    hsn: 'HSN/SAC',
    qty: 'જથ્થો',
    unit: 'એકમ',
    rate: 'દર',
    gstRate: 'GST %',
    amount: 'રકમ',
    preview: 'ઇન્વૉઇસ પૂર્વાવલોકન',
    download: 'PDF ડાઉનલોડ',
    sendWA: 'WhatsApp પર મોકલો',
    needPhone: 'પહેલા ખરીદનારનો WhatsApp નંબર ઉમેરો.',
    waCaption: 'ઇન્વૉઇસ સારાંશ સાથે પૂર્વ-ભરેલું WhatsApp ખુલે છે. PDF ડાઉનલોડ કરીને ચેટમાં જોડો.',
    regen: 'ફરી પાર્સ કરો',
    notice: 'AI જટિલ સંદેશા ખોટા વાંચી શકે. ખરીદનારને મોકલતા પહેલા આઇટમ, HSN, GSTIN ચકાસો.',
    subtotal: 'પેટા-કુલ',
    cgst: 'CGST', sgst: 'SGST', igst: 'IGST', totalTax: 'કુલ કર',
    grandTotal: 'કુલ ચૂકવવાપાત્ર',
    placeOfSupply: 'સપ્લાય સ્થાન',
    intra: 'આંતર-રાજ્ય (સમાન)', inter: 'આંતરરાજ્ય',
    poweredBy: 'AI WhatsApp ઓર્ડરને સંરચિત ઇન્વૉઇસમાં બદલે છે. Gemini 2.5 Flash દ્વારા સંચાલિત.',
    nothingParsed: 'પહેલા "AI થી પાર્સ કરો" દબાવો અથવા આઇટમ મેન્યુઅલી ભરો.',
  },
};

const STATES = [
  'Gujarat', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana',
  'Rajasthan', 'Madhya Pradesh', 'Uttar Pradesh', 'West Bengal', 'Punjab',
  'Haryana', 'Andhra Pradesh', 'Kerala', 'Bihar', 'Odisha', 'Jharkhand',
  'Chhattisgarh', 'Assam', 'Goa', 'Uttarakhand', 'Himachal Pradesh',
  'Jammu and Kashmir', 'Other',
];

const RATES = [0, 0.1, 3, 5, 12, 18, 28];

const SAMPLE_ORDER = `Hi bhai, please send:
- 100 meters cotton fabric @ ₹250/m
- 50 meters polyester blend @ ₹180/m

Buyer: Ramesh Garments
GSTIN: 27AABCR1234M1Z5
Phone: +91 98765 43210
Address: 12, MG Road, Mumbai, Maharashtra
Need delivery by next week.`;

const newId = () => Math.random().toString(36).slice(2, 9);
const fmt = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── AI parse (proxied via backend) ────────────────────────────────────────────
async function parseOrderWithAI(message, sellerState) {
  const res = await axios.post(`${API}/ai/parse-order`, {
    message,
    seller_state: sellerState,
  });
  return res.data || {};
}

// ── totals ────────────────────────────────────────────────────────────────────
function computeTotals(items, sellerState, buyerState) {
  const isIntra = (sellerState || '').trim().toLowerCase() === (buyerState || '').trim().toLowerCase() && !!sellerState;
  let subtotal = 0, cgst = 0, sgst = 0, igst = 0;
  const lines = items.map(it => {
    const qty = Number(it.qty) || 0;
    const rate = Number(it.rate) || 0;
    const gst = Number(it.gstRate) || 0;
    const amt = qty * rate;
    const tax = +(amt * gst / 100).toFixed(2);
    const ln = {
      ...it,
      amount: +amt.toFixed(2),
      tax,
      cgst: isIntra ? +(tax / 2).toFixed(2) : 0,
      sgst: isIntra ? +(tax / 2).toFixed(2) : 0,
      igst: isIntra ? 0 : tax,
    };
    subtotal += ln.amount;
    cgst += ln.cgst; sgst += ln.sgst; igst += ln.igst;
    return ln;
  });
  const totalTax = +(cgst + sgst + igst).toFixed(2);
  return {
    isIntra,
    lines,
    subtotal: +subtotal.toFixed(2),
    cgst: +cgst.toFixed(2),
    sgst: +sgst.toFixed(2),
    igst: +igst.toFixed(2),
    totalTax,
    grandTotal: +(subtotal + totalTax).toFixed(2),
  };
}

// ── PDF ───────────────────────────────────────────────────────────────────────
function generatePDF({ seller, buyer, invoice, totals, t }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(5, 5, 5);
  doc.rect(0, 0, W, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', 40, 35);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('GST Compliant · Generated by TaxSathi AI', 40, 52);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.no, W - 40, 35, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.date, W - 40, 52, { align: 'right' });

  // Seller / Buyer
  doc.setTextColor(0, 0, 0);
  let y = 100;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('FROM (SELLER)', 40, y);
  doc.text('BILL TO (BUYER)', W / 2 + 10, y);

  y += 14;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(seller.name || '—', 40, y);
  doc.text(buyer.name || '—', W / 2 + 10, y);

  y += 14;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const splitL = doc.splitTextToSize(seller.address || '', W / 2 - 60);
  const splitR = doc.splitTextToSize(buyer.address || '', W / 2 - 60);
  doc.text(splitL, 40, y);
  doc.text(splitR, W / 2 + 10, y);
  y += Math.max(splitL.length, splitR.length) * 11 + 4;

  doc.setFont('helvetica', 'bold'); doc.text('GSTIN: ', 40, y); doc.text('GSTIN: ', W / 2 + 10, y);
  doc.setFont('helvetica', 'normal');
  doc.text(seller.gstin || '—', 78, y); doc.text(buyer.gstin || '—', W / 2 + 48, y);
  y += 12;
  doc.setFont('helvetica', 'bold'); doc.text('State: ', 40, y); doc.text('State: ', W / 2 + 10, y);
  doc.setFont('helvetica', 'normal');
  doc.text(seller.state || '—', 76, y); doc.text(buyer.state || '—', W / 2 + 46, y);

  // Place of supply
  y += 22;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80, 80, 80);
  doc.text(`${t.placeOfSupply}: ${buyer.state || '—'}  ·  ${totals.isIntra ? t.intra : t.inter}`, 40, y);

  // Items table
  const head = [[t.description, t.hsn, t.qty, t.unit, t.rate, t.gstRate, t.amount]];
  const body = totals.lines.map(l => [
    l.description || '—',
    l.hsn || '—',
    String(l.qty),
    l.unit || '-',
    fmt(l.rate),
    `${l.gstRate}%`,
    fmt(l.amount),
  ]);

  autoTable(doc, {
    startY: y + 14,
    head, body,
    headStyles: { fillColor: [10, 10, 10], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 'auto' }, 4: { halign: 'right' }, 6: { halign: 'right' } },
    theme: 'grid',
    margin: { left: 40, right: 40 },
  });

  // Totals
  let ty = doc.lastAutoTable.finalY + 18;
  const rightX = W - 40;
  const labelX = W - 200;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const row = (label, val, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, labelX, ty);
    doc.text(val, rightX, ty, { align: 'right' });
    ty += 14;
  };
  row(`${t.subtotal}:`, fmt(totals.subtotal));
  if (totals.isIntra) {
    row(`${t.cgst}:`, fmt(totals.cgst));
    row(`${t.sgst}:`, fmt(totals.sgst));
  } else {
    row(`${t.igst}:`, fmt(totals.igst));
  }
  ty += 4;
  doc.setDrawColor(200);
  doc.line(labelX, ty - 8, rightX, ty - 8);
  doc.setFontSize(12);
  row(`${t.grandTotal}:`, fmt(totals.grandTotal), true);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text('This is a computer-generated invoice. Verify all details before sharing.', 40, doc.internal.pageSize.getHeight() - 30);
  doc.text(`Generated ${new Date().toLocaleString('en-IN')}`, W - 40, doc.internal.pageSize.getHeight() - 30, { align: 'right' });

  doc.save(`${(invoice.no || 'INVOICE').replace(/[^\w-]/g, '_')}.pdf`);
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function InvoiceEngine() {
  const [language, setLanguage] = useState('en');
  const [orderText, setOrderText] = useState('');
  const [parsing, setParsing] = useState(false);
  const previewRef = useRef(null);
  const { checkAILimits, incrementAICalls } = useAuth();

  const [seller, setSeller] = useState({
    name: 'TaxSathi Demo Traders',
    gstin: '24AABCT1234E1Z2',
    address: '21, Ring Road, Surat',
    state: 'Gujarat',
  });
  const [buyer, setBuyer] = useState({
    name: '',
    gstin: '',
    address: '',
    state: 'Gujarat',
    phone: '',
  });
  const [invoice, setInvoice] = useState({
    no: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    date: new Date().toISOString().slice(0, 10),
  });
  const [items, setItems] = useState([
    { id: newId(), description: '', hsn: '5208', qty: 1, unit: 'pcs', rate: 0, gstRate: 5 },
  ]);

  const t = T[language];

  const totals = useMemo(
    () => computeTotals(items, seller.state, buyer.state),
    [items, seller.state, buyer.state]
  );

  const updateItem = (id, key, val) =>
    setItems(its => its.map(it => (it.id === id ? { ...it, [key]: val } : it)));

  const addItem = () =>
    setItems(its => [...its, { id: newId(), description: '', hsn: '5208', qty: 1, unit: 'pcs', rate: 0, gstRate: 5 }]);

  const removeItem = (id) => setItems(its => its.filter(it => it.id !== id));

  const handleParse = async () => {
    if (!orderText.trim()) {
      toast.error('Paste an order message first.');
      return;
    }
    setParsing(true);
    try {
      if (!checkAILimits()) {
        toast.error("AI usage limit reached! Please check your dashboard.");
        setParsing(false);
        return;
      }
      
      const parsed = await parseOrderWithAI(orderText, seller.state);
      await incrementAICalls();
      
      if (parsed?.buyer) {
        setBuyer(b => ({
          name: parsed.buyer.name || b.name,
          gstin: parsed.buyer.gstin || b.gstin,
          address: parsed.buyer.address || b.address,
          state: parsed.buyer.state && STATES.includes(parsed.buyer.state) ? parsed.buyer.state : b.state,
          phone: (parsed.buyer.phone || b.phone || '').toString().replace(/[^\d+]/g, ''),
        }));
      }
      if (Array.isArray(parsed?.items) && parsed.items.length > 0) {
        setItems(parsed.items.map(it => ({
          id: newId(),
          description: it.description || '',
          hsn: String(it.hsn || ''),
          qty: Number(it.qty) || 1,
          unit: it.unit || 'pcs',
          rate: Number(it.rate) || 0,
          gstRate: RATES.includes(Number(it.gstRate)) ? Number(it.gstRate) : 5,
        })));
      }
      toast.success(`Parsed ${parsed?.items?.length || 0} item(s)`);
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error(err);
      toast.error('AI parsing failed — fill manually.');
    } finally {
      setParsing(false);
    }
  };

  const handleDownload = () => {
    if (!buyer.name || items.every(i => !i.description)) {
      toast.error(t.nothingParsed);
      return;
    }
    generatePDF({ seller, buyer, invoice, totals, t });
    toast.success('PDF generated');
  };

  const handleSendWhatsApp = () => {
    const phone = (buyer.phone || '').replace(/[^\d]/g, '');
    if (!phone) {
      toast.error(t.needPhone);
      return;
    }
    if (!buyer.name || items.every(i => !i.description)) {
      toast.error(t.nothingParsed);
      return;
    }
    // Build a clean human-readable invoice summary
    const itemLines = totals.lines
      .filter(l => l.description)
      .map((l, i) => `${i + 1}. ${l.description} — ${l.qty} ${l.unit} × ${fmt(l.rate)} = ${fmt(l.amount)} (GST ${l.gstRate}%)`)
      .join('\n');
    const taxLine = totals.isIntra
      ? `CGST: ${fmt(totals.cgst)}\nSGST: ${fmt(totals.sgst)}`
      : `IGST: ${fmt(totals.igst)}`;
    const message =
`*${seller.name || 'TaxSathi'} — Tax Invoice*
Invoice #: ${invoice.no}
Date: ${invoice.date}

*Bill To:* ${buyer.name}
${buyer.address ? buyer.address + '\n' : ''}${buyer.gstin ? 'GSTIN: ' + buyer.gstin : ''}

*Items:*
${itemLines}

Subtotal: ${fmt(totals.subtotal)}
${taxLine}
*Grand Total: ${fmt(totals.grandTotal)}*

Place of supply: ${buyer.state} (${totals.isIntra ? 'Intra-state' : 'Inter-state'})

Generated by TaxSathi AI · taxsathi.ai`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success('Opening WhatsApp…');
  };

  const fillSample = () => setOrderText(SAMPLE_ORDER);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-body">
      {/* HEADER */}
      <header className="border-b border-white/8 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/" data-testid="back-home" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
              <Zap size={14} className="text-black" />
            </div>
            <span className="font-display font-bold text-sm">TaxSathi AI</span>
            <span className="mono-label text-zinc-500 ml-2 hidden sm:inline">/ INVOICE ENGINE</span>
          </div>
          <div data-testid="language-switcher" className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            <Globe size={12} className="text-zinc-500 ml-1.5" />
            {Object.entries(T).map(([code, val]) => (
              <button
                key={code}
                data-testid={`lang-${code}`}
                onClick={() => setLanguage(code)}
                className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                  language === code ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {val.code}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="px-5 pt-12 pb-6 max-w-7xl mx-auto">
        <div className="mono-label mb-3">MODULE 02 · MVP</div>
        <h1 data-testid="page-title" className="text-4xl sm:text-5xl font-bold font-display tracking-tight mb-3">
          {t.title}
        </h1>
        <p className="text-zinc-400 max-w-2xl text-base leading-relaxed">{t.subtitle}</p>
      </section>

      {/* MAIN GRID */}
      <main className="max-w-7xl mx-auto px-5 pb-24 grid lg:grid-cols-2 gap-6">
        {/* LEFT — Inputs */}
        <div className="space-y-5">
          {/* WhatsApp parser */}
          <section className="ts-card p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-[#22c55e]" />
                <h2 className="font-display font-semibold text-base">{t.waInput}</h2>
              </div>
              <button
                data-testid="fill-sample"
                onClick={fillSample}
                className="text-xs text-zinc-500 hover:text-white transition-colors"
              >
                Fill sample
              </button>
            </div>
            <textarea
              data-testid="order-text"
              value={orderText}
              onChange={e => setOrderText(e.target.value)}
              placeholder={t.waPlaceholder}
              rows={6}
              className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-white/30 leading-relaxed font-mono"
            />
            <button
              data-testid="parse-btn"
              onClick={handleParse}
              disabled={parsing}
              className="btn-primary w-full mt-3 py-3 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {parsing ? (
                <><Loader2 size={15} className="animate-spin" /> {t.parsing}</>
              ) : (
                <><Wand2 size={14} /> {t.parseBtn}</>
              )}
            </button>
            <p className="text-zinc-600 text-xs mt-3 leading-relaxed">{t.poweredBy}</p>
          </section>

          {/* Seller */}
          <section className="ts-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Receipt size={15} className="text-[#60a5fa]" />
              <h2 className="font-display font-semibold text-sm">{t.sellerInfo}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field testid="seller-name" label={t.sellerName} value={seller.name} onChange={v => setSeller(s => ({ ...s, name: v }))} span2 />
              <Field testid="seller-gstin" label={t.sellerGSTIN} value={seller.gstin} onChange={v => setSeller(s => ({ ...s, gstin: v.toUpperCase() }))} mono />
              <SelectField testid="seller-state" label={t.sellerState} value={seller.state} options={STATES} onChange={v => setSeller(s => ({ ...s, state: v }))} />
              <Field testid="seller-addr" label={t.sellerAddr} value={seller.address} onChange={v => setSeller(s => ({ ...s, address: v }))} span2 />
            </div>
          </section>

          {/* Buyer */}
          <section className="ts-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Receipt size={15} className="text-[#a78bfa]" />
              <h2 className="font-display font-semibold text-sm">{t.buyerInfo}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field testid="buyer-name" label={t.buyerName} value={buyer.name} onChange={v => setBuyer(b => ({ ...b, name: v }))} span2 />
              <Field testid="buyer-gstin" label={t.buyerGSTIN} value={buyer.gstin} onChange={v => setBuyer(b => ({ ...b, gstin: v.toUpperCase() }))} mono />
              <SelectField testid="buyer-state" label={t.buyerState} value={buyer.state} options={STATES} onChange={v => setBuyer(b => ({ ...b, state: v }))} />
              <Field testid="buyer-phone" label={t.buyerPhone} value={buyer.phone} onChange={v => setBuyer(b => ({ ...b, phone: v.replace(/[^\d+]/g, '') }))} mono span2 />
              <Field testid="buyer-addr" label={t.buyerAddr} value={buyer.address} onChange={v => setBuyer(b => ({ ...b, address: v }))} span2 />
            </div>
          </section>

          {/* Invoice meta */}
          <section className="ts-card p-6">
            <div className="grid grid-cols-2 gap-3">
              <Field testid="inv-no" label={t.invNo} value={invoice.no} onChange={v => setInvoice(i => ({ ...i, no: v }))} mono />
              <Field testid="inv-date" label={t.invDate} value={invoice.date} onChange={v => setInvoice(i => ({ ...i, date: v }))} type="date" />
            </div>
          </section>

          {/* Items */}
          <section className="ts-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-[#f59e0b]" />
                <h2 className="font-display font-semibold text-sm">{t.items}</h2>
                <span className="mono-label text-zinc-500">{items.length}</span>
              </div>
              <button data-testid="add-item-btn" onClick={addItem} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                <Plus size={12} /> {t.addItem}
              </button>
            </div>
            <div className="space-y-3">
              {items.map((it, i) => (
                <div key={it.id} data-testid={`item-row-${i}`} className="rounded-lg border border-white/8 bg-[#050505] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="mono-label text-zinc-500">Item #{i + 1}</span>
                    {items.length > 1 && (
                      <button data-testid={`item-remove-${i}`} onClick={() => removeItem(it.id)} className="text-zinc-500 hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <Field tiny testid={`item-desc-${i}`} label={t.description} value={it.description} onChange={v => updateItem(it.id, 'description', v)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Field tiny testid={`item-hsn-${i}`} label={t.hsn} value={it.hsn} onChange={v => updateItem(it.id, 'hsn', v)} mono />
                    <Field tiny testid={`item-unit-${i}`} label={t.unit} value={it.unit} onChange={v => updateItem(it.id, 'unit', v)} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Field tiny testid={`item-qty-${i}`} label={t.qty} type="number" value={it.qty} onChange={v => updateItem(it.id, 'qty', v)} />
                    <Field tiny testid={`item-rate-${i}`} label={t.rate} type="number" value={it.rate} onChange={v => updateItem(it.id, 'rate', v)} />
                    <SelectField tiny testid={`item-gst-${i}`} label={t.gstRate} value={it.gstRate}
                      options={RATES.map(r => `${r}`)} display={r => `${r}%`}
                      onChange={v => updateItem(it.id, 'gstRate', Number(v))} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT — Preview */}
        <div className="space-y-5">
          <section ref={previewRef} className="ts-card p-0 overflow-hidden">
            {/* Preview header */}
            <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-white/8 bg-[#0a0a0a] sticky top-16 z-10">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-[#a78bfa]" />
                <h2 className="font-display font-semibold text-sm">{t.preview}</h2>
                <span className={`mono-label px-2 py-0.5 rounded-full text-[9px] ${totals.isIntra ? 'badge-live' : 'badge-planned'}`}>
                  {totals.isIntra ? t.intra : t.inter}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  data-testid="send-whatsapp-btn"
                  onClick={handleSendWhatsApp}
                  title={t.waCaption}
                  className="text-xs py-2 px-3 flex items-center gap-1.5 rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e]/25 transition-colors font-semibold"
                >
                  <Send size={12} /> {t.sendWA}
                </button>
                <button data-testid="download-pdf-btn" onClick={handleDownload}
                  className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5">
                  <Download size={12} /> {t.download}
                </button>
              </div>
            </div>

            {/* Invoice document */}
            <div className="bg-white text-black p-8 m-4 rounded-lg shadow-2xl" data-testid="invoice-preview">
              <div className="flex justify-between items-start pb-4 border-b-2 border-black">
                <div>
                  <div className="text-2xl font-bold tracking-tight">TAX INVOICE</div>
                  <div className="text-xs text-zinc-500 mt-1">GST Compliant · TaxSathi AI</div>
                </div>
                <div className="text-right">
                  <div className="font-bold font-mono">{invoice.no}</div>
                  <div className="text-xs text-zinc-500 mt-1">{invoice.date}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 py-5">
                <div>
                  <div className="text-[10px] text-zinc-500 mono-label mb-1">FROM (SELLER)</div>
                  <div className="font-bold text-sm">{seller.name || '—'}</div>
                  <div className="text-xs text-zinc-700 mt-0.5">{seller.address}</div>
                  <div className="text-xs mt-1.5"><span className="font-semibold">GSTIN:</span> <span className="font-mono">{seller.gstin || '—'}</span></div>
                  <div className="text-xs"><span className="font-semibold">State:</span> {seller.state}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 mono-label mb-1">BILL TO (BUYER)</div>
                  <div className="font-bold text-sm">{buyer.name || '—'}</div>
                  <div className="text-xs text-zinc-700 mt-0.5">{buyer.address || '—'}</div>
                  <div className="text-xs mt-1.5"><span className="font-semibold">GSTIN:</span> <span className="font-mono">{buyer.gstin || '—'}</span></div>
                  <div className="text-xs"><span className="font-semibold">State:</span> {buyer.state}</div>
                </div>
              </div>

              <div className="text-[11px] text-zinc-600 italic pb-3">
                {t.placeOfSupply}: <span className="font-semibold not-italic">{buyer.state}</span> · {totals.isIntra ? t.intra : t.inter}
              </div>

              <table className="w-full text-xs border border-zinc-300" data-testid="invoice-table">
                <thead className="bg-zinc-100">
                  <tr className="text-left">
                    <th className="p-2 border-r border-zinc-300">#</th>
                    <th className="p-2 border-r border-zinc-300">{t.description}</th>
                    <th className="p-2 border-r border-zinc-300">{t.hsn}</th>
                    <th className="p-2 border-r border-zinc-300 text-right">{t.qty}</th>
                    <th className="p-2 border-r border-zinc-300">{t.unit}</th>
                    <th className="p-2 border-r border-zinc-300 text-right">{t.rate}</th>
                    <th className="p-2 border-r border-zinc-300 text-right">{t.gstRate}</th>
                    <th className="p-2 text-right">{t.amount}</th>
                  </tr>
                </thead>
                <tbody>
                  {totals.lines.map((l, i) => (
                    <tr key={l.id} className="border-t border-zinc-200" data-testid={`invoice-row-${i}`}>
                      <td className="p-2 border-r border-zinc-200">{i + 1}</td>
                      <td className="p-2 border-r border-zinc-200">{l.description || '—'}</td>
                      <td className="p-2 border-r border-zinc-200 font-mono">{l.hsn || '—'}</td>
                      <td className="p-2 border-r border-zinc-200 text-right font-mono">{l.qty}</td>
                      <td className="p-2 border-r border-zinc-200">{l.unit}</td>
                      <td className="p-2 border-r border-zinc-200 text-right font-mono">{fmt(l.rate)}</td>
                      <td className="p-2 border-r border-zinc-200 text-right font-mono">{l.gstRate}%</td>
                      <td className="p-2 text-right font-mono">{fmt(l.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mt-4">
                <div className="w-72 space-y-1.5 text-xs">
                  <Row label={t.subtotal} value={fmt(totals.subtotal)} />
                  {totals.isIntra ? (
                    <>
                      <Row label={t.cgst} value={fmt(totals.cgst)} />
                      <Row label={t.sgst} value={fmt(totals.sgst)} />
                    </>
                  ) : (
                    <Row label={t.igst} value={fmt(totals.igst)} />
                  )}
                  <div className="border-t border-zinc-300 pt-2 mt-2 flex justify-between font-bold text-base">
                    <span>{t.grandTotal}</span>
                    <span data-testid="grand-total" className="font-mono">{fmt(totals.grandTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-zinc-200 text-[10px] text-zinc-500 italic">
                Computer-generated invoice. Verify before sharing with buyer. Generated by TaxSathi AI · {new Date().toLocaleString('en-IN')}
              </div>
            </div>
          </section>

          <div className="ts-card p-4 border-amber-500/20">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-zinc-400 text-xs leading-relaxed">{t.notice}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── small field helpers ───────────────────────────────────────────────────────
const Field = ({ label, value, onChange, type = 'text', span2, tiny, testid, mono }) => (
  <div className={span2 ? 'col-span-2' : ''}>
    <label className={`text-zinc-500 block ${tiny ? 'text-[10px] mb-1' : 'text-xs mb-1.5'}`}>{label}</label>
    <input
      data-testid={testid}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full bg-[#0a0a0a] border border-white/10 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:border-white/30 ${mono ? 'font-mono' : ''}`}
    />
  </div>
);

const SelectField = ({ label, value, options, onChange, span2, tiny, testid, display }) => (
  <div className={span2 ? 'col-span-2' : ''}>
    <label className={`text-zinc-500 block ${tiny ? 'text-[10px] mb-1' : 'text-xs mb-1.5'}`}>{label}</label>
    <select
      data-testid={testid}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-[#0a0a0a] border border-white/10 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:border-white/30"
    >
      {options.map(o => <option key={o} value={o}>{display ? display(o) : o}</option>)}
    </select>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-zinc-600">{label}</span>
    <span className="font-mono">{value}</span>
  </div>
);
