"""TaxSathi AI — Backend API Tests"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


# ── Waitlist ─────────────────────────────────────────────────────────────────
class TestWaitlist:
    def test_waitlist_count(self):
        r = requests.get(f"{BASE_URL}/api/waitlist/count")
        assert r.status_code == 200
        data = r.json()
        assert 'count' in data
        assert isinstance(data['count'], int)
        print(f"Waitlist count: {data['count']}")

    def test_join_waitlist(self):
        payload = {"email": "TEST_taxsathi@example.com", "name": "Test User", "city": "Ahmedabad", "business_type": "Textile"}
        r = requests.post(f"{BASE_URL}/api/waitlist", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data['success'] is True
        print(f"Waitlist join: {data['message']}")

    def test_join_waitlist_duplicate(self):
        payload = {"email": "TEST_taxsathi@example.com", "name": "Test User"}
        r = requests.post(f"{BASE_URL}/api/waitlist", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data['success'] is True
        assert data.get('already_exists') is True

    def test_join_waitlist_missing_email(self):
        r = requests.post(f"{BASE_URL}/api/waitlist", json={"name": "No Email"})
        assert r.status_code == 422  # Validation error


# ── Progress ──────────────────────────────────────────────────────────────────
class TestProgress:
    def test_get_progress(self):
        r = requests.get(f"{BASE_URL}/api/progress")
        assert r.status_code == 200
        data = r.json()
        assert 'modules' in data
        assert len(data['modules']) == 7
        assert 'completion_pct' in data
        print(f"Progress: {data['completion_pct']}% — {data['live_count']}/{data['total']}")

    def test_progress_module_fields(self):
        r = requests.get(f"{BASE_URL}/api/progress")
        modules = r.json()['modules']
        for m in modules:
            assert 'id' in m
            assert 'name' in m
            assert 'status' in m
        statuses = [m['status'] for m in modules]
        assert 'live' in statuses

    def test_patch_module_status(self):
        r = requests.patch(f"{BASE_URL}/api/progress/gst", json={"status": "next"})
        assert r.status_code == 200
        assert r.json()['success'] is True


# ── AI Demo Chat ──────────────────────────────────────────────────────────────
class TestDemoChat:
    def test_demo_chat_basic(self):
        r = requests.post(f"{BASE_URL}/api/chat/demo", json={"message": "What is GSTR-1?"}, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert 'response' in data
        assert len(data['response']) > 10
        assert 'session_id' in data
        print(f"Demo response length: {len(data['response'])}")

    def test_demo_chat_session_continuity(self):
        r1 = requests.post(f"{BASE_URL}/api/chat/demo", json={"message": "Hello"}, timeout=30)
        sid = r1.json()['session_id']
        r2 = requests.post(f"{BASE_URL}/api/chat/demo", json={"message": "What did I just say?", "session_id": sid}, timeout=30)
        assert r2.status_code == 200
        assert r2.json()['session_id'] == sid


# ── Module Analyzer ───────────────────────────────────────────────────────────
class TestModuleAnalyzer:
    def test_analyze_module(self):
        r = requests.post(f"{BASE_URL}/api/analyze/module", json={
            "module_name": "E-Way Bill Automation",
            "description": "Auto-generate e-way bills from invoices"
        }, timeout=60)
        assert r.status_code == 200
        data = r.json()
        assert 'analysis' in data
        text = data['analysis']
        # Check 5 sections
        for section in ['a)', 'b)', 'c)', 'd)', 'e)']:
            assert section in text, f"Missing section {section}"
        print(f"Analysis length: {len(text)}")

    def test_analyses_list(self):
        r = requests.get(f"{BASE_URL}/api/analyses")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
