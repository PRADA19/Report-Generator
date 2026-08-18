from paddleocr import PaddleOCR
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Initialize PaddleOCR engine as a global singleton to prevent loading weights on every request
# We enforce lang='en' as Tamil/bilingual handling is excluded
_ocr_instance = None

def get_ocr_instance() -> PaddleOCR:
    global _ocr_instance
    if _ocr_instance is None:
        logger.info("Initializing PaddleOCR weights and structures...")
        _ocr_instance = PaddleOCR(use_angle_cls=False, lang='en', show_log=False)
    return _ocr_instance

def extract_ocr_blocks(img: np.ndarray) -> list[dict]:
    """
    Executes PaddleOCR on the preprocessed image.
    Transforms quad-based coordinates into [x_min, y_min, x_max, y_max] layout rectangles.
    """
    ocr = get_ocr_instance()
    
    # PaddleOCR expects a numpy array or file path
    results = ocr.ocr(img, cls=False)
    
    blocks = []
    # PaddleOCR returns a list of results (one list per page/image)
    if not results or not results[0]:
        return []
        
    for idx, line in enumerate(results[0]):
        box = line[0]  # List of 4 points: [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
        text_info = line[1]  # (text, confidence)
        
        text = text_info[0].strip()
        confidence = float(text_info[1])
        
        # 1. Compute bounding rect from the quad points
        xs = [pt[0] for pt in box]
        ys = [pt[1] for pt in box]
        
        x_min = int(min(xs))
        y_min = int(min(ys))
        x_max = int(max(xs))
        y_max = int(max(ys))
        
        blocks.append({
            "id": f"block_{idx:03d}",
            "text": text,
            "bbox": [x_min, y_min, x_max, y_max],
            "confidence": round(confidence, 3)
        })
        
    return blocks
