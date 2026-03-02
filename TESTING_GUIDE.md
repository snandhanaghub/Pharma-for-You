# 🧪 Testing Guide - Pharma4u

## Pre-Test Setup

Ensure both backend and frontend are running:

**Terminal 1 - Backend:**
```powershell
cd backend
.\venv\Scripts\activate
python main.py
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm start
```

---

## Test Suite

### ✅ Test 1: Backend Health Check

**Objective:** Verify backend is running and database is connected

**Steps:**
1. Open browser
2. Navigate to: `http://localhost:8000`
3. Should see: `{"message": "Pharma4u API is running", "version": "1.0.0"}`

**Health Endpoint:**
```
http://localhost:8000/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "medicines_count": 50,
  "ocr": "ready"
}
```

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 2: Frontend Loads

**Objective:** Verify React app loads correctly

**Steps:**
1. Navigate to: `http://localhost:3000`
2. Should see:
   - Header: "💊 Pharma4u"
   - Two tabs: "📝 Manual Search" and "📷 Image Upload"
   - Footer with copyright

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 3: Manual Search - Exact Match

**Objective:** Test exact medicine name search

**Steps:**
1. Click "Manual Search" tab
2. Type: `Crocin`
3. Click "Search"

**Expected Result:**
- Results appear within 2 seconds
- Top result: "Crocin" with 100% confidence
- Shows:
  - Generic Name: Paracetamol
  - Strength: 500mg
  - Manufacturer: GSK
  - Category: Analgesic

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 4: Manual Search - Fuzzy Match

**Objective:** Test fuzzy matching with typos

**Steps:**
1. Clear previous search
2. Type: `Paracetmol` (typo - missing 'a')
3. Click "Search"

**Expected Result:**
- Still finds "Paracetamol" related medicines
- Confidence score: 80-95%
- Multiple results shown

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 5: Manual Search - Generic Name

**Objective:** Test search by generic name

**Steps:**
1. Type: `Ibuprofen`
2. Click "Search"

**Expected Result:**
- Shows medicines like "Brufen", "Combiflam"
- All contain Ibuprofen as generic component
- Results sorted by confidence

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 6: Manual Search - No Results

**Objective:** Test error handling for non-existent medicine

**Steps:**
1. Type: `XyzInvalidMedicine123`
2. Click "Search"

**Expected Result:**
- Error message displayed
- Error: "No medicines found matching your query"
- No results shown

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 7: Manual Search - Empty Input

**Objective:** Test validation for empty search

**Steps:**
1. Leave search box empty
2. Click "Search"

**Expected Result:**
- Error message: "Please enter a medicine name"
- No API call made

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 8: Image Upload - Valid Image

**Objective:** Test image upload functionality

**Steps:**
1. Click "Image Upload" tab
2. Click upload area
3. Select a valid image file (JPG/PNG)

**Expected Result:**
- Image preview shown
- "Extract Text" button appears
- "Change Image" button appears

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 9: OCR Text Extraction

**Objective:** Test OCR processing

**Steps:**
1. With image uploaded (Test 8)
2. Click "Extract Text"

**Expected Result:**
- Loading spinner appears
- Processing takes 3-8 seconds (first time may be longer)
- Detected text overlays appear on image
- Each text has bounding box
- List of detected texts shown below
- Confidence scores displayed

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 10: Interactive Text Selection

**Objective:** Test clickable text boxes (Google Lens style)

**Steps:**
1. After OCR extraction (Test 9)
2. Click on any detected text box
3. Or click on text chip below image

**Expected Result:**
- Selected box highlights differently
- Automatic search triggered
- Medicine results displayed
- Selected text chip highlighted

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 11: Multiple Searches from Same Image

**Objective:** Test searching different texts from same OCR result

**Steps:**
1. After OCR extraction
2. Click first text box → see results
3. Click different text box → see different results

**Expected Result:**
- Each selection triggers new search
- Results update accordingly
- Previous selection deselected

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 12: Image Change/Reset

**Objective:** Test uploading new image

**Steps:**
1. After OCR extraction
2. Click "Upload New Image" or "Change Image"
3. Upload different image

**Expected Result:**
- Previous results cleared
- New image preview shown
- Ready for new OCR extraction

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 13: Tab Switching

**Objective:** Test navigation between tabs

**Steps:**
1. Search in "Manual Search"
2. Switch to "Image Upload"
3. Switch back to "Manual Search"

**Expected Result:**
- Tab switching is smooth
- Previous results cleared on switch
- No errors in console
- UI resets properly

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 14: Responsive Design (Mobile)

**Objective:** Test mobile responsiveness

**Steps:**
1. Press F12 (Developer Tools)
2. Click device toggle (Ctrl+Shift+M)
3. Select "iPhone 12 Pro" or similar
4. Test both manual search and image upload

**Expected Result:**
- Layout adapts to mobile screen
- Buttons stack vertically
- Text readable
- All features functional

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 15: Example Chips

