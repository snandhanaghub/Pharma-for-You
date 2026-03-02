# 💊 Pharma4u - Intelligent Medicine Recognition & Verification System

A complete web-based medicine recognition system that combines manual text search with AI-powered OCR for medicine strip image recognition.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.8+-green)
![React](https://img.shields.io/badge/react-18.2-blue)
![FastAPI](https://img.shields.io/badge/fastapi-0.109-teal)

## 🌟 Features

### 1. Manual Text Search
- Search medicines by brand name or generic name
- Fuzzy matching for typo tolerance
- Real-time search results
- Confidence scoring

### 2. Image-Based OCR Recognition
- Upload medicine strip images
- Automatic text extraction using EasyOCR
- Interactive text selection (Google Lens inspired)
- Click on detected text to search

### 3. Comprehensive Medicine Database
- 50+ common medicines
- Detailed information (brand name, generic name, strength, manufacturer, category)
- SQLite database (easily expandable)

### 4. Smart Matching Engine
- RapidFuzz-based fuzzy matching
- Handles OCR errors and typos
- Multiple result ranking by confidence

## 🏗️ Architecture

```
User Interface (React)
        ↓
    Frontend
        ↓
    FastAPI Backend
        ↓
    ┌─────┴─────┐
    ↓           ↓
OCR Module   Database
(EasyOCR)    (SQLite)
    ↓           ↓
Text Cleaning & Matching Engine
    ↓
Results to User
```

## 📋 Requirements

### Backend
- Python 3.8 or higher
- FastAPI
- EasyOCR
- OpenCV
- RapidFuzz
- SQLite3

### Frontend
- Node.js 14 or higher
- React 18
- Axios
- npm or yarn

## 🚀 Installation & Setup

### Step 1: Clone or Navigate to Project

```bash
cd PharmaForYou
```

### Step 2: Backend Setup

```bash
# Navigate to backend folder
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python init_db.py

# Start backend server
python main.py
```

Backend will run on: `http://localhost:8000`

### Step 3: Frontend Setup

Open a **new terminal** window:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will run on: `http://localhost:3000`

## 📱 Usage

### Manual Search
1. Select "Manual Search" tab
2. Type medicine name (e.g., "Paracetamol", "Crocin")
3. Click "Search"
4. View matching results with confidence scores

### Image Upload & OCR
1. Select "Image Upload" tab
2. Click to upload medicine strip image (JPG/PNG)
3. Click "Extract Text" button
4. Click on any detected text box to search
5. View medicine information

## 🔗 API Endpoints

### GET `/`
Health check

### POST `/api/search/manual`
Manual text search
```json
{
  "query": "paracetamol"
}
```

### POST `/api/ocr/extract`
Extract text from image (multipart/form-data)

### POST `/api/search/selected`
Search using OCR selected text
```json
{
  "selected_text": "Crocin"
}
```

### GET `/api/health`
System health check

## 📂 Project Structure

```
PharmaForYou/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── init_db.py           # Database initialization
│   ├── requirements.txt     # Python dependencies
│   ├── pharma.db           # SQLite database (generated)
│   └── README.md
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js          # Main React component
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── components/
│   │   │   ├── ManualSearch.js
│   │   │   ├── ManualSearch.css
│   │   │   ├── ImageUpload.js
│   │   │   ├── ImageUpload.css
│   │   │   ├── OCRResult.js
│   │   │   ├── OCRResult.css
│   │   │   ├── ResultDisplay.js
│   │   │   └── ResultDisplay.css
│   │   └── ...
│   ├── package.json
│   └── README.md
│
└── README.md               # This file
```

## 🎯 For Presentation

The system demonstrates:

✅ **Manual Input Module**
- Text input field
- Validation
- Fuzzy search
- Result display

✅ **OCR Module**
- Image upload
- Text extraction with bounding boxes
- Interactive selection
- Google Lens-inspired UI

✅ **Database Integration**
- 50+ medicines
- Structured data
- Fast querying

✅ **Matching Engine**
- Fuzzy matching
- Confidence scoring
- Multiple results

## 🛠️ Technologies Used

### Backend
- **FastAPI** - Modern web framework
- **EasyOCR** - Text extraction from images
- **OpenCV** - Image processing
- **RapidFuzz** - Fuzzy string matching
- **SQLite** - Lightweight database
- **Pillow** - Image handling

### Frontend
- **React** - UI library
- **Axios** - HTTP client
- **CSS3** - Styling and animations

## 📊 Database Schema

```sql
CREATE TABLE medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_name TEXT NOT NULL,
    generic_name TEXT NOT NULL,
    strength TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    category TEXT NOT NULL
);
```

## 🔮 Future Enhancements

- [ ] AI-based automatic medicine detection
- [ ] Drug interaction checker
- [ ] Prescription validation
- [ ] Multi-language OCR support
- [ ] Voice input
- [ ] Mobile app (React Native)
- [ ] User authentication
- [ ] Medicine inventory management
- [ ] Expiry date detection
- [ ] Barcode/QR code scanning

## 🐛 Troubleshooting

### Backend Issues

**OCR model not loading:**
```bash
# Reinstall EasyOCR
pip uninstall easyocr
pip install easyocr
```

**Port already in use:**
```bash
# Change port in main.py or kill process
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:8000 | xargs kill -9
```

### Frontend Issues

**Dependencies not installing:**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**CORS errors:**
- Ensure backend is running on port 8000
- Check proxy in package.json

## 📝 Notes

- First OCR run will download model (~100MB)
- Use good quality images for best OCR results
- Database can be expanded by modifying `init_db.py`

## 👥 Contributors

Built as part of Software Engineering project demonstrating:
- Full-stack development
- AI/ML integration
- RESTful API design
- Modern UI/UX practices

## 📄 License

This project is for educational purposes.

## ⚠️ Disclaimer

This system is for **educational and demonstration purposes only**. Always consult healthcare professionals before taking any medication.

---

**Built with ❤️ for the Intermediate Presentation**
