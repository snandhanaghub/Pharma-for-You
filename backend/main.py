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

# Check Tesseract availability once at import time
TESSERACT_AVAILABLE = False
tesseract_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.path.isfile(tesseract_path):
    TESSERACT_AVAILABLE = True
else:
    # Also check PATH
    import shutil
    tesseract_in_path = shutil.which("tesseract")
    if tesseract_in_path:
        tesseract_path = tesseract_in_path
        TESSERACT_AVAILABLE = True

if TESSERACT_AVAILABLE:
    print(f"Tesseract found at: {tesseract_path}")
else:
    print("WARNING: Tesseract not found — will use EasyOCR only.")

def perform_ocr(image: Image.Image) -> str:
    print("Starting OCR extraction (EasyOCR priority)...")
    
    # 1. Try EasyOCR first (always available, no external binary needed)
    easyocr_text = ""
    try:
        reader = get_easyocr_reader()
        if reader:
            print("Running EasyOCR extraction...")
            img_np = np.array(image.convert("RGB"))
            results = reader.readtext(img_np, detail=0)
            easyocr_text = " ".join(results).strip()
            if easyocr_text and len(easyocr_text) > 3:
                print(f"EasyOCR success! Extracted: {easyocr_text[:50]}...")
                return easyocr_text
    except Exception as e:
        print(f"EasyOCR error: {e}")
    
    # 2. Fallback to QuickSnip/Tesseract if EasyOCR missed and Tesseract is available
    if TESSERACT_AVAILABLE:
        print("EasyOCR returned minimal results, falling back to Tesseract/QuickSnip...")
        qs_text = quicksnip_preprocess_and_ocr(image)
        if qs_text and len(qs_text) > 3:
            print(f"QuickSnip success! Extracted: {qs_text[:50]}...")
            return qs_text
        return qs_text or easyocr_text
    else:
        print("Tesseract not available, returning EasyOCR result (may be empty).")
        return easyocr_text

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

if TESSERACT_AVAILABLE:
    pytesseract.pytesseract.tesseract_cmd = tesseract_path
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
        f"Extract ONLY the medicine or drug names from this text: '{text}'.\n\n"
        "Return ONLY a strictly valid JSON array of strings (e.g., [\"Aspirin\"]). "
        "Do NOT write any python code, explanations, or conversational text. ONLY output the JSON array."
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

def get_medicine_summary_llama(medicine: str) -> str:
    prompt = f"As a pharmacist, provide a very concise, 1-2 sentence definition of the medication '{medicine}'. State its primary use class."
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "tinyllama", "prompt": prompt, "stream": False, "options": {"temperature": 0.1}},
            timeout=10
        )
        if response.status_code == 200:
            return response.json().get("response", "").strip()
    except:
        pass
    return f"{medicine} is a medication or supplement."


# ─────────────────────────────────────────────────────────
#  HYBRID SEVERITY ENGINE v2
#  AI extracts clinical signals ──► Algorithm scores severity
# ─────────────────────────────────────────────────────────

def extract_signals_with_llama(combined_snippets: str, medicines: List[str]) -> dict:
    """Uses TinyLlama to extract structured clinical signals from web snippets."""
    meds_str = ", ".join(medicines)
    prompt = (
        f"Analyze the following medical snippets regarding the interaction between {meds_str}.\n"
        f"Extract exactly three signals in JSON format:\n"
        f"1. mechanism: one of ['additive', 'enzyme', 'pharmacodynamic', 'unknown']\n"
        f"2. outcome_severity: one of ['death/life-threatening', 'hospitalization', 'serious organ damage', 'moderate symptoms', 'mild']\n"
        f"3. evidence_level: one of ['FDA/NIH/Meta-analysis', 'clinical study', 'case reports', 'weak/unclear']\n\n"
        f"Snippets:\n{combined_snippets[:1500]}\n\n"
        f"Return ONLY the JSON object. Do not explain. Do not add conversational text."
    )

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "tinyllama", "prompt": prompt, "stream": False, "options": {"temperature": 0.0}},
            timeout=30,
        )
        if response.status_code == 200:
            body = response.json().get("response", "").strip()
            # Clean up potential LLM chatter
            json_match = re.search(r"\{[\s\S]*?\}", body)
            if json_match:
                data = json.loads(json_match.group(0))
                return {
                    "mechanism": str(data.get("mechanism", "unknown")).lower(),
                    "outcome": str(data.get("outcome_severity", "mild")).lower(),
                    "evidence": str(data.get("evidence_level", "weak/unclear")).lower(),
                }
    except Exception as e:
        print(f"[Severity Engine] AI Signal Extraction Error: {e}")
    
    return None # Fallback


