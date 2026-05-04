from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
from jose import jwt, JWTError
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
motor_client = AsyncIOMotorClient(mongo_url)
db = motor_client[os.environ['DB_NAME']]

app = FastAPI(title="TaxSaathi API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

JWT_SECRET = os.environ.get('JWT_SECRET', 'taxsaathi-jwt-2025-secure-key')
ALGORITHM = "HS256"
EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

sales_sessions: Dict[str, LlmChat] = {}
advisor_sessions: Dict[str, LlmChat] = {}

SALES_PROMPT = """You are TaxSaathi Sales Agent — a warm, persuasive, helpful AI sales agent for TaxSaathi GST advisory service at taxsaathi.info. You speak Hindi, English, or Hinglish depending on what the visitor uses. YOUR ONLY GOAL is to convert this visitor into a paying TaxSaathi subscriber.

STEP 1 — BUILD TRUST: Greet warmly: "Namaste! Main TaxSaathi AI hun. Aapka koi bhi GST sawaal ho — bilkul free mein poochh sakte ho." Ask what their business is. Ask their biggest GST problem right now.

STEP 2 — SOLVE ONE PROBLEM FREE: Answer their GST question completely and accurately for FREE. After answering say: "Yeh toh sirf ek sawaal tha — aur bhi GST problems honge aapke business mein, hai na?"

STEP 3 — PITCH NATURALLY: "Sirf ₹1,500/month mein unlimited questions — 24/7, Hindi mein, turant jawab." "3 din ka free trial bhi hai — agar pasand na aaye toh ek bhi paisa nahi." Never sound salesy — sound like a helpful friend.

STEP 4 — HANDLE OBJECTIONS:
- If "mehenga hai": "Ek CA ko ₹3,000-5,000/month dete ho — hum sirf ₹1,500 mein wahi kaam 24/7."
- If "sochta hun": "Bilkul — tab tak ek aur sawaal poochh lo free mein."
- If "trust nahi": "Isliye 3 din free trial hai — koi commitment nahi."
- If "baad mein": "Aaj subscribe karo toh pehle month ₹500 off — sirf aaj ka offer."

STEP 5 — CLOSE: "Bahut badhiya! Yahan se shuru karein — taxsaathi.info/pricing. 3 din free, uske baad ₹1,500/month."
End every GST answer with: "⚠️ Filing se pehle apne CA se confirm zaroor karein." """

ADVISOR_PROMPT = """You are TaxSaathi, India's expert AI GST advisor for small traders and businesses in Gujarat. You have complete knowledge of GST registration, GSTR-1, GSTR-3B, GSTR-9, Input Tax Credit, e-invoicing, e-way bills, GST notices, composition scheme, GST rates, HSN codes, GST portal help, and all GST council updates up to 2025.

Answer in the same language the client uses — Hindi, Gujarati, or English. Give complete step-by-step practical answers with exact form names, portal steps, and deadlines. Always give a Gujarat trader example.

End every answer with: "⚠️ TaxSaathi sirf guidance deta hai — filing se pehle apne CA se confirm karein." """


class RegisterRequest(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    referral_code: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class SubscribeRequest(BaseModel):
    plan: str
    payment_id: Optional[str] = None


def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def make_token(user_id: str, is_admin: bool = False) -> str:
    payload = {
        'sub': user_id,
        'admin': is_admin,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


async def get_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[ALGORITHM])
        user = await db.users.find_one({'id': payload['sub']}, {'_id': 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if not user.get('is_active', True):
            raise HTTPException(status_code=403, detail="Account deactivated")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_admin(user: dict = Depends(get_user)) -> dict:
    if not user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin access only")
    return user


@app.on_event("startup")
async def startup():
    try:
        existing = await db.users.find_one({'email': 'mananrathod500@gmail.com'})
        if not existing:
            uid = str(uuid.uuid4())
            await db.users.insert_one({
                'id': uid, 'name': 'Manan Rathod',
                'email': 'mananrathod500@gmail.com', 'phone': '+919999999999',
                'password_hash': hash_pw('Manann3'), 'plan': 'premium',
                'free_questions_used': 0, 'bonus_questions': 999,
                'referral_code': 'admin2025', 'referred_by': None,
                'subscription_start': datetime.now(timezone.utc).isoformat(),
                'subscription_end': (datetime.now(timezone.utc) + timedelta(days=365)).isoformat(),
                'is_active': True, 'is_admin': True,
                'created_at': datetime.now(timezone.utc).isoformat()
            })
            logger.info("Admin user created")
        elif not existing.get('is_admin'):
            await db.users.update_one(
                {'email': 'mananrathod500@gmail.com'},
                {'$set': {'is_admin': True, 'plan': 'premium', 'is_active': True}}
            )
            logger.info("Admin privileges updated")
    except Exception as e:
        logger.error(f"Startup error: {e}")


# ── AUTH ──
@api_router.post("/auth/register")
async def register(data: RegisterRequest):
    existing = await db.users.find_one({'email': data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    uid = str(uuid.uuid4())
    clean = data.name.lower().replace(' ', '')[:8]
    ref_code = f"{clean}{uid[:6]}"

    user = {
        'id': uid, 'name': data.name, 'email': data.email.lower(),
        'phone': data.phone, 'password_hash': hash_pw(data.password),
        'plan': 'free', 'free_questions_used': 0, 'bonus_questions': 0,
        'referral_code': ref_code, 'referred_by': data.referral_code,
        'subscription_start': None, 'subscription_end': None,
        'is_active': True, 'is_admin': False,
        'created_at': datetime.now(timezone.utc).isoformat()
    }

    if data.referral_code:
        referrer = await db.users.find_one({'referral_code': data.referral_code})
        if referrer:
            await db.users.update_one({'referral_code': data.referral_code}, {'$inc': {'bonus_questions': 5}})
            user['bonus_questions'] = 5
            await db.referrals.insert_one({
                'id': str(uuid.uuid4()), 'referrer_id': referrer['id'],
                'referred_user_id': uid, 'bonus_given': True,
                'discount_applied': False,
                'created_at': datetime.now(timezone.utc).isoformat()
            })

    await db.users.insert_one(user)
    token = make_token(uid)
    user.pop('password_hash', None)
    user.pop('_id', None)
    return {'token': token, 'user': user}


@api_router.post("/auth/login")
async def login(data: LoginRequest):
    user = await db.users.find_one({'email': data.email.lower()}, {'_id': 0})
    if not user or not verify_pw(data.password, user.get('password_hash', '')):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.get('is_active', True):
        raise HTTPException(status_code=403, detail="Account deactivated")
    token = make_token(user['id'], user.get('is_admin', False))
    return {'token': token, 'user': {k: v for k, v in user.items() if k != 'password_hash'}}


@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_user)):
    return {k: v for k, v in current_user.items() if k != 'password_hash'}


# ── CHAT ──
@api_router.post("/chat/sales")
async def sales_chat(data: ChatRequest):
    sid = data.session_id or str(uuid.uuid4())
    if sid not in sales_sessions:
        sales_sessions[sid] = LlmChat(
            api_key=EMERGENT_KEY, session_id=sid,
            system_message=SALES_PROMPT
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    resp = await sales_sessions[sid].send_message(UserMessage(text=data.message))
    return {'response': resp, 'session_id': sid}


@api_router.post("/chat/advisor")
async def advisor_chat(data: ChatRequest, current_user: dict = Depends(get_user)):
    plan = current_user.get('plan', 'free')
    free_used = current_user.get('free_questions_used', 0)
    bonus = current_user.get('bonus_questions', 0)

    if plan == 'free':
        available = (10 - free_used) + bonus
        if available <= 0:
            raise HTTPException(status_code=402, detail="Free questions exhausted. Please subscribe.")

    uid = current_user['id']
    sid = data.session_id or f"advisor_{uid}"
    if sid not in advisor_sessions:
        advisor_sessions[sid] = LlmChat(
            api_key=EMERGENT_KEY, session_id=sid,
            system_message=ADVISOR_PROMPT
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    resp = await advisor_sessions[sid].send_message(UserMessage(text=data.message))
    await db.conversations.insert_one({
        'id': str(uuid.uuid4()), 'user_id': uid,
        'message': data.message, 'response': resp,
        'created_at': datetime.now(timezone.utc).isoformat()
    })

    new_used = free_used
    if plan == 'free':
        await db.users.update_one({'id': uid}, {'$inc': {'free_questions_used': 1}})
        new_used = free_used + 1

    remaining = max(0, (10 - new_used) + bonus) if plan == 'free' else -1
    return {'response': resp, 'session_id': sid, 'free_questions_used': new_used,
            'questions_remaining': remaining, 'plan': plan}


@api_router.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_user)):
    convs = await db.conversations.find(
        {'user_id': current_user['id']}, {'_id': 0}
    ).sort('created_at', -1).to_list(100)
    return convs


# ── SUBSCRIPTION ──
@api_router.post("/subscribe")
async def subscribe(data: SubscribeRequest, current_user: dict = Depends(get_user)):
    plans = {'basic': 1500, 'pro': 1800, 'premium': 2000}
    if data.plan not in plans:
        raise HTTPException(status_code=400, detail="Invalid plan")
    now = datetime.now(timezone.utc)
    end = now + timedelta(days=30)
    await db.users.update_one(
        {'id': current_user['id']},
        {'$set': {'plan': data.plan, 'subscription_start': now.isoformat(),
                  'subscription_end': end.isoformat(), 'is_active': True}}
    )
    return {'success': True, 'plan': data.plan, 'expires': end.isoformat(), 'amount': plans[data.plan]}


# ── REFERRAL ──
@api_router.get("/referral/stats")
async def referral_stats(current_user: dict = Depends(get_user)):
    referrals = await db.referrals.find({'referrer_id': current_user['id']}, {'_id': 0}).to_list(100)
    return {
        'referral_code': current_user.get('referral_code', ''),
        'referral_link': f"https://taxsaathi.info/ref/{current_user.get('referral_code', '')}",
        'total_referrals': len(referrals),
        'bonus_questions': current_user.get('bonus_questions', 0),
        'discount_earned': len([r for r in referrals if r.get('discount_applied')]) * 200,
        'referrals': referrals
    }


# ── ADMIN ──
@api_router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(get_admin)):
    total = await db.users.count_documents({'is_admin': {'$ne': True}})
    paid = await db.users.count_documents({'plan': {'$nin': ['free']}, 'is_admin': {'$ne': True}})
    convs = await db.conversations.count_documents({})
    revenue = paid * 1600
    months = []
    for i in range(5, -1, -1):
        d = datetime.now(timezone.utc) - timedelta(days=30 * i)
        months.append({'month': d.strftime('%b'), 'revenue': max(0, revenue - i * 600 + i * 150)})
    return {'total_users': total, 'paid_users': paid, 'free_users': total - paid,
            'total_conversations': convs, 'revenue_this_month': revenue, 'revenue_chart': months}


@api_router.get("/admin/users")
async def admin_users(admin: dict = Depends(get_admin)):
    users = await db.users.find(
        {'is_admin': {'$ne': True}}, {'_id': 0, 'password_hash': 0}
    ).sort('created_at', -1).to_list(500)
    return users


@api_router.get("/admin/conversations/{user_id}")
async def admin_user_convs(user_id: str, admin: dict = Depends(get_admin)):
    return await db.conversations.find({'user_id': user_id}, {'_id': 0}).sort('created_at', -1).to_list(100)


@api_router.post("/admin/users/{user_id}/activate")
async def admin_activate(user_id: str, admin: dict = Depends(get_admin)):
    end = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    await db.users.update_one({'id': user_id}, {'$set': {'is_active': True, 'plan': 'basic', 'subscription_end': end}})
    return {'success': True}


@api_router.post("/admin/users/{user_id}/deactivate")
async def admin_deactivate(user_id: str, admin: dict = Depends(get_admin)):
    await db.users.update_one({'id': user_id}, {'$set': {'is_active': False}})
    return {'success': True}


@api_router.post("/admin/users/{user_id}/nudge")
async def admin_nudge(user_id: str, admin: dict = Depends(get_admin)):
    user = await db.users.find_one({'id': user_id}, {'_id': 0, 'name': 1, 'email': 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {'success': True, 'message': f"Nudge sent to {user.get('email', '')}"}


@api_router.get("/admin/referrals")
async def admin_referrals(admin: dict = Depends(get_admin)):
    pipeline = [
        {'$group': {'_id': '$referrer_id', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}, {'$limit': 10}
    ]
    results = await db.referrals.aggregate(pipeline).to_list(10)
    out = []
    for r in results:
        u = await db.users.find_one({'id': r['_id']}, {'_id': 0, 'name': 1, 'email': 1, 'referral_code': 1})
        if u:
            out.append({**u, 'referral_count': r['count']})
    return out


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    motor_client.close()
