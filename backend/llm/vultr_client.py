"""The only module that talks to Vultr Serverless Inference.

OpenAI-compatible surface: GET /models, POST /chat/completions,
POST /embeddings. All calls retry up to MAX_RETRIES with exponential
backoff and use a 60s timeout. If the endpoint surprises us, only this
file changes.
"""

import asyncio
import logging
from typing import Any

import httpx

from backend import config

logger = logging.getLogger(__name__)

RETRYABLE_STATUS = {429, 500, 502, 503, 504}


class VultrInferenceError(Exception):
    """Raised when the inference API fails after all retries."""


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {config.VULTR_API_KEY}",
        "Content-Type": "application/json",
    }


async def _request(method: str, path: str, json: dict[str, Any] | None = None) -> dict[str, Any]:
    url = f"{config.VULTR_INFERENCE_BASE_URL}{path}"
    last_error: Exception | None = None
    async with httpx.AsyncClient(timeout=config.REQUEST_TIMEOUT_SECONDS) as client:
        for attempt in range(config.MAX_RETRIES):
            try:
                response = await client.request(method, url, headers=_headers(), json=json)
                if response.status_code in RETRYABLE_STATUS:
                    last_error = VultrInferenceError(
                        f"{method} {path} -> HTTP {response.status_code}: {response.text[:300]}"
                    )
                else:
                    response.raise_for_status()
                    return response.json()
            except httpx.HTTPStatusError:
                raise VultrInferenceError(
                    f"{method} {path} -> HTTP {response.status_code}: {response.text[:300]}"
                ) from None
            except httpx.HTTPError as exc:
                last_error = exc
            if attempt < config.MAX_RETRIES - 1:
                delay = 2**attempt
                logger.warning("Retrying %s %s in %ss (%s)", method, path, delay, last_error)
                await asyncio.sleep(delay)
    raise VultrInferenceError(f"{method} {path} failed after {config.MAX_RETRIES} attempts: {last_error}")


async def list_models() -> list[dict[str, Any]]:
    data = await _request("GET", "/models")
    return data.get("data", data.get("models", []))


async def chat(
    messages: list[dict[str, str]],
    model: str | None = None,
    temperature: float | None = None,
    max_tokens: int = 2048,
) -> str:
    payload = {
        "model": model or config.CHAT_MODEL,
        "messages": messages,
        "temperature": config.TEMPERATURE if temperature is None else temperature,
        "max_tokens": max_tokens,
    }
    data = await _request("POST", "/chat/completions", json=payload)
    return data["choices"][0]["message"]["content"]


async def embed(texts: list[str], model: str | None = None) -> list[list[float]]:
    """Returns one embedding vector per input text.

    Raises VultrInferenceError if the endpoint does not serve embeddings —
    callers must fall back to BM25-only retrieval, never crash.
    """
    payload = {"model": model or config.EMBEDDING_MODEL, "input": texts}
    data = await _request("POST", "/embeddings", json=payload)
    items = sorted(data["data"], key=lambda item: item.get("index", 0))
    return [item["embedding"] for item in items]
