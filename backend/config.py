"""Central configuration. Values come from .env; model names are recorded
here once Phase 0's smoke test confirms what the endpoint actually serves."""

import os
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

VULTR_API_KEY: str = os.getenv("VULTR_API_KEY", "")
VULTR_INFERENCE_BASE_URL: str = os.getenv(
    "VULTR_INFERENCE_BASE_URL", "https://api.vultrinference.com/v1"
).rstrip("/")

# Confirmed by backend/smoke.py in Phase 0.
CHAT_MODEL: str = ""
EMBEDDING_MODEL: str | None = None

TEMPERATURE: float = 0.2
REQUEST_TIMEOUT_SECONDS: float = 60.0
MAX_RETRIES: int = 3

CORPUS_DIR = PROJECT_ROOT / "corpus"
