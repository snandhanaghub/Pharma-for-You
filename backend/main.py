from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import easyocr
import cv2
import numpy as np
from rapidfuzz import fuzz, process
import sqlite3
from typing import List, Optional
import io
from PIL import Image
import os

app = FastAPI(title="Pharma4u API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize EasyOCR reader
print("Loading OCR model...")
reader = easyocr.Reader(['en'], gpu=False)
print("OCR model loaded successfully!")

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), "pharma.db")

# Pydantic models
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

class OCRResult(BaseModel):
    text: str
    bbox: List[List[float]]
    confidence: float

class OCRResponse(BaseModel):
    results: List[OCRResult]
    image_width: int
    image_height: int

# Database helper functions
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

# API Routes
@app.get("/")
async def root():
    return {"message": "Pharma4u API is running", "version": "1.0.0"}

@app.post("/api/search/manual", response_model=List[MedicineResponse])
async def manual_search(request: ManualSearchRequest):
    """Manual text search for medicines"""
    if not request.query or len(request.query.strip()) == 0:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    results = search_medicine(request.query)
    
    if not results:
        raise HTTPException(status_code=404, detail="No medicines found matching your query")
    
    return results

@app.post("/api/ocr/extract", response_model=OCRResponse)
async def extract_text_from_image(file: UploadFile = File(...)):
    """Extract text from uploaded medicine strip image"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    img_array = np.array(image)
    
    # Convert to RGB if needed
    if len(img_array.shape) == 2:
        img_array = cv2.cvtColor(img_array, cv2.COLOR_GRAY2RGB)
    elif img_array.shape[2] == 4:
        img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2RGB)
    
    # Get image dimensions
    height, width = img_array.shape[:2]
    
    # Perform OCR
    results = reader.readtext(img_array)
    
    # Filter and format results
    ocr_results = []
    for (bbox, text, conf) in results:
        # Filter out common non-medicine text patterns
        text = text.strip()
        if len(text) < 2:
            continue
        
        # Skip common manufacturing codes and dates
        if any(keyword in text.lower() for keyword in ['mfg', 'exp', 'batch', 'lot', 'lic']):
            continue
        
        # Convert bbox to list format
        bbox_list = [[float(point[0]), float(point[1])] for point in bbox]
        
        ocr_results.append({
            'text': text,
            'bbox': bbox_list,
            'confidence': float(conf)
        })
    
    return {
        'results': ocr_results,
        'image_width': width,
        'image_height': height
    }

@app.post("/api/search/selected", response_model=List[MedicineResponse])
async def search_selected_text(request: TextSelectionRequest):
    """Search medicine database using OCR selected text"""
    if not request.selected_text or len(request.selected_text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Selected text cannot be empty")
    
    results = search_medicine(request.selected_text)
    
    if not results:
        raise HTTPException(status_code=404, detail="No medicines found matching the selected text")
    
    return results

@app.get("/api/health")
async def health_check():
    """Check if API and database are working"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM medicines")
        count = cursor.fetchone()['count']
        conn.close()
        
        return {
            "status": "healthy",
            "database": "connected",
            "medicines_count": count,
            "ocr": "ready"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
