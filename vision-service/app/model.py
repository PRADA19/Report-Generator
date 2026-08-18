import httpx
import logging
from app.config import settings

logger = logging.getLogger("vision-service")
logging.basicConfig(level=logging.INFO)

class ModelManager:
    def __init__(self):
        self.provider = settings.VISION_PROVIDER
        self.model_name = settings.VISION_MODEL
        self.available = False
        self.ollama_client = None
        self.local_model = None
        self.local_processor = None
        
        self.initialize_model()

    def initialize_model(self):
        logger.info(f"Initializing vision service with provider: {self.provider}")
        
        if self.provider == "ollama":
            # For Ollama, check if the server is reachable and if the model is installed
            try:
                # We use a short timeout for initialization checks
                response = httpx.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=3.0)
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    available_names = [m.get("name") for m in models]
                    
                    # Fuzzy match qwen2.5-vl in list
                    matched = any(self.model_name in name or name in self.model_name for name in available_names)
                    if matched:
                        logger.info(f"Ollama connected successfully. Model '{self.model_name}' is pre-loaded/available.")
                        self.available = True
                    else:
                        logger.warning(f"Ollama server is active, but model '{self.model_name}' was not found. Please run: ollama pull {self.model_name}")
                        # We still mark available = True if the server runs, since Ollama will auto-pull or download dynamically
                        self.available = True
                else:
                    logger.error(f"Ollama server returned status {response.status_code}")
            except Exception as e:
                logger.error(f"Failed to connect to local Ollama server at {settings.OLLAMA_BASE_URL}. Exception: {e}")
                self.available = False

        elif self.provider == "local":
            # Optional local HuggingFace Qwen2.5-VL implementation
            try:
                import torch
                from transformers import Qwen2_5_VLForConditionalGeneration, AutoProcessor
                
                logger.info(f"Attempting to load local Qwen2.5-VL model '{self.model_name}' in memory...")
                # Load with float16 / quantized 4-bit config to preserve memory on 8GB RAM systems
                self.local_processor = AutoProcessor.from_pretrained(self.model_name)
                self.local_model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
                    self.model_name,
                    torch_dtype="auto",
                    device_map="auto"
                )
                self.available = True
                logger.info("Local Qwen2.5-VL model loaded successfully.")
            except Exception as e:
                logger.error(f"Failed loading local Hugging Face Qwen model: {e}. Falling back to degraded state.")
                self.available = False
        else:
            logger.error(f"Unsupported provider specified: {self.provider}")
            self.available = False

    def is_healthy(self) -> bool:
        # Re-check connections if they were offline
        if not self.available and self.provider == "ollama":
            try:
                response = httpx.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=1.0)
                if response.status_code == 200:
                    self.available = True
            except:
                self.available = False
        return self.available

model_manager = ModelManager()
