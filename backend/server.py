from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
import uuid
from datetime import datetime, timezone
import requests
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
motor_client = AsyncIOMotorClient(mongo_url)
db = motor_client[os.environ['DB_NAME']]

app = FastAPI(title="TaxSathi AI API")
api_router = APIRouter(prefix="/api")

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

# Session caches
demo_sessions: Dict[str, LlmChat] = {}
analyzer_sessions: Dict[str, LlmChat] = {}

# ── SYSTEM PROMPTS ──────────────────────────────────────────────────────────
DEMO_PROMPT = """You are TaxSathi AI — an expert AI assistant for Indian SMB owners, especially Gujarat textile and diamond traders. You have deep knowledge of:
- GST filing (GSTR-1, GSTR-3B, GSTR-9, composition scheme)
- Invoice generation and e-invoicing rules
- Input Tax Credit (ITC) reconciliation
- TDS, advance tax, compliance deadlines
- Tally ERP integration
- WhatsApp-based business workflows for Indian traders

Answer in the same language as the question (Gujarati, Hindi, or English). Keep answers practical, specific, and actionable. For GST questions, mention exact form names, deadlines, and portal steps. Give Gujarat textile/diamond trader examples where relevant.

Always end answers with: "⚠️ Filing se pehle apne CA se verify zaroor karein." """

ANALYZER_PROMPT = """You are TaxSathi AI's Chief Product Strategist. TaxSathi AI is a vertical SaaS for Indian SMBs (Gujarat textile, diamond traders + all India). 

Current 6 modules:
1. AI GST Assistant — GSTR-1/GSTR-3B drafting, reminders in Gujarati (Starter tier)
2. Smart Invoice Engine — WhatsApp order → GST invoice → Tally sync (Starter tier)
3. Buyer/Supplier CRM — Outstanding payments, AI follow-ups (Growth tier)
4. Compliance Calendar — TDS, advance tax, GST deadlines + WhatsApp alerts (Growth tier)
5. CA Connect Marketplace — Connects users to CAs, 20-30% revenue cut (Enterprise tier)
6. Business Insights — Monthly AI report in Gujarati (Enterprise tier)

Pricing: Starter ₹2,999/month | Growth ₹7,999/month | Enterprise ₹19,999/month
ARR Goal: ₹10 crore in 18-24 months (~417 Enterprise or ~1,042 Growth customers needed)
Tech stack: Gemini API (AI) + Composio (Google Sheets, Tally, Gmail, WhatsApp integrations)

For the new module idea provided, give a concise structured analysis with these exact sections:

## a) Product Fit
Does it fit TaxSathi AI or should it be a separate product? Why?

## b) Pricing Tier
Which tier (Starter/Growth/Enterprise)? Justification?

## c) Revenue Impact
How does this affect ₹10Cr ARR math? ARPU impact, churn reduction, new segments?

## d) Technical Implementation
How to implement using Gemini API + Composio?

## e) Stickiness vs Complexity
Rate 1-10 stickiness. Rate 1-10 complexity. Net recommendation: Build / Defer / Skip?

Be direct, analytical, data-driven. Use Indian SMB market context."""


class WaitlistEntry(BaseModel):
    email: str
    name: Optional[str] = None
    business_type: Optional[str] = None
    city: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class AnalyzerRequest(BaseModel):
    module_name: str
    description: str
    target_users: Optional[str] = None
    session_id: Optional[str] = None


# ── WAITLIST ────────────────────────────────────────────────────────────────
@api_router.post("/waitlist")
async def join_waitlist(entry: WaitlistEntry):
    existing = await db.waitlist.find_one({'email': entry.email.lower()})
    if existing:
        return {'success': True, 'message': 'Already on waitlist!', 'already_exists': True}
    count = await db.waitlist.count_documents({})
    await db.waitlist.insert_one({
        'id': str(uuid.uuid4()),
        'email': entry.email.lower(),
        'name': entry.name,
        'business_type': entry.business_type,
        'city': entry.city,
        'position': count + 1,
        'created_at': datetime.now(timezone.utc).isoformat()
    })
    return {'success': True, 'message': f'You are #{count + 1} on the waitlist!', 'position': count + 1}


@api_router.get("/waitlist/count")
async def waitlist_count():
    count = await db.waitlist.count_documents({})
    return {'count': count}


# ── AI DEMO CHAT ─────────────────────────────────────────────────────────────
@api_router.post("/chat/demo")
async def demo_chat(data: ChatRequest):
    sid = data.session_id or str(uuid.uuid4())
    if sid not in demo_sessions:
        demo_sessions[sid] = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=sid,
            system_message=DEMO_PROMPT
        ).with_model("gemini", "gemini-2.5-flash")
    resp = await demo_sessions[sid].send_message(UserMessage(text=data.message))
    return {'response': resp, 'session_id': sid}


