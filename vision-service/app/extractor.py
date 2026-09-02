import base64
import io
import json
import logging
import httpx
import asyncio
from PIL import Image
from app.config import settings
from app.model import model_manager

logger = logging.getLogger("vision-service")

EXTRACTION_PROMPT = """You are an expert academic event poster understanding system.

Analyze the uploaded poster image visually and extract only information that is actually present or clearly readable in the poster.

Understand:
- typography
- spatial layout
- labels
- text blocks
- columns
- headers
- footers
- icons
- relationships between labels and nearby values
- visual grouping

Do not rely only on exact labels such as "Venue:", "Date:", or "Speaker:".
Infer field relationships from the poster layout only when the relationship is visually clear.

NEVER invent information.
NEVER create missing information.
NEVER use placeholder values.
NEVER use:
"Academic Event"
"Seminar Hall"
"Guest Speaker"
"Unknown Speaker"
"15 October 2026"
"Workshop on AI"
or any other fabricated default.

If a field is not present or cannot be identified with reasonable confidence:
return an empty string "".

If a list field cannot be identified:
return an empty array [].

Do not confuse:
- event title with organization name
- speaker with organizer
- venue with department
- event date with registration deadline
- speaker designation with department
- contact number with attendance
- website/email with venue

Avoid extracting any text, headers, footers, logos, or surrounding background/metadata that is not part of the actual poster/circular event details. The content must be ONLY related to the poster itself. If you do not know or are unsure about a detail, keep it blank ("").

Read the entire image, including:
- top header
- center content
- bottom footer
- left/right edges

Return structured JSON ONLY matching this schema:
{
  "title": "The exact official title of the event",
  "date": "The date of the event. Must distinguish from registration deadlines",
  "time": "The time of the event",
  "venue": "Physical hall/room or online platform",
  "organizer": "Organizing body/club/association name",
  "department": "The academic department organizing the event",
  "speaker": "Name of the speaker/resource person",
  "speakerDesignation": "Designation/job title of the speaker",
  "chiefGuest": "Name of the chief guest (leave empty if none or same as speaker)",
  "chiefGuestDesignation": "Designation of the chief guest",
  "audience": "Target audience (e.g. Students, Faculty)",
  "topic": "The core topic or theme",
  "participationDetails": "Details about registration fees or criteria",
  "attendance": "Expected capacity or attendee details if explicitly listed"
}
"""

def image_to_base64(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode('utf-8')

# Global semaphore to manage request concurrency and prevent server RAM/CPU overload
inference_semaphore = asyncio.Semaphore(1)

async def extract_poster_details(image_bytes: bytes, filename: str) -> dict:
    if not model_manager.is_healthy():
        raise RuntimeError("Vision model manager is in a degraded or disconnected state.")

    # Load PIL image for validation / local processing
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.verify()  # Verify it's a valid image
        # Reset stream pointer
        image = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        raise ValueError(f"Uploaded file is not a valid image: {e}")

    logger.info(f"Extracting details from poster '{filename}' using provider: {settings.VISION_PROVIDER}")

    try:
        # Enforce execution timeout and request queueing
        async with asyncio.timeout(float(settings.VISION_TIMEOUT)):
            async with inference_semaphore:
                if settings.VISION_PROVIDER == "ollama":
                    base64_img = image_to_base64(image_bytes)
                    
                    payload = {
                        "model": settings.VISION_MODEL,
                        "messages": [
                            {
                                "role": "user",
                                "content": EXTRACTION_PROMPT,
                                "images": [base64_img]
                            }
                        ],
                        "stream": False,
                        "format": "json"
                    }
                    
                    async with httpx.AsyncClient() as client:
                        try:
                            response = await client.post(
                                f"{settings.OLLAMA_BASE_URL}/api/chat",
                                json=payload,
                                timeout=float(settings.VISION_TIMEOUT)
                            )
                            if response.status_code != 200:
                                raise RuntimeError(f"Ollama server returned error code {response.status_code}: {response.text}")
                            
                            result = response.json()
                            content = result.get("message", {}).get("content", "")
                            logger.info(f"Ollama response received: {content}")
                            
                            # Parse JSON content
                            return json.loads(content)
                        except httpx.TimeoutException:
                            raise TimeoutError("The request to the local vision model timed out.")
                        except Exception as e:
                            raise RuntimeError(f"Failed to query Ollama: {e}")

                elif settings.VISION_PROVIDER == "local":
                    # PyTorch Local execution fallback
                    try:
                        # Local imports to prevent loading unless used
                        from qwen_vl_utils import process_vision_info
                        
                        processor = model_manager.local_processor
                        model = model_manager.local_model
                        
                        messages = [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "image", "image": image},
                                    {"type": "text", "text": EXTRACTION_PROMPT}
                                ]
                            }
                        ]
                        
                        text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
                        image_inputs, video_inputs = process_vision_info(messages)
                        
                        inputs = processor(
                            text=[text],
                            images=image_inputs,
                            videos=video_inputs,
                            padding=True,
                            return_tensors="pt"
                        )
                        inputs = inputs.to(model.device)
                        
                        generated_ids = model.generate(**inputs, max_new_tokens=1024)
                        generated_ids_trimmed = [
                            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
                        ]
                        output_text = processor.batch_decode(
                            generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
                        )[0]
                        
                        # Extract JSON block from markdown output block if present
                        if "```json" in output_text:
                            output_text = output_text.split("```json")[1].split("```")[0].strip()
                        elif "```" in output_text:
                            output_text = output_text.split("```")[1].split("```")[0].strip()
                            
                        return json.loads(output_text)
                    except Exception as e:
                        raise RuntimeError(f"Local Qwen model inference failed: {e}")
                else:
                    raise ValueError(f"Unsupported VISION_PROVIDER configuration: {settings.VISION_PROVIDER}")
    except asyncio.TimeoutError:
        raise TimeoutError("The vision service is busy. The request timed out in the concurrency queue.")
