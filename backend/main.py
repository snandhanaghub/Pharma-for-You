from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pytesseract
from PIL import Image
import io
import requests
from typing import List, Optional
import os
import json
from itertools import combinations
import re
import numpy as np
import cv2

easyocr_reader = None

def get_easyocr_reader():
    global easyocr_reader
    if easyocr_reader is None:
        try:
            print("Loading EasyOCR models (this may take a minute on first run downloading weights)...")
            import easyocr
            easyocr_reader = easyocr.Reader(['en'], gpu=False)
            print("EasyOCR loaded successfully!")
        except Exception as e:
            print(f"Failed to load easyocr logs: {e}")
    return easyocr_reader

def quicksnip_preprocess_and_ocr(image: Image.Image) -> str:
    print("Running QuickSnip preprocessing pipeline...")
    # Convert PIL Image to OpenCV Grayscale
    img_np = np.array(image.convert("RGB"))
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    
    # 1. Upscale if small (QuickSnip logic)
    h, w = gray.shape
    area = w * h
    if area < 40000 or h < 30:
        scale = 4.0 if h < 30 else 2.0
        gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        h, w = gray.shape # Update dimensions
        
    # 2. Check polarity / brightness
    # If mean is too dark (< 0.5 * 255), invert it
    mean_val = np.mean(gray)
    if mean_val < 127.5:
        gray = cv2.bitwise_not(gray)
        
    # 3. Determine PSM
    psm = "7" if (h < 50 or (w/max(h,1)) > 10) else "6"
    custom_config = f'--oem 1 --psm {psm}'
    
    processed_image = Image.fromarray(gray)
    
    try:
        print(f"Executing native Tesseract with config: {custom_config}")
        text = pytesseract.image_to_string(processed_image, config=custom_config).strip()
        
        # 4. Double pass (If < 3 characters found, invert and retry)
        if len(text.replace(" ", "").replace("\\n", "")) < 3:
            print("QuickSnip fallback: Tiny amount of text found, trying inverted polarity array...")
            inverted_gray = cv2.bitwise_not(gray)
            inverted_image = Image.fromarray(inverted_gray)
            text2 = pytesseract.image_to_string(inverted_image, config=custom_config).strip()
            if len(text2.replace(" ", "").replace("\\n", "")) > len(text.replace(" ", "").replace("\\n", "")):
                text = text2
                
        return text
    except Exception as e:
        print(f"QuickSnip Tesseract Pipeline Error: {e}")
        return ""

def perform_ocr(image: Image.Image) -> str:
    print("Starting OCR extraction (QuickSnip priority)...")
    
    # 1. QuickSnip Optimized Pipeline First
    qs_text = quicksnip_preprocess_and_ocr(image)
    if qs_text and len(qs_text) > 3:
        print(f"QuickSnip success! Extracted: {qs_text[:50]}...")
        return qs_text
        
    # 2. Fallback to EasyOCR if QuickSnip missed
    print("QuickSnip OCR returned minimal results, falling back to EasyOCR...")
    try:
        reader = get_easyocr_reader()
        if reader:
            print("Running EasyOCR extraction...")
            img_np = np.array(image.convert("RGB"))
            results = reader.readtext(img_np, detail=0)
            text_result = " ".join(results).strip()
            print(f"EasyOCR success! Extracted: {text_result[:50]}...")
            return text_result
    except Exception as e:
        print(f"EasyOCR error: {e}")
    
    return qs_text # Return whatever QuickSnip got if EasyOCR outright failed

def load_env_file(env_file_path: str):
    if not os.path.exists(env_file_path):
        return
    with open(env_file_path, "r", encoding="utf-8") as env_file:
        for raw_line in env_file:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value

BASE_DIR = os.path.dirname(__file__)
load_env_file(os.path.join(BASE_DIR, "supabase.env"))

app = FastAPI(title="Pharma4u API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") or os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_ALLOPATHY_TABLE = os.getenv("SUPABASE_ALLOPATHY_TABLE", "allopathy")
SUPABASE_AYURVEDA_TABLE = os.getenv("SUPABASE_AYURVEDA_TABLE", "ayurveda")
SUPABASE_INTERACTION_TABLE = os.getenv("SUPABASE_INTERACTION_TABLE", "interaction")

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

