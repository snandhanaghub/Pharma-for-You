from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pytesseract
from PIL import Image
import io
import requests
import sqlite3
from typing import List, Optional
from rapidfuzz import fuzz, process
import os

# =====================================
# FastAPI Setup
# =====================================
app = FastAPI(title="Pharma4u API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================
# Configuration
# =====================================
# Set Tesseract path (IMPORTANT for Windows)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), "pharma.db")

# =====================================
# Pydantic Models
# =====================================
class ManualSearchRequest(BaseModel):
    query: str

class TextSelectionRequest(BaseModel):
    selected_text: str

class MedicineResponse(BaseModel):
    id: int
    brand_name: str
    generic_name: str
    strength: str
    manufacturer: str
    category: str
    confidence: float

class OCRResponse(BaseModel):
    success: bool
    extracted_text: Optional[str] = None
    error: Optional[str] = None

class AIResponse(BaseModel):
    success: bool
    response: Optional[str] = None
    error: Optional[str] = None

# =====================================
# Database Helper Functions
# =====================================
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def search_medicine(query: str, limit: int = 5):
    """Search medicine database with fuzzy matching"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get all medicines
    cursor.execute("SELECT * FROM medicines")
    medicines = cursor.fetchall()
    conn.close()
    
    if not medicines:
        return []
    
    # Prepare data for fuzzy matching
    medicine_list = []
    for med in medicines:
        medicine_list.append({
            'id': med['id'],
            'brand_name': med['brand_name'],
            'generic_name': med['generic_name'],
            'strength': med['strength'],
            'manufacturer': med['manufacturer'],
            'category': med['category'],
            'search_text': f"{med['brand_name']} {med['generic_name']}"
        })
    
    # Perform fuzzy matching
    search_texts = [m['search_text'] for m in medicine_list]
    matches = process.extract(query, search_texts, scorer=fuzz.ratio, limit=limit)
    
    # Build results
    results = []
    for match_text, score, idx in matches:
        if score > 50:  # Minimum confidence threshold
            med = medicine_list[idx]
            results.append({
                'id': med['id'],
                'brand_name': med['brand_name'],
                'generic_name': med['generic_name'],
                'strength': med['strength'],
                'manufacturer': med['manufacturer'],
                'category': med['category'],
                'confidence': score / 100.0
            })
    
    return results

# =====================================
# Health & Root Endpoints
# =====================================
@app.get("/")
async def root():
    return {"message": "Pharma4u API is running", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# =====================================
# OCR Endpoint (Pytesseract)
# =====================================
@app.post("/api/ocr", response_model=OCRResponse)
async def extract_text_from_image(file: UploadFile = File(...)):
    """
    Extract text from uploaded medicine image using Tesseract OCR
    """
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Extract text using Tesseract
        extracted_text = pytesseract.image_to_string(image)
        
        if not extracted_text or extracted_text.strip() == "":
            return {
                "success": False,
                "error": "No text found in image"
            }
        
        return {
            "success": True,
            "extracted_text": extracted_text.strip()
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# =====================================
# TinyLlama Endpoint (Ollama)
# =====================================
@app.post("/api/ask-ai", response_model=AIResponse)
async def ask_tinyllama(prompt: str):
    """
    Send a prompt to TinyLlama AI running via Ollama
    
    Make sure you have Ollama running:
    $ ollama run tinyllama
    """
    try:
        # Call Ollama API
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "tinyllama",
                "prompt": prompt,
                "stream": False
            },
            timeout=30
        )
        
        if response.status_code != 200:
            return {
                "success": False,
                "error": f"Ollama error: {response.status_code}"
            }
        
        data = response.json()
        ai_response = data.get("response", "").strip()
        
        if not ai_response:
            return {
                "success": False,
                "error": "No response from TinyLlama"
            }
        
        return {
            "success": True,
            "response": ai_response
        }
    
    except requests.exceptions.ConnectionError:
        return {
            "success": False,
            "error": "Cannot connect to Ollama. Make sure it's running: ollama run tinyllama"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# =====================================
# Medicine Search Endpoints
# =====================================
@app.post("/api/search/manual")
async def manual_search(query: str):
    """Manual text search for medicines"""
    if not query or len(query.strip()) == 0:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    results = search_medicine(query)
    
    if not results:
        return {"success": False, "error": "No medicines found", "results": []}
    
    return {"success": True, "results": results}

@app.post("/api/search/selected", response_model=List[MedicineResponse])
async def search_selected_text(request: TextSelectionRequest):
    """Search medicine database using OCR selected text"""
    if not request.selected_text or len(request.selected_text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Selected text cannot be empty")
    
    results = search_medicine(request.selected_text)
    
    if not results:
        raise HTTPException(status_code=404, detail="No medicines found matching the selected text")
    
    return results

# =====================================
# Combined: OCR + Search Endpoint
# =====================================
@app.post("/api/analyze-medicine")
async def analyze_medicine_image(file: UploadFile = File(...)):
    """
    Analyze medicine image: extract text → search database
    """
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Step 1: Extract text from image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        extracted_text = pytesseract.image_to_string(image).strip()
        
        if not extracted_text:
            return {
                "success": False,
                "error": "No text found in image"
            }
        
        # Step 2: Search for medicines based on extracted text
        search_results = search_medicine(extracted_text, limit=5)
        
        return {
            "success": True,
            "extracted_text": extracted_text,
            "matching_medicines": search_results
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# =====================================
# Combined: OCR + AI Endpoint
# =====================================
@app.post("/api/explain-medicine")
async def explain_medicine_from_image(file: UploadFile = File(...)):
    """
    Analyze medicine image and explain using AI:
    1. Extract text from image
    2. Send to TinyLlama for explanation
    """
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Step 1: Extract text from image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        extracted_text = pytesseract.image_to_string(image).strip()
        
        if not extracted_text:
            return {
                "success": False,
                "error": "No text found in image"
            }
        
        # Step 2: Ask AI to explain
        prompt = f"Explain the following medicine information: {extracted_text}. Provide uses, dosage, and side effects."
        
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "tinyllama",
                "prompt": prompt,
                "stream": False
            },
            timeout=30
        )
        
        if response.status_code != 200:
            return {
                "success": False,
                "error": "Failed to get AI explanation",
                "extracted_text": extracted_text
            }
        
        ai_response = response.json().get("response", "").strip()
        
        return {
            "success": True,
            "extracted_text": extracted_text,
            "explanation": ai_response
        }
    
    except requests.exceptions.ConnectionError:
        return {
            "success": False,
            "error": "Ollama not running. Start with: ollama run tinyllama"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
