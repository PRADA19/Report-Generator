import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from app.config import settings
from app.model import model_manager
from app.extractor import extract_poster_details
from app.report_generator import generate_report_content
from app.validator import validate_and_normalize
from app.schemas import ExtractionResponse

logger = logging.getLogger("vision-service")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Qwen2.5-VL Intelligent Poster Understanding Service")

@app.get("/health")
def health_check():
    # Return loading/health status based on model availability
    healthy = model_manager.is_healthy()
    status = "ok" if healthy else "degraded"
    
    return {
        "status": status,
        "provider": settings.VISION_PROVIDER,
        "model": settings.VISION_MODEL,
        "available": healthy
    }

@app.post("/extract", response_model=ExtractionResponse)
async def extract_poster(file: UploadFile = File(...)):
    # 1. Validate file content and size
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are accepted.")
        
    # Check max file size (e.g. 15MB)
    max_size = 15 * 1024 * 1024
    image_bytes = await file.read()
    if len(image_bytes) > max_size:
        raise HTTPException(status_code=400, detail="Image size exceeds the 15MB limit.")
        
    try:
        # 2. Extract raw structured details from Qwen2.5-VL
        raw_extraction = await extract_poster_details(image_bytes, file.filename)
        
        # 3. Generate Objective/Summary/Outcomes paragraphs
        generated_report = await generate_report_content(raw_extraction)
        
        # 4. Standardize, validate, and clean response data
        combined_payload = {
            "extractedData": raw_extraction,
            "generatedContent": generated_report
        }
        
        normalized_response = validate_and_normalize(combined_payload)
        return normalized_response
        
    except ValueError as val_err:
        logger.error(f"Image validation error: {val_err}")
        raise HTTPException(status_code=400, detail=str(val_err))
    except TimeoutError as timeout_err:
        logger.error(f"Inference timeout: {timeout_err}")
        raise HTTPException(status_code=504, detail="Vision inference timed out.")
    except Exception as exc:
        logger.error(f"Poster extraction processing failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(exc)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=False)
