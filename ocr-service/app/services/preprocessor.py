import cv2
import numpy as np
import pytesseract
import logging

logger = logging.getLogger(__name__)

def normalize_document_orientation(image_bytes: bytes) -> tuple[np.ndarray, dict]:
    """
    Decodes the image, runs orientation and skew detection, corrects it, and returns the normalized
    OpenCV image and rotation/skew metadata.
    """
    # 1. Decode image bytes to OpenCV format
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image bytes provided, unable to decode image.")

    (h, w) = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 2. Orientation Detection via Tesseract OSD (Orientation and Script Detection)
    rotation_angle = 0
    original_orientation = "portrait"
    
    try:
        osd = pytesseract.image_to_osd(gray)
        # Parse output like:
        # Page number: 0
        # Orientation in degrees: 270
        # Rotate: 90
        # ...
        lines = osd.split('\n')
        for line in lines:
            if "Orientation in degrees:" in line:
                deg = int(line.split(': ')[1].strip())
                if deg in [90, 180, 270]:
                    rotation_angle = deg
            if "Orientation in degrees" in line:
                pass
        
        # Original orientation label mapping
        if rotation_angle == 90:
            original_orientation = "landscape-left"
        elif rotation_angle == 180:
            original_orientation = "upside-down"
        elif rotation_angle == 270:
            original_orientation = "landscape-right"
    except Exception as e:
        logger.warning(f"Tesseract OSD failed, skipping orientation rotation: {str(e)}")

    # Apply rotation
    rotation_applied = 0
    if rotation_angle == 90:
        img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
        rotation_applied = 90
    elif rotation_angle == 180:
        img = cv2.rotate(img, cv2.ROTATE_180)
        rotation_applied = 180
    elif rotation_angle == 270:
        img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
        rotation_applied = 270

    # Refresh size and gray image after rotation
    (h, w) = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 3. Deskew Detection (±15 degrees) using Hough lines
    skew_angle = 0.0
    try:
        # Edge detection
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        # Find lines using Probabilistic Hough Transform
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, 100, minLineLength=w // 3, maxLineGap=15)
        
        angles = []
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                angle = np.arctan2(y2 - y1, x2 - x1) * 180.0 / np.pi
                # Ignore vertical lines or extreme diagonals; keep lines near horizontal
                if -15 < angle < 15:
                    angles.append(angle)
            
            if len(angles) > 0:
                skew_angle = float(np.median(angles))
    except Exception as e:
        logger.warning(f"Skew detection failed: {str(e)}")

    # Apply deskew rotation if skew is significant
    if abs(skew_angle) > 0.5:
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, skew_angle, 1.0)
        img = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        # Update gray image for downstream steps
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    metadata = {
        "rotationApplied": rotation_applied,
        "skewCorrected": round(skew_angle, 2),
        "originalOrientation": original_orientation
    }

    return img, metadata