class InteractionCheckRequest(BaseModel):
    medicines: List[str]
    description: Optional[str] = None

class InteractionSubmitRequest(BaseModel):
    med1_type: str
    med1_id: Optional[int] = None
    med1_name: Optional[str] = None       # free-text when not in DB
    med2_type: str
    med2_id: Optional[int] = None
    med2_name: Optional[str] = None       # free-text when not in DB
    active_ingredient: Optional[str] = None
    severity: str
    description: str
    source_link: Optional[str] = None
    created_by: Optional[str] = None  # user UUID

class InteractionReviewRequest(BaseModel):
    approved_by: Optional[str] = None  # admin UUID

def supabase_configured():
    return bool(
        SUPABASE_URL
        and SUPABASE_KEY
        and SUPABASE_ALLOPATHY_TABLE
        and SUPABASE_AYURVEDA_TABLE
        and SUPABASE_INTERACTION_TABLE
    )

def supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }

def supabase_get(table: str, params: dict, timeout: int = 15):
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers=supabase_headers(),
            params=params,
            timeout=timeout,
        )
    except Exception as e:
        return [], f"Supabase connection error ({table}): {str(e)}"

    if response.status_code != 200:
        return [], f"Supabase error ({table}): {response.status_code}"

    payload = response.json()
    return payload if isinstance(payload, list) else [], None

def build_medicine_variants(term: str):
    base = (term or "").strip()
    if not base:
        return []
    variants = [base]
    for value in re.findall(r"\(([^)]+)\)", base):
        cleaned = value.strip()
        if cleaned:
            variants.append(cleaned)
    outside = re.sub(r"\([^)]*\)", "", base).strip()
    if outside:
        variants.append(outside)
    return dedupe_preserve_order(variants)

def query_medicine_candidates(term: str, limit: int = 3):
    if not supabase_configured():
        return [], "Supabase is not configured"

    variants = build_medicine_variants(term)
    candidates = []
    candidate_seen = set()
    errors = []

    for variant in variants:
        allopathy_rows, allopathy_error = supabase_get(
            SUPABASE_ALLOPATHY_TABLE,
            {
                "select": "id,name",
                "name": f"ilike.*{variant}*",
                "limit": limit,
            },
        )
        ayurveda_rows, ayurveda_error = supabase_get(
            SUPABASE_AYURVEDA_TABLE,
            {
                "select": "id,name",
                "name": f"ilike.*{variant}*",
                "limit": limit,
            },
        )

        if allopathy_error:
            errors.append(allopathy_error)
        if ayurveda_error:
            errors.append(ayurveda_error)

        for row in allopathy_rows:
            key = f"allopathy:{row.get('id')}"
            if key in candidate_seen:
                continue
            candidate_seen.add(key)
            candidates.append({"type": "allopathy", "id": row.get("id"), "name": row.get("name")})
        for row in ayurveda_rows:
            key = f"ayurveda:{row.get('id')}"
            if key in candidate_seen:
                continue
            candidate_seen.add(key)
            candidates.append({"type": "ayurveda", "id": row.get("id"), "name": row.get("name")})

    if candidates:
        return candidates, None

    if not errors:
        errors.append("No matching medicine rows found")
    return [], " | ".join(errors)

def query_interactions_for_pair(candidate_a: dict, candidate_b: dict, limit: int = 20):
    if not supabase_configured():
        return [], "Supabase is not configured"

    common_params = {
        "select": "id,med1_type,med1_id,med2_type,med2_id,active_ingredient,severity,description,source_link,created_at",
        "limit": limit,
        "status": "eq.approved",  # ✅ Only approved interactions
    }

    rows_forward, error_forward = supabase_get(
        SUPABASE_INTERACTION_TABLE,
        {
            **common_params,
            "med1_type": f"eq.{candidate_a['type']}",
            "med1_id": f"eq.{candidate_a['id']}",
            "med2_type": f"eq.{candidate_b['type']}",
            "med2_id": f"eq.{candidate_b['id']}",
        },
    )

    rows_reverse, error_reverse = supabase_get(
        SUPABASE_INTERACTION_TABLE,
        {
            **common_params,
            "med1_type": f"eq.{candidate_b['type']}",
            "med1_id": f"eq.{candidate_b['id']}",
            "med2_type": f"eq.{candidate_a['type']}",
            "med2_id": f"eq.{candidate_a['id']}",
        },
    )

    combined = rows_forward + rows_reverse
    dedup = {}
    for row in combined:
        dedup[str(row.get("id", json.dumps(row, sort_keys=True, default=str)))] = row

    rows = list(dedup.values())
    if rows:
        return rows, None

    errors = []
    if error_forward:
        errors.append(error_forward)
    if error_reverse:
        errors.append(error_reverse)
    return [], " | ".join(errors) if errors else None

