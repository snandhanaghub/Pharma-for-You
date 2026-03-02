# Pharma4u Backend

FastAPI backend with OCR and medicine matching capabilities.

## Setup

1. Install Python 3.8 or higher

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Initialize database:
```bash
python init_db.py
```

4. Run the server:
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### GET /
Health check

### POST /api/search/manual
Manual text search
```json
{
  "query": "paracetamol"
}
```

### POST /api/ocr/extract
Upload image for OCR extraction
- Accepts: image/jpeg, image/png
- Returns: Detected text with bounding boxes

### POST /api/search/selected
Search using OCR selected text
```json
{
  "selected_text": "Crocin"
}
```

### GET /api/health
System health check

## Technologies

- FastAPI
- EasyOCR
- OpenCV
- RapidFuzz (fuzzy matching)
- SQLite
