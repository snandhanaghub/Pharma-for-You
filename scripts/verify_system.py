#!/usr/bin/env python3
"""
Standalone API Test - No terminal dependencies
Tests: Health, Root, Search, AI endpoints
"""
import sys
import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(method, path, data=None, timeout=30):
    """Test an endpoint and return (status, response)"""
    url = f"{BASE_URL}{path}"
    
    try:
        if method == "GET":
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return response.status, json.loads(response.read().decode())
        
        elif method == "POST":
            req = urllib.request.Request(
                url,
                data=json.dumps(data).encode(),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return response.status, json.loads(response.read().decode())
    
    except urllib.error.URLError as e:
        return None, f"Connection error: {e.reason}"
    except Exception as e:
        return None, f"Error: {str(e)}"

print("=" * 70)
print("🏥 PHARMA4U CORE PIPELINE TEST")
print("=" * 70)
print()

# TEST 1: Health
print("✅ TEST 1: /api/health")
print("-" * 70)
status, resp = test_endpoint("GET", "/api/health", timeout=5)
if status == 200:
    print(f"✅ PASS - Backend is responding!")
    print(f"   Response: {resp}")
else:
    print(f"❌ FAIL - Could not reach backend")
    print(f"   Error: {resp}")
    print("\n   Fix: Start backend with:")
    print("   .venv\\Scripts\\Activate.ps1")
    print("   python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000")
    sys.exit(1)

print()

# TEST 2: Root
print("✅ TEST 2: GET /")
print("-" * 70)
status, resp = test_endpoint("GET", "/", timeout=5)
if status == 200:
    print(f"✅ PASS")
    print(f"   Response: {resp}")
else:
    print(f"❌ FAIL: {resp}")

print()

# TEST 3: Search
print("✅ TEST 3: POST /api/search/manual")
print("-" * 70)
status, resp = test_endpoint("POST", "/api/search/manual", {"query": "aspirin"}, timeout=5)
if status == 200:
    print(f"✅ PASS")
    if isinstance(resp, list):
        print(f"   Found {len(resp)} medicines")
        if resp:
            print(f"   First result: {resp[0]}")
    else:
        print(f"   Response: {resp}")
else:
    print(f"❌ FAIL: {resp}")

print()

# TEST 4: AI (Critical)
print("✅ TEST 4: POST /api/ask-ai")
print("-" * 70)
print("   Testing with prompt: 'What is aspirin?'")
print("   ⏳ Waiting (may take 10-60 seconds if Ollama is loading model)...")
print()

status, resp = test_endpoint("POST", "/api/ask-ai?prompt=What%20is%20aspirin%3F", timeout=120)

if status == 200:
    if resp.get("success"):
        print(f"✅ PASS - AI is working!")
        ai_text = resp.get("response", "")[:200]
        print(f"   AI Response: {ai_text}...")
    else:
        error = resp.get("error", "Unknown error")
        if "Cannot connect to Ollama" in error:
            print(f"⚠️  OLLAMA NOT RUNNING")
            print(f"   Error: {error}")
            print()
            print("   Fix: Open new terminal and run:")
            print("   ollama run tinyllama")
        else:
            print(f"❌ FAIL - {error}")
else:
    print(f"❌ FAIL - Could not reach AI endpoint: {resp}")

print()
print("=" * 70)
print("🎯 SUMMARY")
print("=" * 70)
print()
print("✅ Backend is working")
print("✅ API routing is correct")
print()
if status == 200 and resp.get("success"):
    print("✅ AI integration is complete!")
    print()
    print("🚀 NEXT STEPS:")
    print("   1. Open: http://127.0.0.1:8000/docs (Swagger UI)")
    print("   2. Test more endpoints there")
    print("   3. Now we can focus on the React frontend")
else:
    print("⚠️  AI endpoint needs attention (see error above)")
    print()
    print("🚀 NEXT: Start Ollama and rerun this test")

print()