def compute_severity(signals: dict) -> dict:
    """Deterministic scoring model based on user-defined weights.
    
    A. Outcome Severity: death (5), hospitalization (4), serious (3), moderate (2), mild (1)
    B. Evidence Score: FDA (3), clinical study (2), case reports (1), weak (0)
    C. Mechanism Score: additive (3), enzyme (2), unknown/pharmacodynamic (1)
    
    Map Score -> Severity (Simplified 2-level UI, 3-level logic):
    10-11: Significant Interaction (Avoid)
    5-9: Significant Interaction (Monitor)
    0-4: No Significant Interaction (Safe)
    """
    
    outcome_map = {
        "death/life-threatening": 5, "death": 5, "fatal": 5,
        "hospitalization": 4, "emergency": 4,
        "serious organ damage": 3, "serious": 3,
        "moderate symptoms": 2, "moderate": 2,
        "mild": 1, "none": 0
    }
    
    evidence_map = {
        "fda/nih/meta-analysis": 3, "fda": 3, "nih": 3, "meta-analysis": 3,
        "clinical study": 2, "study": 2,
        "case reports": 1, "case report": 1,
        "weak/unclear": 0, "weak": 0, "unclear": 0
    }
    
    mechanism_map = {
        "additive": 3, "same pathway": 3,
        "enzyme": 2, "metabolism": 2,
        "pharmacodynamic": 1, "unknown": 1
    }
    
    o_score = outcome_map.get(signals.get("outcome", "mild"), 1)
    e_score = evidence_map.get(signals.get("evidence", "weak/unclear"), 0)
    m_score = mechanism_map.get(signals.get("mechanism", "unknown"), 1)
    
    total = o_score + e_score + m_score
    
    if total >= 10:
        recommendation = "Avoid combination. High risk of serious adverse effects."
    elif total >= 5:
        recommendation = "Use with caution. Monitoring advised."
    else:
        recommendation = "Safe under normal conditions."

    if total >= 5:
        severity = "Significant Interaction"
    else:
        severity = "No Significant Interaction"
        
    return {
        "severity": severity,
        "recommendation": recommendation,
        "score": total,
        "breakdown": {
            "outcome": {"label": signals.get("outcome"), "score": o_score},
            "evidence": {"label": signals.get("evidence"), "score": e_score},
            "mechanism": {"label": signals.get("mechanism"), "score": m_score},
        }
    }


def _build_scoring_from_raw(outcome_score: int, mechanism_score: int, evidence_score: int, scan_res: dict) -> dict:
    """Build a scoring result directly from raw keyword-scanner numeric scores.
    This bypasses the label→score mapping in compute_severity, which can fail
    when keyword labels (e.g. 'ulcer', 'fda') don't match the AI vocabulary."""
    total = outcome_score + mechanism_score + evidence_score
    if total >= 10:
        recommendation = "Avoid combination. High risk of serious adverse effects."
    elif total >= 5:
        recommendation = "Use with caution. Monitoring advised."
    else:
        recommendation = "Safe under normal conditions."

    if total >= 5:
        severity = "Significant Interaction"
    else:
        severity = "No Significant Interaction"

    return {
        "severity": severity,
        "recommendation": recommendation,
        "score": total,
        "breakdown": {
            "outcome": {"label": scan_res.get("outcome_label", "unknown"), "score": outcome_score},
            "evidence": {"label": scan_res.get("evidence_label", "unknown"), "score": evidence_score},
            "mechanism": {"label": scan_res.get("mechanism_label", "unknown"), "score": mechanism_score},
        }
    }


