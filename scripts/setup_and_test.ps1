# ============================================
# Pharma4u Complete Setup & Test Script
# ============================================

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🏥 Pharma4u Setup & Test" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if FastAPI backend is responding
Write-Host "✓ Step 1: Testing FastAPI Backend..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/health' -ErrorAction Stop
    $content = $response.Content | ConvertFrom-Json
    Write-Host "  ✅ Backend is RUNNING" -ForegroundColor Green
    Write-Host "     Response: $($content | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Backend not responding. Starting in 3 seconds..." -ForegroundColor Red
    Write-Host ""
    Start-Sleep -Seconds 3
    
    Write-Host "  🚀 Launching FastAPI backend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit -Command cd c:\Users\neera\Downloads\Pharma-for-You; .\.venv\Scripts\Activate.ps1; python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000"
    
    Write-Host "  ⏳ Waiting 5 seconds for server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Try again
    try {
        $response = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/health' -ErrorAction Stop
        Write-Host "  ✅ Backend is now RUNNING!" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Backend failed to start. Check the new window for errors." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Open a NEW PowerShell terminal and run:" -ForegroundColor White
Write-Host "   $env:USERPROFILE\AppData\Local\Programs\Ollama\ollama.exe run tinyllama" -ForegroundColor Green
Write-Host ""
Write-Host "   OR simply try:" -ForegroundColor Yellow
Write-Host "   ollama run tinyllama" -ForegroundColor Green
Write-Host ""
Write-Host "2️⃣  Once Ollama is running, you can test:" -ForegroundColor White
Write-Host "   • API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "   • Test endpoint: curl http://127.0.0.1:8000/api/health" -ForegroundColor Green
Write-Host ""
Write-Host "3️⃣  The AI endpoint" -ForegroundColor White
Write-Host "   POST http://127.0.0.1:8000/api/ask-ai" -ForegroundColor Green
Write-Host "   Param: prompt='What is paracetamol?'" -ForegroundColor Green
Write-Host ""
Write-Host "4️⃣  Backend endpoints available:" -ForegroundColor White
Write-Host "   • GET  /              - Root info" -ForegroundColor Green
Write-Host "   • GET  /api/health    - Health check" -ForegroundColor Green
Write-Host "   • POST /api/ask-ai    - Ask TinyLlama questions" -ForegroundColor Green
Write-Host "   • POST /api/ocr       - Extract text from medicine images" -ForegroundColor Green
Write-Host "   • POST /api/search/manual      - Search medicine database" -ForegroundColor Green
Write-Host "   • POST /api/analyze-medicine   - OCR + Search combo" -ForegroundColor Green
Write-Host "   • POST /api/explain-medicine   - OCR + AI explanation combo" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Setup Complete! Click the Swagger UI link above to test interactively." -ForegroundColor Green
