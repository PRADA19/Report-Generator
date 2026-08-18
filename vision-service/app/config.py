import os
from dotenv import load_dotenv

# Load active environment variables
load_dotenv()

class Settings:
    VISION_PROVIDER: str = os.getenv("VISION_PROVIDER", "ollama").lower()
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    VISION_MODEL: str = os.getenv("VISION_MODEL", "qwen2.5-vl")
    VISION_TIMEOUT: int = int(os.getenv("VISION_TIMEOUT", "60"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8001"))

settings = Settings()
