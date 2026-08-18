from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class Speaker(BaseModel):
    name: str = Field(..., description="The full name of the speaker/guest.")
    designation: str = Field(..., description="Designation of the speaker (e.g., Professor, Director).")
    organization: str = Field(..., description="The organization or institute the speaker belongs to.")

class LayoutBlock(BaseModel):
    id: str
    text: str
    bbox: List[int] = Field(..., min_items=4, max_items=4, description="[x_min, y_min, x_max, y_max] coordinates.")
    type: str = Field(..., description="Classified type of block (title, subtitle, department, date, venue, speaker, footer).")
    confidence: float
    readingOrder: int

class ExtractionConfidence(BaseModel):
    eventTitle: float
    department: float
    date: float
    venue: float
    speakers: float

class OcrMetadata(BaseModel):
    rotationApplied: int
    skewCorrected: float
    ocrMethod: str

class ProcessOcrResponse(BaseModel):
    eventTitle: str
    department: str
    organizedBy: str
    eventType: str
    date: str
    time: str
    venue: str
    speakers: List[Speaker]
    confidence: ExtractionConfidence
    metadata: OcrMetadata
