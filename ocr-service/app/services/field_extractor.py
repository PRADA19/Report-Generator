import re

MONTHS_MAP = {
    'jan': 'January', 'feb': 'February', 'mar': 'March', 'apr': 'April',
    'may': 'May', 'jun': 'June', 'jul': 'July', 'aug': 'August',
    'sep': 'September', 'oct': 'October', 'nov': 'November', 'dec': 'December'
}

def extract_structured_fields(layout_blocks: list[dict]) -> tuple[dict, dict]:
    """
    Parses structured layout blocks and groups them into clean response fields.
    Also calculates individual extraction confidence metrics.
    """
    event_title = ""
    department = ""
    organized_by = ""
    event_type = ""
    date_str = ""
    time_str = ""
    venue_str = ""
    speakers = []

    # Local confidence aggregators
    conf_scores = {
        "eventTitle": 0.0,
        "department": 0.0,
        "date": 0.0,
        "venue": 0.0,
        "speakers": 0.0
    }

    # Helper: get block by type
    title_blocks = [b for b in layout_blocks if b["type"] == "title"]
    dept_blocks = [b for b in layout_blocks if b["type"] == "department"]
    date_blocks = [b for b in layout_blocks if b["type"] == "date"]
    venue_blocks = [b for b in layout_blocks if b["type"] == "venue"]
    speaker_blocks = [b for b in layout_blocks if b["type"] == "speaker"]

    # 1. Title Extraction
    if title_blocks:
        # Sort by vertical height, merge top 2 title blocks if they are close
        title_blocks_sorted = sorted(title_blocks, key=lambda x: x["readingOrder"])
        event_title = title_blocks_sorted[0]["text"]
        avg_ocr_conf = title_blocks_sorted[0]["confidence"]
        
        if len(title_blocks_sorted) > 1 and abs(title_blocks_sorted[1]["bbox"][1] - title_blocks_sorted[0]["bbox"][3]) < 50:
            event_title += " " + title_blocks_sorted[1]["text"]
            avg_ocr_conf = (avg_ocr_conf + title_blocks_sorted[1]["confidence"]) / 2

        # Clean title borders
        event_title = re.sub(r"^[:\-\s+|]+", "", event_title)
        event_title = re.sub(r"[:\-\s+|]+$", "", event_title).strip()
        
        # Calculate Title Confidence
        conf = avg_ocr_conf * 0.7
        if any(kw in event_title.lower() for kw in ["workshop", "seminar", "symposium", "conference", "lecture"]):
            conf += 0.3 # Exact keyword bonus
        conf_scores["eventTitle"] = min(1.0, round(conf, 2))
    else:
        # Fallback to look at largest block in reading order
        event_title = ""
        conf_scores["eventTitle"] = 0.0

    # Inferred Event Type classification
    title_lower = event_title.lower()
    if "workshop" in title_lower or "hands-on" in title_lower:
        event_type = "Workshop"
    elif "webinar" in title_lower or "online session" in title_lower:
        event_type = "Webinar"
    elif "symposium" in title_lower:
        event_type = "Symposium"
    elif "conference" in title_lower:
        event_type = "Conference"
    elif "guest lecture" in title_lower or "invited talk" in title_lower or "lecture" in title_lower:
        event_type = "Guest Lecture"
    elif "fdp" in title_lower or "faculty development" in title_lower:
        event_type = "FDP"
    elif "seminar" in title_lower:
        event_type = "Seminar"

    # 2. Department Extraction
    if dept_blocks:
        dept_text = dept_blocks[0]["text"]
        match = re.search(r"(?:department|dept\.?)\s+of\s+([A-Za-z\s]+)", dept_text, re.IGNORECASE)
        if match:
            department = match.group(1).split(',')[0].strip()
        else:
            department = dept_text.strip()
            
        conf = dept_blocks[0]["confidence"] * 0.7 + 0.3
        conf_scores["department"] = min(1.0, round(conf, 2))
    else:
        # Scan body blocks for department keywords
        dept_keywords = ["computer science", "information technology", "mechanical", "electrical", "civil", "physics", "commerce"]
        found_dept = None
        for b in layout_blocks:
            found = next((kw for kw in dept_keywords if kw in b["text"].lower()), None)
            if found:
                found_dept = found.title()
                break
        department = found_dept if found_dept else ""
        conf_scores["department"] = 0.4 if found_dept else 0.0

    # Organizer (leave empty unless explicitly extracted)
    organized_by = ""

    # 3. Date & Time Extraction
    date_raw = ""
    time_raw = ""
    
    # Process blocks marked as date
    for db in date_blocks:
        txt = db["text"]
        # Search for date pattern
        if not date_raw:
            # 12 August 2026, 12th August 2026
            text_match = re.search(r"\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})\b", txt, re.IGNORECASE)
            if text_match:
                day = int(text_match.group(1))
                m_short = text_match.group(2).lower()[:3]
                month = MONTHS_MAP.get(m_short, m_short.title())
                year = text_match.group(3)
                date_raw = f"{day} {month} {year}"
            else:
                # 12/08/2026, 12-08-2026
                num_match = re.search(r"\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b", txt)
                if num_match:
                    d1, d2, yr = int(num_match.group(1)), int(num_match.group(2)), num_match.group(3)
                    year = yr if len(yr) == 4 else f"20{yr}"
                    month_idx = min(max(1, d2), 12)
                    month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
                    date_raw = f"{d1} {month_names[month_idx - 1]} {year}"
                    
        # Search for time patterns
        if not time_raw:
            time_range = re.search(r"\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:–|-|to)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)\b", txt, re.IGNORECASE)
            single_time = re.search(r"\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b", txt, re.IGNORECASE)
            if time_range:
                time_raw = time_range.group(0)
            elif single_time:
                time_raw = single_time.group(0)

    # Fallbacks for missing date/time
    date_str = date_raw if date_raw else ""
    time_str = time_raw if time_raw else ""
    
    # Normalize Time formats
    if time_str:
        time_str = time_str.replace("am", " AM").replace("pm", " PM").replace("  ", " ").strip()
    
    # Calculate Date Confidence
    if date_raw:
        date_conf = 0.5
        date_conf += 0.4
        if date_blocks and date_blocks[0]["confidence"] > 0.8:
            date_conf += 0.1
        conf_scores["date"] = min(1.0, round(date_conf, 2))
    else:
        conf_scores["date"] = 0.0

    # 4. Venue Extraction
    if venue_blocks:
        venue_str = venue_blocks[0]["text"]
        venue_str = re.sub(r"(?i)^venue:?\s*", "", venue_str).strip()
        conf = venue_blocks[0]["confidence"] * 0.7 + 0.3
        conf_scores["venue"] = min(1.0, round(conf, 2))
    else:
        # Fallback by keyword scanning
        found_venue = None
        for b in layout_blocks:
            txt_lower = b["text"].lower()
            if any(kw in txt_lower for kw in ["seminar hall", "auditorium", "conference hall", "google meet", "zoom"]):
                found_venue = b["text"]
                break
        venue_str = found_venue if found_venue else ""
        conf_scores["venue"] = 0.6 if found_venue else 0.0

    # 5. Speaker Extraction (Positional Speaker Pairing)
    # Loop over speaker lines. Usually the designation sits on the line directly below in readingOrder.
    for i, sb in enumerate(speaker_blocks):
        name_text = sb["text"]
        
        # Clean speaker labeling noise
        name_text = re.sub(r"(?i)^(speaker|resource person|chief guest):?\s*", "", name_text).strip()
        
        # Validate that it matches a speaker pattern
        if not re.search(r"\b(dr|prof|mr|ms|mrs)\.", name_text, re.IGNORECASE) and len(name_text) < 4:
            continue
            
        designation = ""
        organization = ""
        
        # Look at the blocks immediately after this speaker block in reading order
        idx_in_flow = sb["readingOrder"]
        
        # Look up to 2 blocks below
        desc_blocks = [b for b in layout_blocks if b["readingOrder"] > idx_in_flow and b["readingOrder"] <= idx_in_flow + 2]
        
        if desc_blocks:
            designation = desc_blocks[0]["text"]
            if len(desc_blocks) > 1 and any(kw in desc_blocks[1]["text"].lower() for kw in ["university", "college", "corporation", "ltd", "pvt", "institute", "technologies"]):
                organization = desc_blocks[1]["text"]
                
        speakers.append({
            "name": name_text,
            "designation": designation,
            "organization": organization
        })

    if not speakers:
        speakers = []
        conf_scores["speakers"] = 0.0
    else:
        avg_speaker_conf = sum(sb["confidence"] for sb in speaker_blocks) / len(speaker_blocks) if speaker_blocks else 0.8
        conf_scores["speakers"] = min(1.0, round(avg_speaker_conf * 0.9, 2))

    structured_data = {
        "eventTitle": event_title,
        "department": department,
        "organizedBy": organized_by,
        "eventType": event_type,
        "date": date_str,
        "time": time_str,
        "venue": venue_str,
        "speakers": speakers
    }

    return structured_data, conf_scores
