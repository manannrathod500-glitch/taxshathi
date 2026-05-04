# TaxSathi AI — Product Requirements

## Original Problem Statement
Build "TaxSathi AI", a full-stack AI-powered GST advisory web app for Indian SMBs (focus on Gujarat textile/diamond traders).

### Core requirements
1. 3D animated landing page (Three.js / GSAP optional, currently Tailwind dark theme)
2. AI sales agent widget (Gemini 2.5 Flash)
3. Client Dashboard with AI chat, PDF downloads, conversation history
4. Free questions counter (10 free) + Referral system
5. Admin dashboard
6. Integrations: Razorpay (payments), Resend (emails), optional Supabase (Auth/DB)
7. Phase-1 deliverables: Marketing site, AI Demo, Module Analyzer, Progress Tracker on Vercel-ready dark SaaS theme

## Architecture
- **Frontend**: React 19 + Tailwind + lucide-react + react-router-dom + jsPDF + jspdf-autotable
- **Backend**: FastAPI + Motor (MongoDB) + emergentintegrations (LlmChat for sessioned chat) + requests (for one-shot Gemini JSON-mode calls)
- **AI**: Gemini 2.5 Flash via server-side proxy (key never leaves backend)
- **Hosting**: Frontend → Vercel; Backend → Emergent K8s

## What's been implemented (rolling)

### 2026-02 (this session)
- Fixed "NaN+ businesses on waitlist" → hardcoded `488+` until backend is connected
- Fixed empty-on-scroll sections on Vercel → CSS `revealFallback` keyframes ensure `.reveal` blocks always become visible (`/app/frontend/src/App.css`)
- **Phase 1 — `/gst-assistant`** built: tri-lingual (EN/HI/GU) GST liability calculator with deterministic CGST/SGST/IGST math, AI compliance checklist + sector-specific tips, draft GSTR-1 table, CSV export
- **Phase 2 — `/invoice`** built: WhatsApp-style order parser (Gemini), auto-generates GST invoice with seller/buyer/HSN/CGST-SGST-IGST split, live invoice preview, PDF download via jsPDF + autoTable
- **Phase 3 — Backend AI proxy**:
  - `POST /api/ai/parse-order` — parses unstructured WhatsApp messages into structured invoice items
  - `POST /api/ai/gst-insights` — returns `{summary, checklist[], tips[]}` for the current month based on totals
  - Both use REST + `responseMimeType: application/json` for strict JSON
  - `REACT_APP_GEMINI_API_KEY` removed from frontend `.env`; key now only in `backend/.env`

## Backlog / Roadmap

### P1
- Supabase OR FastAPI+JWT auth (user accounts foundation)
- Razorpay subscription paywall (Starter ₹2,999 / Growth ₹7,999 / Enterprise ₹19,999)
- Free questions counter + Referral bonus logic

### P2
- Resend transactional emails (welcome, expiry, paywall)
- Client Dashboard (chat history + saved invoices + downloads)
- Admin dashboard (waitlist export, user management, analytics)

### P3
- Buyer/Supplier CRM (track outstanding payments, AI follow-ups)
- Compliance Calendar (TDS/advance tax/GST WhatsApp alerts)
- CA Connect Marketplace
- Business Insights (monthly P&L in Gujarati)

## Key API endpoints
- `POST /api/waitlist` · `GET /api/waitlist/count`
- `POST /api/chat/demo` (sessioned demo chat via `LlmChat`)
- `POST /api/analyze/module`
- `GET /api/progress` · `PATCH /api/progress/{id}`
- `POST /api/ai/parse-order` · `POST /api/ai/gst-insights` (new)

## Known notes
- Demo backend runs against MongoDB. PRD originally specified Supabase — pending user decision.
- Frontend deployed to Vercel; preview env hosts both BE and FE.
