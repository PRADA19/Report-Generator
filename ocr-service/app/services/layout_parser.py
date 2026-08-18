import re
import numpy as np

HEADER_FOOTER_PATTERNS = [
    r"(?i)naac",
    r"(?i)autonomous",
    r"(?i)affiliated\s+to",
    r"(?i)iso\s*\d+",
    r"(?i)www\.",
    r"(?i)https?://",
    r"(?i)page\s+\d+"
]

PRESERVATION_PATTERNS = [
    r"(?i)department\s+of",
    r"(?i)date:?",
    r"(?i)venue:?",
    r"(?i)speaker",
    r"(?i)workshop",
    r"(?i)symposium",
    r"(?i)conference"
]

def classify_and_filter_layout(ocr_blocks: list[dict], img_shape: tuple) -> list[dict]:
    """
    Filters out header/footer noise, estimates font importance from height, classifies block types,
    and sorts them in logical reading order.
    """
    if not ocr_blocks:
        return []

    h, w = img_shape[:2]
    midpoint = w / 2

    # 1. Filter out repeating header/footer noise based on spatial and regex rules
    filtered_blocks = []
    for b in ocr_blocks:
        text = b["text"]
        x_min, y_min, x_max, y_max = b["bbox"]

        is_header_zone = y_min < (h * 0.10)
        is_footer_zone = y_max > (h * 0.90)

        # Check noise patterns
        is_noise = any(re.search(pat, text) for pat in HEADER_FOOTER_PATTERNS)
        
        # Check preservation overrides
        is_preserved = any(re.search(pat, text) for pat in PRESERVATION_PATTERNS)

        if not text.strip() or b.get("confidence", 1.0) < 0.15:
            # Skip empty or garbage low-confidence noise blocks
            continue
            
        filtered_blocks.append(b)

    if not filtered_blocks:
        return []

    # 2. Estimate Font Heights and Importance
    # Compute block heights
    heights = [b["bbox"][3] - b["bbox"][1] for b in filtered_blocks]
    median_height = np.median(heights) if heights else 15
    max_height = max(heights) if heights else 30

    # 3. Reading Order Reconstruction (Multi-column alignment check)
    left_column = []
    right_column = []
    full_width = []

    for b in filtered_blocks:
        x_min, y_min, x_max, y_max = b["bbox"]
        
        # If the block spans across the vertical middle line with buffer, treat as full-width
        if x_min < (midpoint - w * 0.08) and x_max > (midpoint + w * 0.08):
            full_width.append(b)
        elif x_max <= (midpoint + w * 0.08):
            left_column.append(b)
        else:
            right_column.append(b)

    # Sort columns vertically
    left_sorted = sorted(left_column, key=lambda x: x["bbox"][1])
    right_sorted = sorted(right_column, key=lambda x: x["bbox"][1])
    full_sorted = sorted(full_width, key=lambda x: x["bbox"][1])

    # Interleave to build a single stream: Top full-width blocks, then columns, then bottom full-width blocks
    top_blocks = [b for b in full_sorted if b["bbox"][1] < (h * 0.35)]
    bottom_blocks = [b for b in full_sorted if b["bbox"][1] >= (h * 0.35)]

    arranged_blocks = []
    arranged_blocks.extend(top_blocks)
    arranged_blocks.extend(left_sorted)
    arranged_blocks.extend(right_sorted)
    arranged_blocks.extend(bottom_blocks)

    # 4. Classify Blocks & Map TypeScript Interfaces
    classified_blocks = []
    for idx, b in enumerate(arranged_blocks):
        text = b["text"]
        x_min, y_min, x_max, y_max = b["bbox"]
        block_h = y_max - y_min
        
        # Thresholds relative to image height
        block_type = "body"
        
        # Heuristics for Title (Large font size, located near top-mid page)
        if block_h > (median_height * 1.5) and y_min < (h * 0.50):
            block_type = "title"
        elif block_h > (median_height * 1.1) and y_min < (h * 0.60):
            block_type = "subtitle"
        elif "department of" in text.lower() or "dept of" in text.lower() or "dept." in text.lower():
            block_type = "department"
        elif any(kw in text.lower() for kw in ["date", "time", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "october", "september", "november", "december", "january", "february", "march", "april", "may", "june", "july", "august"]):
            block_type = "date"
        elif any(kw in text.lower() for kw in ["venue", "seminar hall", "auditorium", "conference hall", "google meet", "zoom", "classroom", "block", "lab"]):
            block_type = "venue"
        elif any(kw in text.lower() for kw in ["coordinator", "convenor", "organizer", "organizing", "secretary", "charge"]):
            block_type = "footer" # Frequently in coordinator footers
        elif re.search(r"\b(dr|prof|mr|ms|mrs)\.", text, re.IGNORECASE) or any(kw in text.lower() for kw in ["speaker", "resource person", "chief guest"]):
            block_type = "speaker"

        classified_blocks.append({
            "id": b["id"],
            "text": text,
            "bbox": [x_min, y_min, x_max, y_max],
            "type": block_type,
            "confidence": b["confidence"],
            "readingOrder": idx
        })

    return classified_blocks