def dedupe_preserve_order(items: List[str]):
    seen = set()
    result = []
    for item in items:
        cleaned = (item or "").strip()
        if not cleaned:
            continue
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        result.append(cleaned)
    return result

def extract_inline_medicines(text: str):
    if not text:
        return []

    normalized = re.sub(r"\s+\+\s+", ",", text)
    normalized = re.sub(r"\s+and\s+", ",", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"[\n;|]", ",", normalized)
    parts = [part.strip() for part in normalized.split(",") if part.strip()]

    cleaned_parts = []
    for part in parts:
        candidate = re.sub(r"^(hey|hi|hello)\b[\s,]*", "", part, flags=re.IGNORECASE).strip()
        candidate = re.sub(r"^(i\s+(took|take|am\s+taking|use|used|have\s+taken|had))\b[\s,:-]*", "", candidate, flags=re.IGNORECASE).strip()
        candidate = re.sub(r"^(please\s+check|check|analyze|analyse)\b[\s,:-]*", "", candidate, flags=re.IGNORECASE).strip()
        if candidate:
            cleaned_parts.append(candidate)

    return dedupe_preserve_order(cleaned_parts)

def extract_medicines_with_llama(text: str):
    if not text:
        return [], "No text provided"
    prompt = (
        "You are a pharmacist assistant. Extract ONLY medicine/drug names from the following text. "
        "Return them as a JSON array of strings. Example: [\"Aspirin\", \"Ibuprofen\"]. "
        "If no medicines found, return []. Do NOT include dosages, instructions, or doctor names. "
        f"Text: {text}"
    )

    print(f"[LLaMA NER] Sending OCR text to TinyLlama: {text[:100]}...")
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "tinyllama",
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.0}
            },
            timeout=60,
        )
        if response.status_code != 200:
            print(f"[LLaMA NER] HTTP error: {response.status_code}")
            return [], f"Llama extraction error: {response.status_code}"
        body = response.json().get("response", "").strip()
        print(f"[LLaMA NER] Raw response: {body}")
        if not body:
            return [], "Llama extraction returned empty response"

        # Try JSON parsing first
        parsed = None
        try:
            parsed = json.loads(body)
        except Exception:
            match = re.search(r"\[[\s\S]*?\]", body)
            if match:
                try:
                    parsed = json.loads(match.group(0))
                except Exception:
                    pass

        if isinstance(parsed, list):
            medicines = [str(item).strip() for item in parsed if str(item).strip()]
            print(f"[LLaMA NER] JSON-parsed medicines: {medicines}")
            return dedupe_preserve_order(medicines), None

        # Fallback: try comma-separated parsing
        print(f"[LLaMA NER] JSON parse failed, trying comma-separated parsing")
        raw_medicines = [m.strip() for m in body.split(",") if m.strip()]
        cleaned = []
        for med in raw_medicines:
            med = re.sub(r'[^A-Za-z0-9 ]+', '', med).strip()
            if med and len(med) > 2:
                cleaned.append(med)
        print(f"[LLaMA NER] Comma-parsed medicines: {cleaned}")
        return dedupe_preserve_order(cleaned), None
    except requests.exceptions.ConnectionError:
        print("[LLaMA NER] Cannot connect to Ollama")
        return [], "Cannot connect to Ollama for medicine extraction"
    except Exception as e:
        print(f"[LLaMA NER] Exception: {e}")
        return [], str(e)