# ── MODULE ANALYZER ──────────────────────────────────────────────────────────
@api_router.post("/analyze/module")
async def analyze_module(data: AnalyzerRequest):
    sid = data.session_id or str(uuid.uuid4())
    if sid not in analyzer_sessions:
        analyzer_sessions[sid] = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=sid,
            system_message=ANALYZER_PROMPT
        ).with_model("gemini", "gemini-2.5-flash")

    prompt = f"""Analyze this new module idea for TaxSathi AI:

Module Name: {data.module_name}
Description: {data.description}
Target Users: {data.target_users or 'Same as TaxSathi AI (Indian SMBs, Gujarat traders)'}

Provide the full analysis with all 5 sections (a through e)."""

    resp = await analyzer_sessions[sid].send_message(UserMessage(text=prompt))

    # Save analysis
    await db.module_analyses.insert_one({
        'id': str(uuid.uuid4()),
        'module_name': data.module_name,
        'description': data.description,
        'analysis': resp,
        'created_at': datetime.now(timezone.utc).isoformat()
    })
    return {'analysis': resp, 'session_id': sid}


# ── PROGRESS TRACKER ─────────────────────────────────────────────────────────
DEFAULT_MODULES = [
    {'id': 'website', 'name': 'Marketing Website', 'desc': 'Landing page, demo, analyzer', 'default_status': 'live', 'phase': 'Phase 0', 'effort': 'Low', 'revenue_impact': 'Acquisition'},
    {'id': 'gst', 'name': 'AI GST Assistant', 'desc': 'GSTR-1/GSTR-3B drafting, Gujarati reminders', 'default_status': 'next', 'phase': 'Phase 1', 'tier': 'Starter', 'effort': 'High', 'revenue_impact': '₹2,999×N'},
    {'id': 'invoice', 'name': 'Smart Invoice Engine', 'desc': 'WhatsApp order → GST invoice → Tally sync', 'default_status': 'planned', 'phase': 'Phase 1', 'tier': 'Starter', 'effort': 'High', 'revenue_impact': 'Upsell'},
    {'id': 'crm', 'name': 'Buyer/Supplier CRM', 'desc': 'Outstanding payments, AI follow-ups', 'default_status': 'planned', 'phase': 'Phase 2', 'tier': 'Growth', 'effort': 'Medium', 'revenue_impact': '₹7,999×N'},
    {'id': 'compliance', 'name': 'Compliance Calendar', 'desc': 'TDS, advance tax, GST deadlines + WhatsApp alerts', 'default_status': 'planned', 'phase': 'Phase 2', 'tier': 'Growth', 'effort': 'Medium', 'revenue_impact': 'Retention'},
    {'id': 'ca', 'name': 'CA Connect Marketplace', 'desc': 'Connect users to CAs, 20-30% revenue cut', 'default_status': 'planned', 'phase': 'Phase 3', 'tier': 'Enterprise', 'effort': 'Medium', 'revenue_impact': 'Marketplace'},
    {'id': 'insights', 'name': 'Business Insights', 'desc': 'Monthly AI report in Gujarati/Hindi', 'default_status': 'planned', 'phase': 'Phase 3', 'tier': 'Enterprise', 'effort': 'Low', 'revenue_impact': '₹19,999×N'},
]


@api_router.get("/progress")
async def get_progress():
    # Load persisted status overrides from DB
    overrides = {}
    async for doc in db.module_status.find({}, {'_id': 0}):
        overrides[doc['module_id']] = doc.get('status')

    modules = []
    for m in DEFAULT_MODULES:
        status = overrides.get(m['id'], m['default_status'])
        modules.append({k: v for k, v in m.items() if k != 'default_status'} | {'status': status})

    live = len([m for m in modules if m['status'] == 'live'])
    total = len(modules)
    pct = round((live / total) * 100)
    next_mod = next((m for m in modules if m['status'] == 'next'), None)
    next_step = f"Build {next_mod['name']} — {next_mod.get('tier','')}" if next_mod else "All modules launched!"
    return {'modules': modules, 'completion_pct': pct, 'live_count': live, 'total': total, 'next_step': next_step}


