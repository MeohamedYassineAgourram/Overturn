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

# Confirmed by backend/smoke.py in Phase 0 (2026-07-04).
# Endpoint serves 13 models; both Nemotron models return clean JSON.
# Cascade chosen over Nano-Omni-Reasoning: same quality on extraction,
# slightly faster, no reasoning-mode token risk in a deterministic demo.
CHAT_MODEL: str = "nvidia/Nemotron-Cascade-2-30B-A3B"

# POST /v1/embeddings is not served (404) — embeddings stay off unless
# Vultr exposes them later; retrieval must work BM25-only regardless.
EMBEDDING_MODEL: str | None = None
EMBEDDINGS_ENABLED: bool = False

# VultronRetriever models ARE served, as rerankers via POST /v1/rerank.
# Retrieval uses BM25 candidates + VultronRetriever rerank when enabled;
# disabling this flag falls back to pure BM25 ordering.
RERANK_MODEL: str = "vultr/VultronRetrieverPrime-Qwen3.5-8B"
RERANK_ENABLED: bool = True

TEMPERATURE: float = 0.2
# Nemotron-Cascade is a reasoning model; "none" disables the thinking phase so
# it emits the answer directly — faster, cheaper, and deterministic for a demo.
REASONING_EFFORT: str = "none"
REQUEST_TIMEOUT_SECONDS: float = 60.0
MAX_RETRIES: int = 3

CORPUS_DIR = PROJECT_ROOT / "corpus"