def build_supabase_context(medicines: List[str], per_term_limit: int = 3):
    matched_by_input = {}
    direct_interactions = []
    errors = []
    seen_interaction_ids = set()
    pairwise_interactions = []

    for medicine in medicines:
        rows, error = query_medicine_candidates(medicine, per_term_limit)
        if error:
            errors.append(f"{medicine}: {error}")
            matched_by_input[medicine] = []
            continue
        matched_by_input[medicine] = rows

    medicine_keys = list(matched_by_input.keys())
    for left_key, right_key in combinations(medicine_keys, 2):
        left_candidates = matched_by_input.get(left_key, [])
        right_candidates = matched_by_input.get(right_key, [])
        pair_rows = []
        pair_seen_keys = set()
        pair_errors = []
        for left_candidate in left_candidates:
            for right_candidate in right_candidates:
                rows, pair_error = query_interactions_for_pair(left_candidate, right_candidate)
                if pair_error:
                    pair_errors.append(pair_error)
                for row in rows:
                    row_id = row.get("id")
                    pair_key = str(row_id) if row_id is not None else json.dumps(row, sort_keys=True, default=str)
                    if pair_key not in pair_seen_keys:
                        pair_seen_keys.add(pair_key)
                        pair_rows.append(row)
                    interaction_id = row.get("id")
                    key = str(interaction_id) if interaction_id is not None else json.dumps(row, sort_keys=True, default=str)
                    if key in seen_interaction_ids:
                        continue
                    seen_interaction_ids.add(key)
                    direct_interactions.append(row)

        if pair_errors:
            errors.append(f"{left_key} vs {right_key}: {' | '.join(pair_errors)}")

        descriptions = []
        description_seen = set()
        for row in pair_rows:
            value = (row.get("description") or "").strip()
            if value and value not in description_seen:
                description_seen.add(value)
                descriptions.append(value)

        top_row = pick_primary_interaction(pair_rows) if pair_rows else None
        top_severity = (top_row.get("severity") if top_row else "None") or "None"
        pairwise_interactions.append(
            {
                "pair": [left_key, right_key],
                "rows_found": len(pair_rows),
                "severity": top_severity,
                "interactions": pair_rows,
                "clinical_explanation": " ".join(descriptions[:2]) if descriptions else "No evidence rows found for this pair.",
                "safety_recommendation": build_structured_recommendation(top_row) if top_row else "No evidence-based recommendation available; consult clinician.",
            }
        )

    return matched_by_input, direct_interactions, errors, pairwise_interactions

def summarize_supabase_context(matched_by_input: dict, direct_interactions: List[dict]):
    lines = []

    lines.append("Matched medicines:")
    has_match = False
    for user_input, matches in matched_by_input.items():
        if not matches:
            lines.append(f"- {user_input}: no match")
            continue
        has_match = True
        match_text = ", ".join([f"{item['name']} ({item['type']}#{item['id']})" for item in matches])
        lines.append(f"- {user_input}: {match_text}")

    if not has_match:
        lines.append("- none")

    lines.append("Interaction rows:")
    if not direct_interactions:
        lines.append("- none")
    else:
        for row in direct_interactions:
            lines.append(
                f"- id={row.get('id')} severity={row.get('severity')} ingredient={row.get('active_ingredient') or row.get('ingredient')} description={row.get('description')} source={row.get('source_link')}"
            )

    return "\n".join(lines)

def severity_rank(severity: str):
    ranking = {
        "none": 0,
        "moderate": 1,
        "severe": 2,
        "high": 3,
    }
    return ranking.get((severity or "none").strip().lower(), 0)

def pick_primary_interaction(direct_interactions: List[dict]):
    if not direct_interactions:
        return None
    return sorted(
        direct_interactions,
        key=lambda row: (
            severity_rank(row.get("severity")),
            str(row.get("id", "")),
        ),
        reverse=True,
    )[0]

def build_structured_recommendation(primary_row: dict):
    severity = (primary_row.get("severity") or "Moderate").strip().capitalize()
    if severity in {"High", "Severe"}:
        return "Avoid this combination unless a clinician explicitly approves it; monitor for bleeding/bruising and seek medical advice before use."
    if severity == "Moderate":
        return "Use with caution and clinician guidance; monitor for adverse effects and consider safer alternatives where possible."
    return "No major interaction flagged in current database rows; still verify with a clinician for patient-specific safety."