# Keyword dictionaries for deterministic snippet scanning
OUTCOME_KEYWORDS = {
    5: [  # Life-threatening / Death
        "death", "fatal", "fatality", "life-threatening", "life threatening",
        "cardiac arrest", "myocardial infarction",
        "cerebral hemorrhage", "intracranial bleeding", "anaphylaxis",
        "respiratory failure", "organ failure",
    ],
    4: [  # Hospitalization
        "hospitalization", "hospitalisation", "emergency room", "emergency department",
        "icu", "intensive care", "transfusion", "surgery required",
        "internal bleeding",
        "major bleeding", "hemorrhage", "haemorrhage", "renal failure",
        "kidney failure", "liver damage", "hepatotoxicity",
    ],
    3: [  # Serious
        "serious", "significant risk",
        "gastrointestinal bleeding", "gi bleeding",
        "bleeding risk", "blood thinner", "anticoagulant",
        "increased risk of bleeding", "prolonged bleeding", "bruising",
        "hypertension", "high blood pressure", "kidney damage", "nephrotoxicity",
        "serotonin syndrome", "seizure", "arrhythmia",
    ],
    2: [  # Moderate
        "moderate", "caution", "monitor", "reduced efficacy",
        "ulcer", "stomach ulcer", "peptic ulcer",
        "decreased effectiveness", "nausea", "vomiting", "dizziness",
        "headache", "drowsiness", "interaction", "may interact",
        "should not be taken together", "avoid combining",
    ],
}

MECHANISM_KEYWORDS = {
    "additive": [
        "additive", "same pathway", "both inhibit", "both affect",
        "dual antiplatelet", "combined effect", "synergistic",
        "both nsaid", "both anti-inflammatory", "both blood thinner",
        "cox-1", "cox-2", "cyclooxygenase", "platelet",
        "prostaglandin", "antiplatelet", "anticoagulant",
        "nsaid", "nonsteroidal", "anti-inflammatory",
        "gastrointestinal", "combined irritant", "irritant effects",
    ],
    "enzyme": [
        "cyp", "enzyme", "metabolism", "inhibitor", "inducer",
        "p450", "cyp2c9", "cyp3a4", "cyp2d6", "pharmacokinetic",
        "absorption", "bioavailability", "clearance",
    ],
    "pharmacodynamic": [
        "pharmacodynamic", "receptor", "same mechanism",
        "competitive", "antagonist", "agonist",
    ],
}

EVIDENCE_KEYWORDS = {
    3: [  # Strong — regulatory / authoritative
        "fda", "nih", "who", "ema", "mhra", "cdc",
        "black box warning", "boxed warning", "contraindicated",
        "meta-analysis", "systematic review", "clinical trial",
        "well-documented", "well documented", "established interaction",
        "clinical guideline", "drug label", "prescribing information",
    ],
    2: [  # Moderate
        "clinical study", "clinical studies", "research shows",
        "evidence suggests", "studies indicate", "documented",
        "known interaction", "reported cases", "peer-reviewed",
        "randomized", "controlled trial",
    ],
    1: [  # Weak
        "case report", "case study", "anecdotal", "may cause",
        "possible interaction", "theoretical", "limited data",
        "insufficient evidence", "unclear",
    ],
}


def scan_snippets_for_signals(snippet_text: str) -> dict:
    """Deterministic keyword scanner — analyzes raw web snippets for clinical
    danger signals WITHOUT relying on LLM interpretation."""
    text_lower = snippet_text.lower()

    # ── Outcome score ──
    outcome_score = 1
    outcome_label = "mild"
    for score in sorted(OUTCOME_KEYWORDS.keys(), reverse=True):
        for keyword in OUTCOME_KEYWORDS[score]:
            if keyword in text_lower:
                if score > outcome_score:
                    outcome_score = score
                    outcome_label = keyword
                break
        if outcome_score >= score:
            break

    # ── Mechanism score ──
    mechanism_score = 1
    mechanism_label = "unknown"
    # Additive = 3, enzyme = 2, pharmacodynamic = 2, unknown = 1
    for mech_type, keywords in MECHANISM_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                if mech_type == "additive":
                    mechanism_score = max(mechanism_score, 3)
                    mechanism_label = "additive"
                elif mech_type in ("enzyme", "pharmacodynamic"):
                    mechanism_score = max(mechanism_score, 2)
                    if mechanism_label != "additive":
                        mechanism_label = mech_type
                break

    # ── Evidence score ──
    evidence_score = 0
    evidence_label = "unknown"
    for score in sorted(EVIDENCE_KEYWORDS.keys(), reverse=True):
        for keyword in EVIDENCE_KEYWORDS[score]:
            if keyword in text_lower:
                if score > evidence_score:
                    evidence_score = score
                    evidence_label = keyword
                break
        if evidence_score >= score:
            break

    return {
        "outcome_score": outcome_score,
        "outcome_label": outcome_label,
        "mechanism_score": mechanism_score,
        "mechanism_label": mechanism_label,
        "evidence_score": evidence_score,
        "evidence_label": evidence_label,
    }