**Objective:** Test quick search chips

**Steps:**
1. In "Manual Search" tab
2. Click "Paracetamol" example chip

**Expected Result:**
- Search input fills with "Paracetamol"
- Can click "Search" or edit text
- Other chips also functional

**Result:** ✅ Pass / ❌ Fail

---

## API Testing (Optional - Using Browser / Postman)

### Test API 1: Manual Search Endpoint

**Request:**
```
POST http://localhost:8000/api/search/manual
Content-Type: application/json

{
  "query": "Aspirin"
}
```

**Expected Response:** 200 OK with medicine array

---

### Test API 2: OCR Extract Endpoint

**Request:**
```
POST http://localhost:8000/api/ocr/extract
Content-Type: multipart/form-data
file: <image file>
```

**Expected Response:** 200 OK with OCR results array

---

### Test API 3: Selected Text Search

**Request:**
```
POST http://localhost:8000/api/search/selected
Content-Type: application/json

{
  "selected_text": "Crocin"
}
```

**Expected Response:** 200 OK with medicine array

---

## Performance Tests

### ⏱️ Performance 1: Manual Search Speed

**Acceptance Criteria:** < 2 seconds response time

**Steps:**
1. Search for "Paracetamol"
2. Measure time from click to results

**Result:** ___ seconds ✅ Pass / ❌ Fail

---

### ⏱️ Performance 2: OCR Processing Speed

**Acceptance Criteria:** < 8 seconds (first run), < 5 seconds (subsequent)

**Steps:**
1. Upload image
2. Click "Extract Text"
3. Measure time to results

**Result:** ___ seconds ✅ Pass / ❌ Fail

---

## Database Tests

### 🗄️ Database 1: Check Record Count

**Command:**
```powershell
cd backend
python -c "import sqlite3; conn = sqlite3.connect('pharma.db'); print('Medicines:', conn.execute('SELECT COUNT(*) FROM medicines').fetchone()[0])"
```

**Expected:** Medicines: 50

**Result:** ✅ Pass / ❌ Fail

---

### 🗄️ Database 2: Sample Query

**Command:**
```powershell
python -c "import sqlite3; conn = sqlite3.connect('pharma.db'); cursor = conn.execute('SELECT brand_name, generic_name FROM medicines LIMIT 5'); [print(row) for row in cursor]"
```

**Expected:** List of 5 medicines

**Result:** ✅ Pass / ❌ Fail

---

## Error Handling Tests

### ❌ Error 1: Invalid Image Upload

**Steps:**
1. Try uploading a .txt file or .pdf

**Expected:** Error message about invalid file type

**Result:** ✅ Pass / ❌ Fail

---

### ❌ Error 2: Backend Down

**Steps:**
1. Stop backend server
2. Try manual search in frontend

**Expected:** Error message displayed gracefully

**Result:** ✅ Pass / ❌ Fail

---

## Browser Console Check

### 🔍 Console Test

**Steps:**
1. Press F12 (Developer Tools)
2. Go to Console tab
3. Perform various operations

**Expected:** 
- No red errors (some warnings OK)
- No CORS errors
- API responses logged

**Result:** ✅ Pass / ❌ Fail

---

## Test Results Summary

Fill in your test results:

| Test # | Test Name | Result | Notes |
|--------|-----------|--------|-------|
| 1 | Backend Health | ⬜ | |
| 2 | Frontend Loads | ⬜ | |
| 3 | Exact Match | ⬜ | |
| 4 | Fuzzy Match | ⬜ | |
| 5 | Generic Name | ⬜ | |
| 6 | No Results | ⬜ | |
| 7 | Empty Input | ⬜ | |
| 8 | Image Upload | ⬜ | |
| 9 | OCR Extraction | ⬜ | |
| 10 | Text Selection | ⬜ | |
| 11 | Multiple Searches | ⬜ | |
| 12 | Image Reset | ⬜ | |
| 13 | Tab Switching | ⬜ | |
| 14 | Responsive | ⬜ | |
| 15 | Example Chips | ⬜ | |

---

## Quick Test Script

Run all basic tests quickly:

```powershell
# Test backend
curl http://localhost:8000/api/health

# Expected: {"status":"healthy",...}
```

For frontend, manually test the UI following tests 2-15.

---

## Troubleshooting Failed Tests

### If Test 1 Fails (Backend Health)
- Check if backend is running
- Check port 8000 not in use
- Verify virtual environment activated
- Check database file exists

### If Test 9 Fails (OCR)
- First run takes longer (downloads model)
- Check internet connection initially
- Try simpler image
- Check console for errors

### If Any Test Shows CORS Error
- Verify backend on port 8000
- Check frontend proxy in package.json
- Restart both servers

---

**Testing Tip:** Test each feature at least twice to ensure consistency!

**Good luck with testing! 🧪**