def map_candidates_to_medicine_response(candidates: List[dict], limit: int = 5):
    mapped = []
    for candidate in candidates[:limit]:
        candidate_id = candidate.get("id")
        mapped.append(
            {
                "id": int(candidate_id) if isinstance(candidate_id, int) or str(candidate_id).isdigit() else 0,
                "brand_name": candidate.get("name") or "",
                "generic_name": candidate.get("name") or "",
                "strength": "",
                "manufacturer": "",
                "category": candidate.get("type") or "",
                "confidence": 1.0,
            }
        )
    return mapped

@app.get("/")
async def root():
    return {"message": "Pharma4u API is running", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "supabase_configured": supabase_configured(),
        "supabase_tables": {
            "allopathy": SUPABASE_ALLOPATHY_TABLE,
            "ayurveda": SUPABASE_AYURVEDA_TABLE,
            "interaction": SUPABASE_INTERACTION_TABLE,
        },
    }

@app.post("/api/ocr", response_model=OCRResponse)
async def extract_text_from_image(file: UploadFile = File(...)):
    """
    Extract text from uploaded medicine image using Tesseract OCR
    """
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        extracted_text = perform_ocr(image)
        
        if not extracted_text or extracted_text == "":
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

@app.post("/api/ask-ai", response_model=AIResponse)
async def ask_tinyllama(prompt: str):
    """
    Send a prompt to TinyLlama AI running via Ollama
    
    Make sure you have Ollama running:
    $ ollama run tinyllama
    """
    try:
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

@app.post("/api/search/manual")
async def manual_search(query: str):
    """Manual text search for medicines (Supabase)"""
    if not query or len(query.strip()) == 0:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    candidates, error = query_medicine_candidates(query, limit=10)
    results = map_candidates_to_medicine_response(candidates, limit=10)
    
    if not results:
        return {
            "success": False,
            "error": error or "No medicines found in Supabase",
            "results": []
        }
    
    return {"success": True, "results": results}

