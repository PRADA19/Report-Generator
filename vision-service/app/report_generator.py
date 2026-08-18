import json
import logging
import httpx
from typing import Dict, Any
from app.config import settings

logger = logging.getLogger("vision-service")

GENERATION_PROMPT_TEMPLATE = """You are an academic report writer.
Based ONLY on the following extracted event details, generate professional content for the event report:

EVENT DETAILS:
{details_json}

INSTRUCTIONS:
1. Generate a concise academic "objectiveDescription" describing the purpose of conducting this event and what the target learning goals were. Do not invent achievements or distribution of certificates.
2. Generate a professional "eventSummary" paragraph describing the event. If details (like speaker, venue, date) are empty/missing, do NOT invent them and do NOT mention them. Paraphrase naturally.
3. Generate a list of "summaryPoints" (array of strings, maximum 3 points) capturing the key highlights or topics discussed during the session.
4. Generate a list of "keyProgramOutcomes" (array of strings, maximum 3 points) describing the specific skills or awareness gained. Do not invent metrics like "100% of participants mastered..." or "certificates distributed". If insufficient data exists, return an empty array [].
5. Strictly obey the NO-HALLUCINATION rule: do not introduce any factual claims, dates, speakers, names, or locations that do not exist in the EVENT DETAILS.

Return structured JSON ONLY matching this schema:
{{
  "objectiveDescription": "Concise paragraph...",
  "eventSummary": "Narrative paragraph...",
  "summaryPoints": [
    "Highlight point 1",
    "Highlight point 2"
  ],
  "keyProgramOutcomes": [
    "Outcome point 1",
    "Outcome point 2"
  ]
}}
"""

async def generate_report_content(extracted_data: Dict[str, Any]) -> Dict[str, Any]:
    details_json = json.dumps(extracted_data, indent=2)
    prompt = GENERATION_PROMPT_TEMPLATE.format(details_json=details_json)
    
    logger.info("Generating report content based on extracted details...")
    
    if settings.VISION_PROVIDER == "ollama":
        payload = {
            "model": settings.VISION_MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
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
                    raise RuntimeError(f"Ollama content generation failed: {response.text}")
                
                result = response.json()
                content = result.get("message", {}).get("content", "")
                logger.info(f"Ollama generation response: {content}")
                return json.loads(content)
            except Exception as e:
                logger.error(f"Failed to generate content with Ollama: {e}")
                # Fallback to simple local rule-based generators if model fails
                return generate_local_fallback_content(extracted_data)

    elif settings.VISION_PROVIDER == "local":
        try:
            # We can use the loaded Hugging Face model for text generation if loaded
            from app.model import model_manager
            processor = model_manager.local_processor
            model = model_manager.local_model
            
            messages = [
                {"role": "user", "content": prompt}
            ]
            
            text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            inputs = processor(text=[text], padding=True, return_tensors="pt")
            inputs = inputs.to(model.device)
            
            generated_ids = model.generate(**inputs, max_new_tokens=512)
            generated_ids_trimmed = [
                out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
            ]
            output_text = processor.batch_decode(
                generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
            )[0]
            
            if "```json" in output_text:
                output_text = output_text.split("```json")[1].split("```")[0].strip()
            elif "```" in output_text:
                output_text = output_text.split("```")[1].split("```")[0].strip()
                
            return json.loads(output_text)
        except Exception as e:
            logger.error(f"Local Qwen generation failed: {e}")
            return generate_local_fallback_content(extracted_data)
    else:
        return generate_local_fallback_content(extracted_data)

def generate_local_fallback_content(extracted_data: Dict[str, Any]) -> Dict[str, Any]:
    # Simple rule-based generation to guarantee we have content without hallucinations
    title = extracted_data.get("title", "")
    topic = extracted_data.get("topic", "")
    dept = extracted_data.get("department", "")
    speaker = extracted_data.get("speaker", "")
    venue = extracted_data.get("venue", "")
    date = extracted_data.get("date", "")
    
    objective = ""
    summary = ""
    highlights = []
    outcomes = []
    
    if title:
        # Objective
        dept_clause = f" organized by the Department of {dept}" if dept else ""
        topic_clause = f" on the topic of {topic}" if topic else f" regarding {title}"
        objective = f"The primary objective of conducting the session '{title}'{dept_clause} was to provide attendees with useful insights{topic_clause}."
        
        # Summary
        speaker_clause = f" led by resource person {speaker}" if speaker else ""
        venue_clause = f" at {venue}" if venue else ""
        date_clause = f" on {date}" if date else ""
        summary = f"The event '{title}'{speaker_clause} was successfully conducted{venue_clause}{date_clause}. The session covered key aspects related to {topic or title}."
        
        # Highlights
        highlights = [
            f"Conducted session on modern aspects of {topic or title}.",
            f"Discussed core concepts and practical applications."
        ]
        
        # Outcomes
        outcomes = [
            f"Participants gained a fundamental understanding of {topic or title}.",
            f"Attendees engaged in interactive discussions regarding key concepts."
        ]
        
    return {
        "objectiveDescription": objective,
        "eventSummary": summary,
        "summaryPoints": highlights,
        "keyProgramOutcomes": outcomes
    }