def compute_severity_legacy(outcome_score: int, mechanism_score: int, evidence_score: int) -> str:
    """Deterministic severity from composite score.
       Total = Outcome (1-5) + Mechanism (1-3) + Evidence (0-3)  →  range 2-11
       ≥ 8  → Severe
       5-7  → Moderate
       3-4  → Mild
       0-2  → None
    """
    total = outcome_score + mechanism_score + evidence_score
    if total >= 8:
        return "Severe"
    elif total >= 5:
        return "Moderate"
    elif total >= 3:
        return "Mild"
    return "None"


def search_medical_literature_with_llama(medicines: List[str]) -> dict:
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        return {"severity": "None", "recommendation": "", "summary": "Warning: beautifulsoup4 not installed."}

    meds_str = " ".join(medicines)
    if len(medicines) == 1:
        query = f"{meds_str} clinical safety adverse effects profile"
    else:
        query = f"{meds_str} drug interaction clinical safety"
    print(f"[Web Research] Query: {query}")

    # ── Stage 1: Scrape web snippets ──
    snippets = []
    source_links = []
    try:
        url = 'https://html.duckduckgo.com/html/'
        headers = {'User-Agent': 'Mozilla/5.0'}
        res = requests.post(url, data={'q': query}, headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')

        for result in soup.find_all('div', class_='result__body')[:5]:
            snip = result.find('a', class_='result__snippet')
            if snip:
                snippets.append(f"Snippet: {snip.text}")
            link = result.find('a', class_='result__url')
            if link and link.get('href'):
                href = link.get('href')
                if href.startswith('//'):
                    href = 'https:' + href
                source_links.append(f"\n- {href}")
    except Exception as e:
        print(f"[Web Research] HTML search failed: {e}")
        return {"severity": "None", "summary": "Web search failed.", "recommendation": "Consult clinician."}

    if not snippets:
        return {"severity": "None", "summary": f"No literature found for {', '.join(medicines)}.", "recommendation": ""}

    combined_text = "\n\n".join(snippets)

    # ── Stage 2: Keywords ALWAYS run (reliable baseline) ──
    scan_res = scan_snippets_for_signals(combined_text)
    kw_outcome = scan_res["outcome_score"]
    kw_mechanism = scan_res["mechanism_score"]
    kw_evidence = scan_res["evidence_score"]
    print(f"[Severity Engine] Keyword scan: outcome={kw_outcome}/{scan_res['outcome_label']}, "
          f"mechanism={kw_mechanism}/{scan_res['mechanism_label']}, "
          f"evidence={kw_evidence}/{scan_res['evidence_label']}")

    # Try AI extraction as enhancement
    ai_signals = extract_signals_with_llama(combined_text, medicines)
    if ai_signals:
        print(f"[Severity Engine] AI signals: {ai_signals}")
        ai_scoring = compute_severity(ai_signals)
        # Use AI score only if it's HIGHER than keyword score (AI may find nuance)
        kw_total = kw_outcome + kw_mechanism + kw_evidence
        if ai_scoring["score"] > kw_total:
            print(f"[Severity Engine] AI score ({ai_scoring['score']}) > keyword score ({kw_total}), using AI")
            scoring_res = ai_scoring
        else:
            print(f"[Severity Engine] Keyword score ({kw_total}) >= AI score ({ai_scoring['score']}), using keywords")
            scoring_res = compute_severity({
                "outcome": scan_res["outcome_label"],
                "evidence": scan_res["evidence_label"],
                "mechanism": scan_res["mechanism_label"],
            })
            # If label-based mapping fails (unknown keyword), fallback to raw scores
            if scoring_res["score"] < kw_total:
                scoring_res = _build_scoring_from_raw(kw_outcome, kw_mechanism, kw_evidence, scan_res)
    else:
        print("[Severity Engine] AI extraction failed, using keyword scores directly")
        scoring_res = _build_scoring_from_raw(kw_outcome, kw_mechanism, kw_evidence, scan_res)

    print(f"[Severity Engine] Final: {scoring_res['severity']} (Score: {scoring_res['score']})")

    # ── Stage 3: LLM summarization (for human-readable output) ──
    prompt_type = "single drug clinical safety profile" if len(medicines) == 1 else "interaction summary"
    prompt = (
        f"You are a clinical pharmacist. Based ONLY on these snippets, write a clinical summary of the {prompt_type} for {', '.join(medicines)}.\n\n"
        f"Snippets:\n{combined_text[:2000]}\n\n"
        "Output EXACTLY in this format:\n"
        "Recommendation: [One actionable sentence]\n"
        "Summary: [2-3 sentence clinical summary]\n\n"
        "Response:"
    )

    summary_out = ""
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "tinyllama", "prompt": prompt, "stream": False, "options": {"temperature": 0.0}},
            timeout=40,
        )
        if response.status_code == 200:
            summary_out = response.json().get("response", "").strip()
    except Exception as e:
        print(f"[Severity Engine] LLM summary exception: {e}")

    rec_match = re.search(r"Recommendation:\s*([^\n]+)", summary_out, re.IGNORECASE)
    sum_match = re.search(r"Summary:\s*(.+?)(?=\n(?:Recommendation:|$)|$)", summary_out, re.IGNORECASE | re.DOTALL)

    rec_text = rec_match.group(1).strip() if rec_match else "Consult your doctor before combining these medications."
    sum_text = sum_match.group(1).strip() if sum_match else (summary_out if summary_out else "No definitive interactions found.")

    if source_links:
        unique_links = list(dict.fromkeys(source_links))
        sum_text += "\n\n**Sources:**" + "".join(unique_links)

    return {
        "severity": scoring_res["severity"],
        "recommendation": scoring_res.get("recommendation", rec_text),
        "summary": sum_text,
        "signals": {
            "score": scoring_res["score"],
            "breakdown": scoring_res["breakdown"]
        },
    }


