# 🔧 Pharma4u Troubleshooting Guide

## Problem: App Not Working

### Step 1: Check What's Actually Running

Open **3 separate PowerShell terminals** (not nested, completely new windows).

**Terminal 1 - Check Backend:**
```powershell
curl http://127.0.0.1:8000/api/health
```

**Expected output:** `{"status":"healthy"}`

If you see **connection refused** or **timeout**: Backend is NOT running. Proceed to "Start Backend" below.

---

**Terminal 2 - Check Frontend:**
```powershell
netstat -ano | findstr :3000
```

If output is empty: Frontend is NOT running. Proceed to "Start Frontend" below.

---

**Terminal 3 - Check Ollama (Optional):**
```powershell
curl http://localhost:11434/api/tags
```

If this fails: AI features won't work yet. You can still test other features.

---

## Step 2: Start Backend (if not running)

```powershell
cd "c:\Users\neera\Downloads\Pharma-for-You"
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

**Wait for output like:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

✅ **Backend is ready. Leave this window open.**

---

## Step 3: Start Frontend (if not running)

Open a **NEW PowerShell terminal**:

```powershell
cd "c:\Users\neera\Downloads\Pharma-for-You\frontend"
npm start
```

**First time?** If you see errors about missing dependencies:
```powershell
npm install
npm start
```

**Wait for output like:**
```
Compiled successfully!
Local: http://localhost:3000
```

✅ **Frontend is ready. A browser should open automatically.**

---

## Step 4: Test the App

1. **Open** http://localhost:3000 in your browser
2. **Check browser console** for errors (Press F12 → Console tab)
3. **Try searching** for a medicine like "aspirin"
4. **Check Network tab** (F12 → Network) to see if API calls succeed

---

## Common Issues & Fixes

### Issue: "Something is already running on port 3000"

**Kill process on port 3000:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Get the PID from the output (last column), then kill it
taskkill /PID <PID_NUMBER> /F

# Now try npm start again
```

---

### Issue: "Module not found" errors in frontend

```powershell
cd frontend
npm install
npm start
```

---

### Issue: Backend shows "ModuleNotFoundError"

```powershell
cd c:\Users\neera\Downloads\Pharma-for-You
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

---

### Issue: "Cannot GET /" or blank page

1. **Backend not running** → See "Start Backend" above
2. **CORS error in console** → Check that backend is on `127.0.0.1:8000` not `localhost:8000`
3. **Invalid localhost** → Use `http://localhost:3000` not `127.0.0.1:3000`

---

### Issue: Backend responds but frontend won't connect

**Check frontend API configuration:**
```javascript
// In frontend/src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
```

Should be `127.0.0.1` (not `localhost`)

---

## Verify Everything Works

### Quick 5-Minute Test:

1. **Terminal 1:** Start backend
```powershell
cd "c:\Users\neera\Downloads\Pharma-for-You"
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

2. **Terminal 2:** Test health endpoint
```powershell
# Wait 3 seconds for backend to start
Start-Sleep -Seconds 3
curl http://127.0.0.1:8000/api/health
```

Should see: `{"status":"healthy"}`

3. **Terminal 3:** Start frontend
```powershell
cd "c:\Users\neera\Downloads\Pharma-for-You\frontend"
npm start
```

4. **Browser:** Open http://localhost:3000

Should see landing page with "AI-Powered Drug Interaction Intelligence"

---

## Enable AI Features (Ollama)

In a **new terminal**:
```powershell
ollama run tinyllama
```

Then refresh the browser and AI endpoints will work!

---

## What Should Work

- ✅ See landing page at http://localhost:3000
- ✅ Click "Check Interaction" and search for medicines
- ✅ Results should appear from database
- ✅ View API docs at http://127.0.0.1:8000/docs
- ✅ Try endpoints in Swagger UI
- ✅ (Optional) Once Ollama runs: Ask TinyLlama questions

---

## Debug Checklist

- [ ] `curl http://127.0.0.1:8000/api/health` returns `{"status":"healthy"}`
- [ ] `npm start` says "Compiled successfully!"
- [ ] Browser shows http://localhost:3000 (not blank)
- [ ] Browser console (F12) has no red errors
- [ ] Can search for medicines and see results
- [ ] API docs load at http://127.0.0.1:8000/docs

---

## If You're Still Stuck

**Tell me:**
1. What error message do you see?
2. Which terminal - frontend or backend?
3. What URL are you trying to open?
4. What do you see in the browser console (F12)?

**Run this diagnostic:**
```powershell
echo "=== Checking Backend ===" 
curl http://127.0.0.1:8000/api/health

echo "`n=== Checking Node ===" 
node --version

echo "`n=== Checking NPM ===" 
npm --version

echo "`n=== Checking Python ===" 
python --version

echo "`n=== Checking Pip Packages ===" 
pip list | findstr fastapi

echo "`n=== Done ===" 
```

Then share the output with me!

---

**Remember:**
- 🟦 Backend = Python/FastAPI (port 8000)
- 🟪 Frontend = React/Node (port 3000)  
- 🟨 AI = Ollama (port 11434, optional)

Keep all 3 terminals open while working!
