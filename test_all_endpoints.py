import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8001"

def test_endpoint(method, endpoint, data=None, description=""):
    """Test an endpoint and print results"""
    url = f"{BASE_URL}{endpoint}"
    print(f"\n{'='*70}")
    print(f"{'='*70}")
    print(f"TEST: {description}")
    print(f"Method: {method.upper()} | URL: {url}")
    
    try:
        if method == "get":
            response = requests.get(url, timeout=30)
        elif method == "post":
            print(f"Payload: {json.dumps(data, indent=2)}")
            response = requests.post(url, json=data, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response:")
        print(json.dumps(response.json(), indent=2))
        return True
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return False

# TESTS
passed = 0
failed = 0

# Test 1: Root endpoint
if test_endpoint("get", "/", description="Root Info Endpoint"):
    passed += 1
else:
    failed += 1

# Test 2: Health check
if test_endpoint("get", "/api/health", description="Health Check"):
    passed += 1
else:
    failed += 1

# Test 3: AI endpoint with a question
if test_endpoint("post", "/api/ask-ai", 
    data={"prompt": "What is paracetamol used for?"}, 
    description="Ask TinyLlama AI"):
    passed += 1
else:
    failed += 1

# Test 4: Medicine search
if test_endpoint("post", "/api/search/manual",
    data={"medicine_name": "paracetamol"},
    description="Search Medicine Database"):
    passed += 1
else:
    failed += 1

# Test 5: Medicine search (alternate spelling)
if test_endpoint("post", "/api/search/manual",
    data={"medicine_name": "aspirin"},
    description="Search Medicine Database (Aspirin)"):
    passed += 1
else:
    failed += 1

# Test 6: OCR endpoint (will fail if Tesseract not installed)
print("\n" + "="*70)
print("Note: OCR test skipped - requires Tesseract binary installation")
print("To enable: Install Tesseract from https://github.com/UB-Mannheim/tesseract/wiki")

# Summary
print("\n" + "="*70)
print("="*70)
print(f"SUMMARY: {passed} passed, {failed} failed")
print("="*70)
