#!/usr/bin/env python
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

print("🧪 Testing Pharma4u API\n")

# Test 1: Health Check
print("1️⃣  Testing /api/health...")
try:
    response = requests.get(f"{BASE_URL}/api/health", timeout=5)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}\n")
except Exception as e:
    print(f"   ❌ Error: {e}\n")

# Test 2: Root Endpoint
print("2️⃣  Testing / (root)...")
try:
    response = requests.get(f"{BASE_URL}/", timeout=5)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}\n")
except Exception as e:
    print(f"   ❌ Error: {e}\n")

# Test 3: Ask AI (TinyLlama via Ollama)
print("3️⃣  Testing /api/ask-ai (TinyLlama)...")
print("   Prompt: 'What is paracetamol and its uses?'\n")
try:
    response = requests.post(
        f"{BASE_URL}/api/ask-ai",
        params={"prompt": "What is paracetamol and its uses?"},
        timeout=60  # Give it more time
    )
    print(f"   Status: {response.status_code}")
    data = response.json()
    print(f"   Success: {data.get('success')}")
    if data.get('success'):
        print(f"   Response: {data.get('response', '')[:200]}...")
    else:
        print(f"   Error: {data.get('error')}")
    print()
except Exception as e:
    print(f"   ❌ Error: {e}\n")

print("✅ Tests completed!")