@api_router.patch("/progress/{module_id}")
async def update_module_status(module_id: str, data: dict):
    await db.module_status.update_one(
        {'module_id': module_id},
        {'$set': {'status': data.get('status'), 'updated_at': datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {'success': True}


# ── PAST ANALYSES ─────────────────────────────────────────────────────────────
@api_router.get("/analyses")
async def get_analyses():
    analyses = await db.module_analyses.find({}, {'_id': 0}).sort('created_at', -1).to_list(20)
    return analyses


# ── AI PROXY (Gemini, server-side) ───────────────────────────────────────────
GEMINI_REST_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
)

LANG_NAME = {
    "en": "English",
    "hi": "Hindi (Devanagari script)",
    "gu": "Gujarati (Gujarati script)",
}

BIZ_LABEL = {
    "textile": "Textile",
    "diamond": "Diamond / Gems & Jewellery",
    "pharma": "Pharmaceutical",
    "kirana": "Kirana / FMCG",
    "manufacturing": "Manufacturing",
    "services": "Services",
}


def _gemini_json(prompt: str, temperature: float = 0.3) -> dict:
    """Call Gemini and parse the JSON response."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")
    try:
        r = requests.post(
            f"{GEMINI_REST_URL}?key={GEMINI_API_KEY}",
            json={
                "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": temperature,
                    "responseMimeType": "application/json",
                },
            },
            timeout=45,
        )
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Gemini network error: {e}")
    if not r.ok:
        raise HTTPException(status_code=502, detail=f"Gemini {r.status_code}: {r.text[:300]}")
    try:
        text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, ValueError) as e:
        raise HTTPException(status_code=502, detail=f"Malformed Gemini response: {e}")
    import json as _json
    try:
        return _json.loads(text)
    except _json.JSONDecodeError:
        return {"raw": text}


class GSTTotals(BaseModel):
    taxable: float
    cgst: float
    sgst: float
    igst: float
    totalTax: float


class GSTInsightsRequest(BaseModel):
    language: str = "en"
    business_type: str = "textile"
    business_state: str = "Gujarat"
    totals: GSTTotals
    entry_count: int = 0


@api_router.post("/ai/gst-insights")
async def ai_gst_insights(data: GSTInsightsRequest):
    lang = LANG_NAME.get(data.language, "English")
    sector = BIZ_LABEL.get(data.business_type, data.business_type)
    month = datetime.now(timezone.utc).strftime("%B %Y")
    t = data.totals
    prompt = f"""You are an Indian GST compliance assistant for SMBs. Respond ONLY in {lang}. Generate output as STRICT JSON matching this schema:
{{
  "summary": "1-2 sentence high-level summary of the month's GST position",
  "checklist": ["6-8 actionable compliance items for the current month with specific Indian GST due dates"],
  "tips": ["3-5 sector-specific optimisation/risk tips"]
}}

Context:
- Month: {month}
- Business sector: {sector}
- Place of business (state): {data.business_state}
- Number of sales invoices this month: {data.entry_count}
- Total taxable sales: ₹{t.taxable:.2f}
- CGST payable: ₹{t.cgst:.2f}
- SGST payable: ₹{t.sgst:.2f}
- IGST payable: ₹{t.igst:.2f}
- Total GST liability: ₹{t.totalTax:.2f}

Important:
- Mention the exact GSTR-1 due date (11th of next month) and GSTR-3B due date (20th of next month).
- Include reminders for ITC reconciliation, e-invoicing threshold (turnover > ₹5 Cr), TDS under GST, and any sector-specific obligation.
- Keep each checklist item under 25 words.
- Output JSON ONLY — no markdown fences, no explanation."""
    return _gemini_json(prompt, temperature=0.4)


class ParseOrderRequest(BaseModel):
    message: str
    seller_state: str = "Gujarat"


@api_router.post("/ai/parse-order")
async def ai_parse_order(data: ParseOrderRequest):
    if not data.message.strip():
        raise HTTPException(status_code=400, detail="Empty order message")
    prompt = f"""You are an Indian GST invoice parser. Extract structured data from this informal WhatsApp / SMS order message into STRICT JSON. Use Indian GST conventions.

Schema:
{{
  "buyer": {{ "name": "string", "gstin": "string-or-empty", "address": "string-or-empty", "state": "one-of-Indian-states-or-empty", "phone": "digits-only-with-country-code-or-empty" }},
  "items": [
    {{ "description": "string", "hsn": "best-guess-HSN-code-as-string", "qty": number, "unit": "m|kg|nos|pcs|box|other", "rate": number, "gstRate": 5|12|18|28 }}
  ]
}}

Rules:
- "rate" is per-unit price in INR (number, no currency symbol).
- "qty" is the quantity number.
- Pick the most appropriate Indian HSN code (e.g. cotton fabric=5208, polyester=5407, garments=6109, diamonds=7102, pharma=3004, electronics=8517, services=9983).
- Pick a sensible GST rate based on the product (5% for textile fabric, 12% for processed, 18% for services/garments above ₹1000, 28% for luxury).
- Buyer state must be a valid Indian state name (e.g. "Maharashtra", "Gujarat") if mentioned, else "".
- "phone" must contain only digits with country code (e.g. "917698877447" — no +, no spaces, no dashes). If a 10-digit Indian mobile is mentioned without country code, prefix "91". Empty string if absent.
- Output JSON ONLY. No markdown, no commentary.

Seller state for context: {data.seller_state}

Order message:
\"\"\"{data.message}\"\"\""""
    return _gemini_json(prompt, temperature=0.2)


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    motor_client.close()