@app.post("/api/search/selected", response_model=List[MedicineResponse])
async def search_selected_text(request: TextSelectionRequest):
    """Search medicines from Supabase using OCR selected text"""
    if not request.selected_text or len(request.selected_text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Selected text cannot be empty")

    candidates, _ = query_medicine_candidates(request.selected_text, limit=10)
    results = map_candidates_to_medicine_response(candidates, limit=10)
    
    if not results:
        raise HTTPException(status_code=404, detail="No medicines found in Supabase matching the selected text")
    
    return results


@app.post("/api/analyze-medicine")
async def analyze_medicine_image(files: List[UploadFile] = File(...)):
    """
    Analyze medicine image: extract text → search Supabase
    """
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")

        combined_text = []
        for file in files:
            if not file.content_type.startswith("image/"):
                continue
            contents = await file.read()
            image = Image.open(io.BytesIO(contents))
            extracted_text = perform_ocr(image)
            if extracted_text:
                combined_text.append(extracted_text)
        
        extracted_text = " ".join(combined_text).strip()
        print(f"[analyze-medicine] OCR extracted text: '{extracted_text}'")
        
        if not extracted_text:
            return {
                "success": False,
                "error": "No text found in image"
            }
        
        all_candidates = []
        
        # Strategy 1: Use LLaMA to intelligently pick medicine names
        llama_extracted, llama_error = extract_medicines_with_llama(extracted_text)
        print(f"[analyze-medicine] LLaMA extracted: {llama_extracted}, error: {llama_error}")
        
        if llama_extracted:
            for med in llama_extracted:
                candidates, _ = query_medicine_candidates(med, limit=3)
                print(f"[analyze-medicine] DB query '{med}' => {len(candidates)} candidates")
                all_candidates.extend(candidates)
        
        # Strategy 2: Also try each significant word from the raw OCR text directly
        # This catches medicines that LLaMA might miss
        words = re.findall(r'\b[A-Za-z]{4,20}\b', extracted_text)
        unique_words = list(set(w.lower() for w in words))
        print(f"[analyze-medicine] Raw word candidates: {unique_words}")
        
        seen_candidate_ids = set(f"{c.get('type')}-{c.get('id')}" for c in all_candidates)
        for word in unique_words[:15]:
            candidates, _ = query_medicine_candidates(word, limit=2)
            for c in candidates:
                cid = f"{c.get('type')}-{c.get('id')}"
                if cid not in seen_candidate_ids:
                    seen_candidate_ids.add(cid)
                    all_candidates.append(c)
                    print(f"[analyze-medicine] Word-search '{word}' found new match: {c.get('name')}")

        search_results = map_candidates_to_medicine_response(all_candidates, limit=10)
        print(f"[analyze-medicine] Final matching_medicines count: {len(search_results)}")
        
        return {
            "success": True,
            "extracted_text": extracted_text,
            "matching_medicines": search_results
        }
    
    except Exception as e:
        print(f"[analyze-medicine] Exception: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/explain-medicine")
async def explain_medicine_from_image(files: List[UploadFile] = File(...)):
    """
    Analyze medicine image and explain using AI:
    1. Extract text from image
    2. Send to TinyLlama for explanation
    """
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        combined_text = []
        for file in files:
            if not file.content_type.startswith("image/"):
                continue
            contents = await file.read()
            image = Image.open(io.BytesIO(contents))
            extracted_text = perform_ocr(image)
            if extracted_text:
                combined_text.append(extracted_text)
                
        extracted_text = " ".join(combined_text).strip()
        
        if not extracted_text:
            return {
                "success": False,
                "error": "No text found in image"
            }
        
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

@app.post("/api/check-interactions")
async def check_drug_interactions(request: InteractionCheckRequest):
    """
    Check for drug interactions using Llama AI (no database required):
    1. Accepts list of medicine names
    2. Uses Llama to understand, validate, and analyze interactions
    3. Returns Llama's assessment of safety, side effects, and recommendations
    
    Database medicines (when provided later) will enhance validation.
    """
    try:
        if not request.medicines or len(request.medicines) == 0:
            raise HTTPException(status_code=400, detail="At least one medicine name is required")

        base_medicines = []
        for item in request.medicines:
            base_medicines.extend(extract_inline_medicines(item))

        text_for_extraction = (request.description or "").strip()
        inline_from_description = extract_inline_medicines(text_for_extraction) if text_for_extraction else []
        explicit_medicines = dedupe_preserve_order(base_medicines + inline_from_description)

        llama_extracted, llama_error = ([], None)
        if len(explicit_medicines) < 2 and text_for_extraction:
            llama_extracted, llama_error = extract_medicines_with_llama(text_for_extraction)

        effective_medicines = explicit_medicines if len(explicit_medicines) >= 2 else dedupe_preserve_order(explicit_medicines + llama_extracted)
        if len(effective_medicines) < 2:
            raise HTTPException(status_code=400, detail="At least two medicine names are required for interaction checks")

        medicines_str = ", ".join(effective_medicines)
        matched_by_input, direct_interactions, supabase_errors, pairwise_interactions = build_supabase_context(effective_medicines)
        evidence_mode = "HAS_EVIDENCE" if len(direct_interactions) > 0 else "NO_EVIDENCE"

        extraction_notes = []
        if supabase_errors:
            extraction_notes.extend(supabase_errors)

        if evidence_mode == "NO_EVIDENCE":
            return {
                "success": True,
                "input_medicines": request.medicines,
                "effective_medicines": effective_medicines,
                "matched_medicines": matched_by_input,
                "direct_interactions": direct_interactions,
                "pairwise_interactions": pairwise_interactions,
                "supabase_rows_found": 0,
                "supabase_lookup_errors": extraction_notes,
                "interaction_analysis": "Insufficient evidence for this combination.",
                "safety_recommendations": "No evidence-based recommendation available; consult clinician.",
                "note": "Supabase-first mode: no interaction rows found. Llama response skipped to prevent unsupported claims."
            }

        primary_interaction = pick_primary_interaction(direct_interactions)
        primary_severity = (primary_interaction.get("severity") or "Moderate").strip().capitalize()
        primary_ingredient = (primary_interaction.get("active_ingredient") or primary_interaction.get("ingredient") or "Unknown ingredient").strip()

        unique_descriptions = []
        seen_descriptions = set()
        for row in direct_interactions:
            description = (row.get("description") or "").strip()
            if description and description not in seen_descriptions:
                seen_descriptions.add(description)
                unique_descriptions.append(description)
        clinical_explanation = " ".join(unique_descriptions[:2]) if unique_descriptions else "Interaction evidence found in database rows."

        # Build a clean medicine name list from the DB matches, not the raw OCR text
        clean_med_names = set()
        for input_name, candidates in matched_by_input.items():
            for c in candidates:
                name = c.get("name", "")
                if name:
                    clean_med_names.add(name)
        # Fallback: if nothing matched from DB, use the effective list but only short clean names
        if not clean_med_names:
            for m in effective_medicines:
                cleaned = re.sub(r'[^A-Za-z\s]', '', m).strip()
                if cleaned and len(cleaned) <= 30:
                    clean_med_names.add(cleaned)
        clean_medicines_str = ", ".join(sorted(clean_med_names)) if clean_med_names else medicines_str

        interaction_summary = (
            f"{clean_medicines_str}: {primary_severity} interaction identified. "
            f"Primary ingredient: {primary_ingredient}."
        )
        recommendation = build_structured_recommendation(primary_interaction)
        
        return {
            "success": True,
            "input_medicines": request.medicines,
            "effective_medicines": effective_medicines,
            "matched_medicines": matched_by_input,
            "direct_interactions": direct_interactions,
            "pairwise_interactions": pairwise_interactions,
            "supabase_rows_found": len(direct_interactions),
            "supabase_lookup_errors": extraction_notes,
            "interaction_analysis": interaction_summary,
            "clinical_explanation": clinical_explanation,
            "safety_recommendations": recommendation,
            "confidence": 95,
            "note": "Supabase-first structured mode. Output is grounded in database evidence rows."
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

# ─── Interaction Submission & Admin Review ────────────────────────────

@app.post("/api/interactions/submit")
async def submit_interaction(req: InteractionSubmitRequest):
    """User submits a new interaction — stored as 'pending'"""
    if not supabase_configured():
        return {"success": False, "error": "Supabase not configured"}

    # ── Resolve custom (not-in-DB) medicines ─────────────────────────────
    def ensure_medicine_id(med_id: Optional[int], med_name: Optional[str], med_type: str) -> tuple:
        """If id is None, upsert the medicine by name and return its real id."""
        if med_id is not None:
            return med_id, None
        if not med_name or not med_name.strip():
            return None, "Medicine name is required when id is not provided"
        table = SUPABASE_ALLOPATHY_TABLE if med_type == "allopathy" else SUPABASE_AYURVEDA_TABLE
        name_clean = med_name.strip()
        # Atomic upsert: insert or do nothing on name conflict, always return id
        try:
            resp = requests.post(
                f"{SUPABASE_URL}/rest/v1/{table}",
                headers={
                    **supabase_headers(),
                    "Content-Type": "application/json",
                    "Prefer": "return=representation,resolution=merge-duplicates",
                },
                json={"name": name_clean},
                timeout=15,
            )
            if resp.status_code in (200, 201):
                rows = resp.json()
                if isinstance(rows, list) and rows:
                    return rows[0]["id"], None
            # Fallback: explicit lookup (handles edge-case where upsert returns 204)
            existing, _ = supabase_get(table, {"select": "id", "name": f"eq.{name_clean}", "limit": 1})
            if existing:
                return existing[0]["id"], None
            return None, f"Could not upsert medicine '{name_clean}': {resp.status_code} {resp.text}"
        except Exception as e:
            return None, str(e)

    med1_id, err1 = ensure_medicine_id(req.med1_id, req.med1_name, req.med1_type)
    if err1:
        return {"success": False, "error": f"Medicine 1: {err1}"}

    med2_id, err2 = ensure_medicine_id(req.med2_id, req.med2_name, req.med2_type)
    if err2:
        return {"success": False, "error": f"Medicine 2: {err2}"}

    payload = {
        "med1_type": req.med1_type,
        "med1_id": med1_id,
        "med2_type": req.med2_type,
        "med2_id": med2_id,
        "active_ingredient": req.active_ingredient or None,
        "severity": req.severity,
        "description": req.description,
        "source_link": req.source_link or None,
        "status": "pending",
    }
    if req.created_by:
        payload["created_by"] = req.created_by

    try:
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/{SUPABASE_INTERACTION_TABLE}",
            headers={**supabase_headers(), "Content-Type": "application/json", "Prefer": "return=representation"},
            json=payload,
            timeout=15,
        )
        if resp.status_code in (200, 201):
            rows = resp.json()
            return {"success": True, "interaction": rows[0] if isinstance(rows, list) and rows else rows}
        return {"success": False, "error": f"Supabase error {resp.status_code}: {resp.text}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/interactions/pending")
async def get_pending_interactions():
    """Admin: list all pending interactions"""
    if not supabase_configured():
        return {"success": False, "error": "Supabase not configured"}

    rows, error = supabase_get(
        SUPABASE_INTERACTION_TABLE,
        {"select": "*", "status": "eq.pending", "order": "created_at.desc", "limit": 50},
    )
    if error:
        return {"success": False, "error": error, "interactions": []}
    return {"success": True, "interactions": rows}


@app.post("/api/interactions/{interaction_id}/approve")
async def approve_interaction(interaction_id: int, req: InteractionReviewRequest):
    """Admin: approve a pending interaction"""
    if not supabase_configured():
        return {"success": False, "error": "Supabase not configured"}

    update_payload = {"status": "approved"}
    if req.approved_by:
        update_payload["approved_by"] = req.approved_by

    try:
        resp = requests.patch(
            f"{SUPABASE_URL}/rest/v1/{SUPABASE_INTERACTION_TABLE}?id=eq.{interaction_id}",
            headers={**supabase_headers(), "Content-Type": "application/json", "Prefer": "return=representation"},
            json=update_payload,
            timeout=15,
        )
        if resp.status_code == 200:
            rows = resp.json()
            return {"success": True, "interaction": rows[0] if isinstance(rows, list) and rows else rows}
        return {"success": False, "error": f"Supabase error {resp.status_code}: {resp.text}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/interactions/{interaction_id}/reject")
async def reject_interaction(interaction_id: int, req: InteractionReviewRequest):
    """Admin: reject a pending interaction"""
    if not supabase_configured():
        return {"success": False, "error": "Supabase not configured"}

    update_payload = {"status": "rejected"}
    if req.approved_by:
        update_payload["approved_by"] = req.approved_by

    try:
        resp = requests.patch(
            f"{SUPABASE_URL}/rest/v1/{SUPABASE_INTERACTION_TABLE}?id=eq.{interaction_id}",
            headers={**supabase_headers(), "Content-Type": "application/json", "Prefer": "return=representation"},
            json=update_payload,
            timeout=15,
        )
        if resp.status_code == 200:
            rows = resp.json()
            return {"success": True, "interaction": rows[0] if isinstance(rows, list) and rows else rows}
        return {"success": False, "error": f"Supabase error {resp.status_code}: {resp.text}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/medicines/search")
async def search_medicines_list(q: str = "", type: str = ""):
    """Search medicines by name for the submission form dropdowns"""
    if not q or len(q.strip()) < 2:
        return {"success": True, "results": []}
    
    results = []
    tables = []
    if type == "allopathy":
        tables = [SUPABASE_ALLOPATHY_TABLE]
    elif type == "ayurveda":
        tables = [SUPABASE_AYURVEDA_TABLE]
    else:
        tables = [SUPABASE_ALLOPATHY_TABLE, SUPABASE_AYURVEDA_TABLE]
    
    for table in tables:
        rows, _ = supabase_get(table, {"select": "id,name", "name": f"ilike.*{q.strip()}*", "limit": "10"})
        category = "allopathy" if table == SUPABASE_ALLOPATHY_TABLE else "ayurveda"
        for row in rows:
            results.append({"id": row.get("id"), "name": row.get("name"), "type": category})
    
    return {"success": True, "results": results}


@app.get("/api/medicines/lookup")
async def lookup_medicine(id: int, type: str = "allopathy"):
    """Resolve a medicine ID to its name"""
    if not supabase_configured():
        return {"success": False, "error": "Supabase not configured"}
    
    table = SUPABASE_ALLOPATHY_TABLE if type == "allopathy" else SUPABASE_AYURVEDA_TABLE
    rows, error = supabase_get(table, {"select": "id,name", "id": f"eq.{id}", "limit": "1"})
    if rows:
        return {"success": True, "medicine": {"id": rows[0].get("id"), "name": rows[0].get("name"), "type": type}}
    return {"success": False, "error": error or "Not found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
