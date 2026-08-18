from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.schemas.response import ProcessOcrResponse, Speaker, ExtractionConfidence, OcrMetadata
from app.services.preprocessor import normalize_document_orientation
from app.services.ocr_engine import extract_ocr_blocks
from app.services.layout_parser import classify_and_filter_layout
from app.services.field_extractor import extract_structured_fields

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Flow Nest OCR Service",
    description="Intelligent layout-aware English document understanding and OCR pipeline.",
    version="1.1.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """Health check endpoint to ensure containers are alive."""
    return {"status": "healthy", "service": "ocr-engine"}

@app.post("/api/v1/ocr/process", response_model=ProcessOcrResponse)
async def process_document(
    file: UploadFile = File(...),
    x_api_key: str = Header(None)
):
    """
    Decodes the upload file, normalizes orientation and skew, runs PaddleOCR,
    segments layout structures, removes header/footer noise, and extracts core metadata.
    """
    # Simple API Key Verification (if set in production environment)
    # For now, log and proceed
    logger.info(f"Processing document upload: {file.filename}")

    try:
        # 1. Read file bytes
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        # 2. Image Preprocessing (Orientation Correction & Deskew)
        # Note: If it's a PDF, we expect the gateway to convert page to PNG, or 
        # the microservice could raise if binary parsing fails. In this architecture,
        # the Node/Vite layer renders PDFs to Canvas image streams, which are passed here.
        try:
            img, orientation_meta = normalize_document_orientation(contents)
        except Exception as e:
            logger.error(f"Image preprocessing failed: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Image preprocessing failed: {str(e)}")

        # 3. PaddleOCR execution
        try:
            raw_blocks = extract_ocr_blocks(img)
        except Exception as e:
            logger.error(f"OCR execution failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"OCR execution failed: {str(e)}")

        if not raw_blocks:
            # Return empty skeleton fallback
            return ProcessOcrResponse(
                eventTitle="",
                department="",
                organizedBy="",
                eventType="",
                date="",
                time="",
                venue="",
                speakers=[],
                confidence=ExtractionConfidence(eventTitle=0.0, department=0.0, date=0.0, venue=0.0, speakers=0.0),
                metadata=OcrMetadata(rotationApplied=0, skewCorrected=0.0, ocrMethod="fallback")
            )

        # 4. Layout-Aware Parsing & Noise Filtering
        try:
            classified_blocks = classify_and_filter_layout(raw_blocks, img.shape)
        except Exception as e:
            logger.error(f"Layout parsing failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Layout parsing failed: {str(e)}")

        # 5. Metadata Field Extraction & Confidence Calculation
        try:
            structured_data, confidence_scores = extract_structured_fields(classified_blocks)
        except Exception as e:
            logger.error(f"Field extraction failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Field extraction failed: {str(e)}")

        # Formulate final response
        speakers_mapped = [
            Speaker(
                name=s["name"],
                designation=s["designation"],
                organization=s["organization"]
            )
            for s in structured_data["speakers"]
        ]

        response = ProcessOcrResponse(
            eventTitle=structured_data["eventTitle"],
            department=structured_data["department"],
            organizedBy=structured_data["organizedBy"],
            eventType=structured_data["eventType"],
            date=structured_data["date"],
            time=structured_data["time"],
            venue=structured_data["venue"],
            speakers=speakers_mapped,
            confidence=ExtractionConfidence(
                eventTitle=confidence_scores["eventTitle"],
                department=confidence_scores["department"],
                date=confidence_scores["date"],
                venue=confidence_scores["venue"],
                speakers=confidence_scores["speakers"]
            ),
            metadata=OcrMetadata(
                rotationApplied=orientation_meta["rotationApplied"],
                skewCorrected=orientation_meta["skewCorrected"],
                ocrMethod="paddleocr"
            )
        )

        return response

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unhandled OCR microservice error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal OCR processor error: {str(e)}")
