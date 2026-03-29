# Pharma4u Backend

FastAPI backend with OCR and medicine matching capabilities.

## Setup

1. Install Python 3.8 or higher

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
python main.py
```

## Supabase Integration

Set these environment variables before starting the backend:

```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_ALLOPATHY_TABLE=allopathy
SUPABASE_AYURVEDA_TABLE=ayurveda
SUPABASE_INTERACTION_TABLE=interaction
```

You can also edit `backend/supabase.env` directly with the same keys. The backend auto-loads this file on startup.

If `SUPABASE_SERVICE_ROLE_KEY` is not set, `SUPABASE_ANON_KEY` is used as fallback.

`/api/check-interactions` now resolves medicines from `allopathy` and `ayurveda`, fetches direct evidence rows from `interaction`, and sends that context to Llama before generating interaction predictions.

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
- Tesseract OCR
- Supabase (PostgreSQL + REST)
- Ollama TinyLlama
