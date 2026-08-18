from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class ExtractedData(BaseModel):
    title: str = Field(default="", description="The official title of the academic event.")
    date: str = Field(default="", description="The specific date(s) of the event.")
    time: str = Field(default="", description="The time or time-range of the event.")
    venue: str = Field(default="", description="Physical location or online platform.")
    organizer: str = Field(default="", description="Organization/club/person conducting the event.")
    department: str = Field(default="", description="Academic department organizing the event.")
    speaker: str = Field(default="", description="Name of the primary resource person or guest speaker.")
    speakerDesignation: str = Field(default="", description="Designation of the speaker (e.g., Professor).")
    chiefGuest: str = Field(default="", description="Name of the chief guest, if different from the speaker.")
    chiefGuestDesignation: str = Field(default="", description="Designation of the chief guest.")
    audience: str = Field(default="", description="Target audience (e.g. students, faculty).")
    topic: str = Field(default="", description="The core topic or theme of the session.")
    participationDetails: str = Field(default="", description="Information regarding registration, fees, or participants.")
    attendance: str = Field(default="", description="Total expected attendees or capacity if mentioned.")

class GeneratedContent(BaseModel):
    objectiveDescription: str = Field(default="", description="Auto-generated academic objective/purpose.")
    eventSummary: str = Field(default="", description="Auto-generated professional descriptive summary.")
    summaryPoints: List[str] = Field(default_factory=list, description="Auto-generated summary highlights points.")
    keyProgramOutcomes: List[str] = Field(default_factory=list, description="Auto-generated outcomes points.")

class ExtractionResponse(BaseModel):
    extractedData: ExtractedData
    generatedContent: GeneratedContent
    confidence: Dict[str, float] = Field(
        default_factory=lambda: {
            "title": 0.0,
            "date": 0.0,
            "time": 0.0,
            "venue": 0.0,
            "organizer": 0.0,
            "department": 0.0,
            "speaker": 0.0
        }
    )
    warnings: List[str] = Field(default_factory=list)
