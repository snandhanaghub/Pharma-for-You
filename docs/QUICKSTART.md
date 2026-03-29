# � CORE PIPELINE TEST - 3 SIMPLE CHECKS

## Prerequisites
- ✅ Backend running on port 8000
- ✅ Open browser

---

## ✅ CHECK #1: Does Swagger UI open?

**Go to:** http://127.0.0.1:8000/docs

**Expected:** A white page with blue "Swagger UI" title and list of endpoints

**If you see this:**
- ✅ Backend is definitely working
- Continue to CHECK #2

**If page won't load:**
- ❌ Start backend in PowerShell:
```powershell
cd "c:\Users\neera\Downloads\Pharma-for-You"
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

---

## ✅ CHECK #2: Does /api/health work?

**In Swagger UI (from CHECK #1):**

1. Find the green box labeled: `GET /api/health`
2. Click the blue "Try it out" button
3. Click the blue "Execute" button
4. Look at "Server response"

**Expected response:**
```json
{
  "status": "healthy"
}
```

**If you see this:**
- ✅ API is working
- Continue to CHECK #3

**If error:**
- Look at the error message
- Tell me what it says

---

## ✅ CHECK #3: Does /api/ask-ai work?

**In Swagger UI:**

1. Scroll down to red box labeled: `POST /api/ask-ai`
2. Click blue "Try it out" button
3. In the `prompt` field, type: `What is aspirin?`
4. Click blue "Execute" button
5. **IMPORTANT:** Give it up to 60 seconds to respond
6. Look at "Server response"

**Expected response:**
```json
{
  "success": true,
  "response": "Aspirin is a pain reliever and fever reducer... [AI answer]"
}
```

**Scenario A - ✅ SUCCESS:**
```
{
  "success": true,
  "response": "[AI explanation...]"
}
```
→ Your pipeline works! Ollama is connected!

**Scenario B - ❌ CONNECTION ERROR:**
```json
{
  "success": false,
  "error": "Cannot connect to Ollama. Make sure it's running: ollama run tinyllama"
}
```
→ Ollama isn't running. Open new terminal and run:
```bash
ollama run tinyllama
```

**Scenario C - ❌ OTHER ERROR:**
```json
{
  "success": false,
  "error": "[some other error]"
}
```
→ **Tell me the exact error message**

---

## 📋 REPORT BACK:

Reply with:

1. **CHECK #1:** ✅ or ❌ (does /docs open?)
2. **CHECK #2:** ✅ or ❌ (does /api/health respond?)
3. **CHECK #3:** 
   - ✅ Success (AI responded)
   - ❌ Cannot connect to Ollama
   - ❌ Other error: `[paste the error]`

---

## 🚀 Once all 3 pass:

Your core pipeline works!

**Next:**
1. Open `api_tester.html` in browser (drag the file into browser)
2. Test more complex prompts
3. Then we fix anything that's broken
4. React frontend will just be a UI on top

---

**GO DO THESE 3 CHECKS NOW! 👉**
   - Used by `/api/ask-ai` endpoint
   - **START THIS**: If not already running, open new terminal and run:
     ```powershell
     ollama run tinyllama
     ```

---

## 🖥️ Open in Browser

### Main Application
**http://localhost:3000** ← Start here!

### Backend API Documentation (Swagger UI)
**http://127.0.0.1:8000/docs** ← Test endpoints directly

### Backend Health Check
**http://127.0.0.1:8000/api/health** ← Verify backend

---

## 🚀 Main Features to Try

### 1. Check Drug Interactions (AI-Powered)
**Route**: Dashboard → Check Interaction

**What it does**:
- Enter 2 drug names (e.g., "Paracetamol" + "Ibuprofen")
- TinyLlama AI checks for interactions
- Shows severity (None/Minor/Moderate/Severe)
- Provides explanation

**Tech**: Frontend → `/api/ask-ai` → Ollama (TinyLlama)

---

### 2. Scan Medicine Labels (OCR)
**Route**: Dashboard → Check Prescription

**What it does**:
- Upload a medicine label/prescription image
- Backend extracts text using Tesseract
- Searches local medicine database
- Shows matching medicines

**Tech**: Frontend → `/api/analyze-medicine` → Pytesseract + SQLite Search
**Note**: Requires Tesseract system binary (see troubleshooting)

---

### 3. View Dashboard
**Route**: Dashboard (default)

**What it shows**:
- Total checks performed
- Interactions found
- Prescriptions scanned
- Recent activity log

---

## 📊 Full Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    User Browser                          │
│                 http://localhost:3000                    │
└────────────────────────────────────────────────────────┐ │
                                                          │ │
                     React Frontend                       │ │
┌─────────────────────────────────────────────────────────┘ │
│ Pages:                                                    │
│ • LandingPage - Welcome                                  │
│ • LoginPage - Authentication                             │
│ • DashboardPage - User stats                             │
│ • CheckInteractionPage - Drug checker (AI)               │
│ • CheckOCRPage - Prescription scanner                    │
│ • ResultPage - Results display                           │
│ • AccountPage - User settings                            │
└──────────────┬───────────────────────────────────────────┘
               │
               │ HTTP (CORS enabled)
               │
┌──────────────▼───────────────────────────────────────────┐
│          FastAPI Backend (8000)                          │
│       http://127.0.0.1:8000/docs                         │
└──────┬──────┬──────────────┬───────────────┬──────────────┘
       │      │              │               │
    Health   AI Input       OCR Input    Search Input
       │      │              │               │
       ▼      ▼              ▼               ▼
   Status  ┌─────────────┐ ┌─────────────┐ ┌──────────┐
           │   Ollama    │ │ Pytesseract │ │  SQLite  │
           │ TinyLlama   │ │  (Tesseract)│ │ Database │
           └─────────────┘ └─────────────┘ └──────────┘
```

