import re
import logging
from typing import Dict, Any, List

logger = logging.getLogger("vision-service")

FORBIDDEN_PLACEHOLDERS = [
    "academic event", "untitled event", "seminar hall", "guest speaker",
    "guest lecturer", "unknown speaker", "event venue", "15 october 2026",
    "workshop on ai", "invited organization", "n/a", "unknown", "placeholder"
]

def is_placeholder(value: str) -> bool:
    if not value:
        return True
    val_clean = value.strip().lower()
    # Check if exact match or contains forbidden templates
    for placeholder in FORBIDDEN_PLACEHOLDERS:
        if val_clean == placeholder or val_clean == f"({placeholder})" or val_clean == f"[{placeholder}]":
            return True
    return False

def clean_field(val: Any) -> str:
    if val is None:
        return ""
    if not isinstance(val, str):
        val = str(val)
    val = val.strip()
    if is_placeholder(val):
        return ""
    return val

def clean_list_field(val: Any) -> List[str]:
    if not val:
        return []
    if not isinstance(val, list):
        # Split string lines if it was mistakenly returned as string
        if isinstance(val, str):
            val = [v.strip() for v in val.split("\n") if v.strip()]
        else:
            val = [str(val)]
            
    cleaned = []
    for item in val:
        item_str = clean_field(item)
        if item_str:
            cleaned.append(item_str)
    return cleaned

def calculate_field_confidence(field: str, value: str) -> float:
    if not value or value.strip() == "":
        return 0.0
    
    val_lower = value.lower()
    score = 0.70  # Baseline high start for Qwen2.5-VL
    
    # Specific field checks
    if field == "title":
        if len(value) > 8: score += 0.15
        if not re.search(r'\b(seminar|workshop|fdp|lecture|symposium|conference)\b', val_lower):
            score -= 0.05
    elif field == "date":
        # Check standard date structures
        date_pattern = r'\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4}\b'
        slash_pattern = r'\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b'
        if re.search(date_pattern, val_lower) or re.search(slash_pattern, val_lower):
            score += 0.20
    elif field == "time":
        if re.search(r'\b(am|pm)\b', val_lower):
            score += 0.15
    elif field == "venue":
        if any(kw in val_lower for kw in ["hall", "room", "auditorium", "zoom", "meet", "lab"]):
            score += 0.15
    elif field == "speaker":
        if re.search(r'\b(dr|prof|mr|ms|mrs)\.', val_lower):
            score += 0.20
            
    return min(1.0, max(0.1, score))

def validate_and_normalize(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    logger.info("Validating and normalizing extracted poster data...")
    
    # Ensure nested dictionaries exist
    raw_extracted = raw_data.get("extractedData", raw_data) or {}
    raw_generated = raw_data.get("generatedContent", {}) or {}
    
    # 1. Clean extracted details
    extracted = {
        "title": clean_field(raw_extracted.get("title")),
        "date": clean_field(raw_extracted.get("date")),
        "time": clean_field(raw_extracted.get("time")),
        "venue": clean_field(raw_extracted.get("venue")),
        "organizer": clean_field(raw_extracted.get("organizer")),
        "department": clean_field(raw_extracted.get("department")),
        "speaker": clean_field(raw_extracted.get("speaker")),
        "speakerDesignation": clean_field(raw_extracted.get("speakerDesignation")),
        "chiefGuest": clean_field(raw_extracted.get("chiefGuest")),
        "chiefGuestDesignation": clean_field(raw_extracted.get("chiefGuestDesignation")),
        "audience": clean_field(raw_extracted.get("audience")),
        "topic": clean_field(raw_extracted.get("topic")),
        "participationDetails": clean_field(raw_extracted.get("participationDetails")),
        "attendance": clean_field(raw_extracted.get("attendance")),
    }
    
    # 2. Clean generated paragraphs
    generated = {
        "objectiveDescription": clean_field(raw_generated.get("objectiveDescription")),
        "eventSummary": clean_field(raw_generated.get("eventSummary")),
        "summaryPoints": clean_list_field(raw_generated.get("summaryPoints")),
        "keyProgramOutcomes": clean_list_field(raw_generated.get("keyProgramOutcomes"))
    }
    
    # 3. Compute dynamic field confidence scores
    confidence = {
        "title": calculate_field_confidence("title", extracted["title"]),
        "date": calculate_field_confidence("date", extracted["date"]),
        "time": calculate_field_confidence("time", extracted["time"]),
        "venue": calculate_field_confidence("venue", extracted["venue"]),
        "organizer": calculate_field_confidence("organizer", extracted["organizer"]),
        "department": calculate_field_confidence("department", extracted["department"]),
        "speaker": calculate_field_confidence("speaker", extracted["speaker"])
    }
    
    # 4. Generate visual extraction warnings
    warnings = []
    for field, score in confidence.items():
        if score > 0.0 and score < 0.70:
            warnings.append(f"Low confidence for extracted event '{field}' ({int(score * 100)}%). Please double-check.")
            
    # Check key missing fields
    if not extracted["title"]:
        warnings.append("Event title could not be identified from the poster.")
    if not extracted["date"]:
        warnings.append("Event date could not be identified from the poster.")
        
    return {
        "extractedData": extracted,
        "generatedContent": generated,
        "confidence": confidence,
        "warnings": warnings
    }
