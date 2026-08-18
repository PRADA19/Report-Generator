# Qwen2.5-VL Vision service

FastAPI service for layout-aware academic poster understanding and extraction powered by **Qwen2.5-VL** (via Ollama or local HuggingFace).

## Requirements

- Python 3.10+
- Ollama (installed locally and running)

## Setup

1. Pull the Qwen2.5-VL 2B model:
   ```bash
   ollama pull qwen2.5-vl:2b
   ```

2. Create virtual environment and install packages:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Configure `.env` if necessary (defaults run on port `8001` talking to Ollama on `11434`).

4. Run the service:
   ```bash
   python -m uvicorn app.main:app --port 8001 --host 0.0.0.0
   ```

## Endpoints

- `GET /health`: Model status and connection check.
- `POST /extract`: Accepts multipart form-data image and returns extracted fields + generated paragraphs.