@app.post("/api/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    """Raw OCR: extract text from an uploaded prescription image."""
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        text = perform_ocr(image)
        if text:
            return OCRResponse(success=True, extracted_text=text)
        else:
            return OCRResponse(success=False, error="No text could be extracted from the image.")
    except Exception as e:
        print(f"[/api/ocr] Error: {e}")
        return OCRResponse(success=False, error=str(e))


@app.post("/api/analyze-medicine")
async def analyze_medicine_endpoint(files: UploadFile = File(...)):
    """OCR + medicine-name extraction from an uploaded prescription image."""
    try:
        contents = await files.read()
        image = Image.open(io.BytesIO(contents))

        raw_text = perform_ocr(image)
        print(f"[/api/analyze-medicine] Raw OCR text: {raw_text[:120] if raw_text else '(empty)'}")

        if not raw_text or len(raw_text.strip()) < 3:
            return {
                "success": False,
                "extracted_text": None,
                "medicines": [],
                "error": "No text could be extracted from the image. Try a clearer photo.",
            }

        # Try LLaMA medicine extraction; fall back to inline heuristic
        medicines, llama_err = extract_medicines_with_llama(raw_text)
        if not medicines:
            medicines = extract_inline_medicines(raw_text)

        return {
            "success": True,
            "extracted_text": raw_text,
            "medicines": medicines,
        }
    except Exception as e:
        print(f"[/api/analyze-medicine] Error: {e}")
        return {"success": False, "extracted_text": None, "medicines": [], "error": str(e)}


@app.post("/api/check-interactions")
async def check_drug_interactions(request: InteractionCheckRequest):
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
        if len(explicit_medicines) < 1 and text_for_extraction:
            llama_extracted, llama_error = extract_medicines_with_llama(text_for_extraction)

        effective_medicines = explicit_medicines if len(explicit_medicines) >= 1 else dedupe_preserve_order(explicit_medicines + llama_extracted)
        if len(effective_medicines) < 1:
            raise HTTPException(status_code=400, detail="At least one medicine name is required for analysis")

        medicine_summaries = {}
        target_meds = effective_medicines[:2]
        for med in target_meds:
            medicine_summaries[med] = get_medicine_summary_llama(med)

        ai_data = search_medical_literature_with_llama(target_meds)

        return {
            "success": True,
            "input_medicines": request.medicines,
            "effective_medicines": effective_medicines,
            "matched_medicines": {},
            "direct_interactions": [{"severity": ai_data["severity"]}],
            "pairwise_interactions": [],
            "supabase_rows_found": 0,
            "supabase_lookup_errors": [],
            "interaction_analysis": "AI severity evaluated.",
            "safety_recommendations": ai_data["recommendation"],
            "clinical_explanation": "",
            "web_research_summary": ai_data["summary"],
            "medicine_summaries": medicine_summaries,
            "confidence": 95,
            "signals": ai_data.get("signals"),
            "note": "Pure AI live scraping executed."
        }
    except requests.exceptions.ConnectionError:
        return {"success": False, "error": "Cannot connect to Ollama. Make sure it's running: ollama run tinyllama"}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
