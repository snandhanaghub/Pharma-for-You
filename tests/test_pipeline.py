#!/usr/bin/env python3
"""
🚀 Pharma4u Core Pipeline Test
Tests: Frontend/Tester -> FastAPI -> Ollama -> Response
"""

import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"
OLLAMA_URL = "http://localhost:11434"

print("=" * 60)
print("🏥 PHARMA4U CORE PIPELINE TEST")
print("=" * 60)
print()

# Step 1: Check Backend
print("🔹 STEP 1: Backend Health Check")
print("-" * 60)
try:
    resp = requests.get(f"{BASE_URL}/api/health", timeout=2)
    if resp.status_code == 200:
        print("✅ BACKEND IS RUNNING")
        print(f"   Response: {resp.json()}")
    else:
        print(f"❌ Backend returned: {resp.status_code}")
        sys.exit(1)
except Exception as e:
    print(f"❌ BACKEND NOT RESPONDING: {e}")
    print("   Fix: start backend with:")
    print("   .venv\\Scripts\\Activate.ps1")
    print("   python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000")
    sys.exit(1)

print()

# Step 2: Check Ollama
print("🔹 STEP 2: Ollama Connection Check")
print("-" * 60)
try:
    resp = requests.get(f"{OLLAMA_URL}/api/tags", timeout=2)
    if resp.status_code == 200:
        models = resp.json().get("models", [])
        tinyllama_found = any("tinyllama" in str(m).lower() for m in models)
        if tinyllama_found:
            print("✅ OLLAMA IS RUNNING WITH TINYLLAMA")
            print(f"   Models: {[m.get('name', 'unknown') for m in models]}")
        else:
            print("⚠️  Ollama is running but TinyLlama not found")
            print("   Fix: ollama pull tinyllama")
    else:
        print(f"❌ Ollama returned: {resp.status_code}")
except Exception as e:
    print(f"⚠️  OLLAMA NOT RESPONDING: {e}")
    print("   Fix: open new terminal and run:")
    print("   ollama run tinyllama")
    print()
    print("   AI features will fail until Ollama is running.")
    print("   Continuing with other tests...")

print()

# Step 3: Test API Health
print("🔹 STEP 3: API Health Endpoint")
print("-" * 60)
try:
    resp = requests.get(f"{BASE_URL}/api/health")
    print(f"✅ GET /api/health")
    print(f"   Status: {resp.status_code}")
    print(f"   Response: {json.dumps(resp.json(), indent=2)}")
except Exception as e:
    print(f"❌ Error: {e}")

print()

# Step 4: Test Root Endpoint
print("🔹 STEP 4: Root Endpoint")
print("-" * 60)
try:
    resp = requests.get(f"{BASE_URL}/")
    print(f"✅ GET /")
    print(f"   Status: {resp.status_code}")
    print(f"   Response: {json.dumps(resp.json(), indent=2)}")
except Exception as e:
    print(f"❌ Error: {e}")

print()

# Step 5: Test Medicine Search
print("🔹 STEP 5: Search Medicines")
print("-" * 60)
try:
    resp = requests.post(
        f"{BASE_URL}/api/search/manual",
        json={"query": "aspirin"},
        timeout=5
    )
    print(f"✅ POST /api/search/manual")
    print(f"   Query: 'aspirin'")
    print(f"   Status: {resp.status_code}")
    data = resp.json()
    if isinstance(data, list):
        print(f"   Found {len(data)} results:")
        for med in data[:3]:
            print(f"     - {med.get('brand_name', 'N/A')} ({med.get('generic_name', 'N/A')})")
    else:
        print(f"   Response: {json.dumps(data, indent=2)}")
except Exception as e:
    print(f"❌ Error: {e}")

print()

# Step 6: Test AI Endpoint
print("🔹 STEP 6: AI Endpoint (TinyLlama)")
print("-" * 60)
try:
    print("   Sending: 'What is aspirin?'")
    print("   Waiting for response...")
    resp = requests.post(
        f"{BASE_URL}/api/ask-ai",
        params={"prompt": "What is aspirin? Briefly explain its uses."},
        timeout=60  # Give it up to 1 minute
    )
    print(f"✅ POST /api/ask-ai")
    print(f"   Status: {resp.status_code}")
    data = resp.json()
    if data.get("success"):
        ai_response = data.get("response", "N/A")
        # Show first 300 chars
        preview = ai_response[:300] + ("..." if len(ai_response) > 300 else "")
        print(f"   ✅ AI Response:")
        print(f"   {preview}")
    else:
        print(f"   ❌ Error: {data.get('error', 'Unknown error')}")
except requests.exceptions.Timeout:
    print(f"❌ Timeout: Ollama took too long (>60s)")
    print("   This usually means: Ollama is loading the model or is overloaded")
except Exception as e:
    print(f"❌ Error: {e}")

print()
print("=" * 60)
print("🎯 SUMMARY")
print("=" * 60)
print()
print("✅ If all tests passed:")
print("   Your pipeline works! Frontend/tester can call it.")
print()
print("❌ If /api/ask-ai failed:")
print("   Make sure Ollama is running:")
print("   > ollama run tinyllama")
print()
print("📊 Next steps:")
print("   1. Open: http://127.0.0.1:8000/docs (Swagger UI)")
print("   2. Test endpoints there")
print("   3. Open: api_tester.html in browser")
print()
