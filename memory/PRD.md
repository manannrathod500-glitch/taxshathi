# TaxSathi AI — Product Requirements Document

**Last Updated:** May 2025  
**Version:** 1.0 MVP  
**Domain:** taxsaathi.info  

---

## Product Overview

TaxSathi AI is a vertical SaaS product for Indian SMBs (starting with Gujarat textile/diamond traders, expanding All India). An AI-powered business OS covering GST, Invoice, CRM, Compliance, CA Connect, and Business Insights.

**Target:** 75,000+ SMBs in Surat/Ahmedabad + All India GST-registered businesses  
**ARR Goal:** ₹10 crore in 18-24 months  
**Tech:** Gemini 2.5 Flash API (via Emergent Universal Key), React + FastAPI + MongoDB

---

## User Personas

1. **Textile Trader (Surat)** — Files GSTR-1/3B monthly, uses WhatsApp for orders, struggles with manual entry
2. **Diamond Exporter (Ahmedabad)** — Needs ITC reconciliation, e-invoicing, compliance calendar
3. **Kirana Wholesaler (All India)** — Composition scheme user, needs simple invoice + reminder

---

## Pricing Tiers

| Tier | Price | Modules |
|------|-------|---------|
| Starter | ₹2,999/month | AI GST Assistant + Smart Invoice Engine |
| Growth | ₹7,999/month | + Buyer CRM + Compliance Calendar |
| Enterprise | ₹19,999/month | + CA Connect + Business Insights |

---

## 6 Modules (Build Order)

| # | Module | Status | Tier | Phase |
|---|--------|--------|------|-------|
| 1 | Marketing Website + AI Demo + Analyzer + Progress Tracker | **LIVE** | - | Phase 0 |
| 2 | AI GST Assistant | **NEXT** | Starter | Phase 1 |
| 3 | Smart Invoice Engine | Planned | Starter | Phase 1 |
| 4 | Buyer/Supplier CRM | Planned | Growth | Phase 2 |
| 5 | Compliance Calendar | Planned | Growth | Phase 2 |
| 6 | CA Connect Marketplace | Planned | Enterprise | Phase 3 |
| 7 | Business Insights | Planned | Enterprise | Phase 3 |

---

## What's Been Implemented (Phase 0 — May 2025)

### Marketing Website (/)
- Hero section: "GST. Invoice. CRM. Compliance." + Gujarati headline "તમારો સ્માર્ટ GST સાથી"
- Blueprint grid dark background (Vercel/Linear style)
- Stats bar: 75,000+ SMBs, 6 modules, 3 languages, ₹10Cr ARR
- Problem section: 4 pain cards
- 6 Modules Bento Grid with status badges
- How It Works (3 steps)
- Pricing section (3 tiers)
- Waitlist form (email, name, city, business_type) → MongoDB storage
- WhatsApp CTA floating button (+91-9999999999 placeholder)
- Fully mobile responsive

### AI Demo Page (/demo)
- Terminal-style dark chat interface
- Gemini 2.5 Flash AI (via emergentintegrations + Emergent Universal Key)
- 6 suggested GST questions
- Session-based conversation memory
- Reset/clear conversation

### Module Analyzer (/analyzer)
- Input: module name, description, target users
- AI analyzes across 5 dimensions: Product Fit, Pricing Tier, Revenue Impact, Technical Implementation, Stickiness vs Complexity
- Past analyses history (loaded from MongoDB)
- 3 preset example modules
- Gemini 2.5 Flash powered

### Progress Tracker (/progress)
- 7 module status cards (clickable to cycle: Planned → Building → Up Next → Live)
- Status overrides persisted in MongoDB
- Overall completion % bar
- ARR Math breakdown (Starter/Growth/Enterprise)
- Next recommended build step (dynamic)

### Backend APIs
- POST /api/waitlist — join waitlist
- GET /api/waitlist/count — count
- POST /api/chat/demo — AI demo chat
- POST /api/analyze/module — module analysis
- GET /api/progress — module progress (DB-persisted status)
- PATCH /api/progress/{id} — update module status
- GET /api/analyses — past module analyses

---

## Architecture

- **Frontend:** React 19 + Tailwind CSS + Space Grotesk + Manrope fonts
- **Backend:** FastAPI + Motor (async MongoDB)
- **AI:** Gemini 2.5 Flash via `emergentintegrations` library
- **DB:** MongoDB (waitlist, module_analyses, module_status collections)
- **Fonts:** Space Grotesk (display), Manrope (body), Noto Sans Gujarati

---

## Prioritized Backlog

### P0 — Critical (Next Sprint)
- [ ] Build AI GST Assistant Module (Phase 1 MVP)
- [ ] WhatsApp Business API integration (Composio)
- [ ] GSTR-1/GSTR-3B auto-draft from Google Sheets

### P1 — High Priority
- [ ] Smart Invoice Engine (WhatsApp order → Invoice)
- [ ] Tally ERP sync via Composio
- [ ] Email notifications for waitlist converts

### P2 — Medium Priority
- [ ] Buyer/Supplier CRM
- [ ] Compliance Calendar with WhatsApp alerts
- [ ] Payment gateway (Razorpay) for subscription billing
- [ ] User authentication for subscribers

### P3 — Future
- [ ] CA Connect Marketplace
- [ ] Business Insights (Gujarati AI reports)
- [ ] Mobile app (React Native)