---

## 🔌 API Endpoints Reference

### Health & Info
```
GET http://127.0.0.1:8000/api/health
→ Returns: {"status": "healthy"}

GET http://127.0.0.1:8000/
→ Returns: {"message": "Pharma4u API is running", "version": "1.0.0"}
```

### AI Endpoint (Requires Ollama)
```
POST http://127.0.0.1:8000/api/ask-ai?prompt=What%20is%20aspirin
→ Returns: {"success": true, "response": "Aspirin is..."}
```

### OCR Endpoint (Requires Tesseract)
```
POST http://127.0.0.1:8000/api/ocr
Body: multipart/form-data with image file
→ Returns: {"success": true, "extracted_text": "..."}
```

### Search Endpoint
```
POST http://127.0.0.1:8000/api/search/manual
Body: {"query": "paracetamol"}
→ Returns: [{id, brand_name, generic_name, ...}, ...]
```

### Combo Endpoints
```
POST http://127.0.0.1:8000/api/analyze-medicine
Body: multipart/form-data with image file
→ Returns: {"success": true, "extracted_text": "...", "matching_medicines": [...]}

POST http://127.0.0.1:8000/api/explain-medicine
Body: multipart/form-data with image file
→ Returns: {"success": true, "extracted_text": "...", "explanation": "..."}
```

---

## 🐛 Troubleshooting

### I see "Cannot connect to Ollama"
**Solution**:
1. Open a new terminal
2. Run: `ollama run tinyllama`
3. Wait for model to download and initialize
4. Retry in frontend

### OCR not working / "Tesseract not found"
**Solution**:
1. Download Tesseract: https://github.com/UB-Mannheim/tesseract/wiki
2. Install with default options
3. Verify path: `C:\Program Files\Tesseract-OCR\tesseract.exe`
4. Restart backend if already running

### Frontend shows "API not responding"
**Solution**:
1. Check if backend is still running (should be silent)
2. Verify: http://127.0.0.1:8000/api/health in browser
3. Check backend terminal for errors
4. Restart backend if needed

### Port Already in Use
**If port 3000 (frontend) is taken**:
```bash
# Kill the process using port 3000 and restart
# Or change the port when starting npm
PORT=3001 npm start
```

**If port 8000 (backend) is taken**:
```bash
# Restart the backend with different port
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8001
# Then update frontend .env: REACT_APP_API_URL=http://127.0.0.1:8001
```

### "npm start" fails
**Solution**:
```bash
cd frontend
npm install  # Reinstall dependencies
npm start
```

# Frontend
npm install
```

### Issue: "CORS error in browser"
**Solution:** Ensure backend is running on port 8000

## 🎬 For Presentation

### Demo Flow:
1. **Show Manual Search**
   - Search "Paracetamol"
   - Show multiple results
   - Highlight confidence scores

2. **Show Image Upload**
   - Upload medicine image
   - Extract text
   - Show interactive boxes
   - Click text to search
   - Show results

3. **Highlight Features**
   - Fuzzy matching (try "Paracetmol" with typo)
   - Database (50+ medicines)
   - Interactive UI
   - Real-time processing

## 📊 System Status Check

Run both commands simultaneously:

**Terminal 1 (Backend):**
```powershell
cd backend
.\venv\Scripts\activate
python main.py
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm start
```

✅ **System Ready** when both show:
- Backend: `Uvicorn running on http://0.0.0.0:8000`
- Frontend: `Compiled successfully!`

---

## 🎓 For Evaluation

**Key Points to Mention:**
1. ✅ Complete manual input implementation
2. ✅ OCR integration with EasyOCR
3. ✅ Interactive text selection (Google Lens inspired)
4. ✅ Fuzzy matching for error tolerance
5. ✅ 50+ medicine database
6. ✅ Full-stack architecture (React + FastAPI)
7. ✅ RESTful API design
8. ✅ Responsive UI design

**Live Demonstration Checklist:**
- [ ] Manual search working
- [ ] Image upload working
- [ ] OCR extraction working
- [ ] Text selection working
- [ ] Results displaying correctly
- [ ] Confidence scores showing
- [ ] Multiple results ranking

---

**Need Help?** Check main README.md for detailed documentation.

**Good luck with your presentation! 🚀**
