# 📁 Project Structure

## Overview
Pharma4U — Intelligent Medicine Recognition & Verification System

```
Pharma-for-You/
│
├── 🖥️ backend/                    # FastAPI backend service
│   ├── main.py                    # Main API server (routes, logic)
│   ├── init_db.py                 # Database initialisation
│   ├── install_tinyllama.py       # TinyLLaMA setup helper
│   ├── dbreference.txt            # DB schema reference notes
│   ├── requirements.txt           # Python dependencies
│   └── supabase.env               # Supabase credentials (gitignored)
│
├── 🌐 frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Page-level components
│   │   ├── context/               # React context providers
│   │   ├── services/              # API service layer
│   │   ├── styles/                # Global styles
│   │   └── lib/                   # Frontend utilities
│   ├── public/                    # Static assets
│   ├── package.json
│   └── .env.example               # Environment variable template
│
├── 🔍 ocr-overlay/                # QML-based screen overlay & OCR utility
│   ├── assets/                    # Icons and static assets
│   ├── components/                # QML UI components
│   │   ├── RegionSelector.qml     # Screen region selection
│   │   ├── WordOverlay.qml        # Word detection overlay
│   │   └── Settings.qml           # Settings panel
│   ├── modes/                     # OCR capture modes
│   │   ├── LensMode.qml
│   │   ├── OcrMode.qml
│   │   └── SelectMode.qml
│   ├── shaders/                   # GLSL/QSB shaders for dimming
│   └── shell.qml                  # Main QML shell
│
├── 📚 docs/                       # Documentation & Guides
│   ├── README.md                  # Main project documentation
│   ├── QUICKSTART.md              # Quick setup guide
│   ├── DESIGN_IMPLEMENTATION.md   # Design system & components
│   └── PRESENTATION_GUIDE.md      # Demo script & presentation
│
├── 🧪 tests/                      # Test files & utilities
│   ├── test_api.py                # API endpoint tests
│   ├── test_pipeline.py           # Pipeline validation tests
│   ├── test_llama.py              # LLaMA model tests
│   ├── test_all_endpoints.py      # Comprehensive endpoint tests
│   ├── test_quick.bat             # Quick test batch script
│   └── api_tester.html            # Interactive API testing UI
│
├── 🛠️ scripts/                    # Utility & automation scripts
│   ├── check_servers.js           # Server status checker
│   ├── verify_system.py           # System verification utility
│   └── setup_and_test.ps1         # Setup & testing automation
│
├── ⚙️ config/                     # Configuration & initialisation
│   └── init_medicines.py          # Medicine database seeding
│
├── PROJECT_STRUCTURE.md           # This file
└── .gitignore
```

## Directory Descriptions

### 🖥️ `/backend`
The FastAPI server powering the application:
- REST API endpoints for OCR, medicine lookup, and interaction checking
- Supabase integration for authentication and data storage
- TinyLLaMA integration for drug interaction analysis

### 🌐 `/frontend`
The React single-page application:
- Multi-page layout with routing
- OCR upload, manual search, interaction checker, and chat assistant
- Admin dashboard for reviewing submitted interactions

### 🔍 `/ocr-overlay`
A Qt/QML-based desktop screen overlay utility used for on-screen OCR capture:
- Region-selection, lens, and standard OCR modes
- GLSL shaders for screen dimming effects
- Word overlay rendering for detected text

### 📚 `/docs`
All project documentation:
- Full README with features and architecture overview
- QUICKSTART guide for rapid setup
- Design implementation notes
- Presentation demo script

### 🧪 `/tests`
All test files and testing utilities:
- API and endpoint tests
- Pipeline and model validation
- Interactive API tester (HTML)

### 🛠️ `/scripts`
Automation and utility scripts:
- Server health checks
- System verification
- Setup automation

### ⚙️ `/config`
Configuration and initialisation files:
- Medicine database seeding script

## Quick Start

1. **Setup Backend**: `cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt`
2. **Initialise Database**: `python ../config/init_medicines.py`
3. **Start Backend**: `python main.py`
4. **Setup Frontend**: `cd ../frontend && npm install && npm start`

For detailed instructions, see [docs/QUICKSTART.md](docs/QUICKSTART.md)

## Documentation Map

| Document | Purpose |
|----------|---------|
| [docs/README.md](docs/README.md) | Full project overview, features, API docs |
| [docs/QUICKSTART.md](docs/QUICKSTART.md) | Installation & setup instructions |
| [docs/DESIGN_IMPLEMENTATION.md](docs/DESIGN_IMPLEMENTATION.md) | UI/UX design system & components |
| [docs/PRESENTATION_GUIDE.md](docs/PRESENTATION_GUIDE.md) | Demo script for presentations |
