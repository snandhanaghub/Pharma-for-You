# 🚀 Quick Start Guide - Pharma4u

## Prerequisites Check

Before starting, ensure you have:
- ✅ Python 3.8+ installed
- ✅ Node.js 14+ and npm installed
- ✅ Internet connection (for downloading OCR models)

## Step-by-Step Setup (5 Minutes)

### 1️⃣ Backend Setup (Terminal 1)

```powershell
# Navigate to backend folder
cd C:\Users\nandh\Downloads\PharmaForYou\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install all dependencies (this may take 2-3 minutes)
pip install -r requirements.txt

# Initialize database with sample medicines
python init_db.py

# Start the backend server
python main.py
```

**Expected Output:**
```
Loading OCR model...
OCR model loaded successfully!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ Backend is ready when you see "Uvicorn running"

### 2️⃣ Frontend Setup (Terminal 2)

Open a NEW PowerShell terminal:

```powershell
# Navigate to frontend folder
cd C:\Users\nandh\Downloads\PharmaForYou\frontend

# Install dependencies (this may take 1-2 minutes)
npm install

# Start React development server
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view pharma4u-frontend in the browser.

  Local:            http://localhost:3000
```

✅ Browser will automatically open `http://localhost:3000`

## 🎯 Testing the System

### Test 1: Manual Search
1. Click on **"📝 Manual Search"** tab
2. Type: `Paracetamol`
3. Click **Search**
4. ✅ Should show multiple matching medicines with confidence scores

### Test 2: Image Upload & OCR
1. Click on **"📷 Image Upload"** tab
2. Prepare a medicine strip image (or download a sample)
3. Click to upload image
4. Click **"Extract Text"** button
5. Wait for text detection (3-5 seconds)
6. Click on any detected text box
7. ✅ Should show matching medicine information

## 📸 Sample Test Searches

Try these medicine names:
- Crocin
- Aspirin
- Azithromycin
- Omeprazole
- Amoxicillin

## ⚡ Quick Commands Reference

### Backend
```powershell
# Start backend
cd backend
.\venv\Scripts\activate
python main.py

# Reinitialize database
python init_db.py
```

### Frontend
```powershell
# Start frontend
cd frontend
npm start
```

## 🔍 Verify Installation

Check if everything is working:

**Backend Health Check:**
Open browser: `http://localhost:8000/api/health`

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "medicines_count": 50,
  "ocr": "ready"
}
```

## 🐛 Common Issues & Solutions

### Issue: "Port 8000 already in use"
**Solution:**
```powershell
# Find and kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <ProcessID> /F
```

### Issue: "OCR model downloading"
**Solution:** Wait 2-3 minutes on first run. EasyOCR downloads ~100MB model.

### Issue: "Module not found"
**Solution:**
```powershell
# Backend
pip install -r requirements.txt

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
