"""Phase 0 connectivity check: list models, one chat call, one embedding call.

Run: python -m backend.smoke
"""

import asyncio
import sys

from backend import config
from backend.llm import vultr_client
from backend.llm.vultr_client import VultrInferenceError

# Preference order for the chat model: Nemotron family first (if served and
# it passes the chat call), then other strong instruct models.
CHAT_PREFERENCES = ["nemotron", "llama-3.3-70b", "llama-3.1-70b", "qwen", "mistral", "llama"]
EMBED_HINTS = ["vultronretriever", "retriever", "embed", "bge", "e5", "gte", "minilm"]


def _model_ids(models: list[dict]) -> list[str]:
    return [m.get("id") or m.get("model") or str(m) for m in models]


def _pick(ids: list[str], preferences: list[str]) -> list[str]:
    ranked = []
    for pref in preferences:
        ranked.extend(i for i in ids if pref in i.lower() and i not in ranked)
    ranked.extend(i for i in ids if i not in ranked)
    return ranked


async def main() -> None:
    if not config.VULTR_API_KEY:
        sys.exit("VULTR_API_KEY missing — copy .env.example to .env and fill it in.")

    models = await vultr_client.list_models()
    ids = _model_ids(models)
    print(f"Models served ({len(ids)}):")
    for model_id in ids:
        print(f"  - {model_id}")

    # Chat: pinned config model first, then preference order.
    chat_model = None
    candidates = _pick(ids, CHAT_PREFERENCES)
    if config.CHAT_MODEL in candidates:
        candidates.remove(config.CHAT_MODEL)
        candidates.insert(0, config.CHAT_MODEL)
    for candidate in candidates:
        if any(hint in candidate.lower() for hint in EMBED_HINTS):
            continue
        try:
            reply = await vultr_client.chat(
                [{"role": "user", "content": "Reply with exactly: OVERTURN OK"}],
                model=candidate,
                max_tokens=2000,
            )
            print(f"\nChat OK on '{candidate}': {reply.strip()[:120]}")
            chat_model = candidate
            break
        except VultrInferenceError as exc:
            print(f"\nChat failed on '{candidate}': {exc}")
    if not chat_model:
        sys.exit("No chat model worked — cannot proceed.")

    # Embeddings: try any model that looks like an embedder, else report BM25-only.
    embed_candidates = [i for i in ids if any(h in i.lower() for h in EMBED_HINTS)]
    embedding_model = None
    for candidate in embed_candidates:
        try:
            vectors = await vultr_client.embed(["overturn smoke test"], model=candidate)
            print(f"Embeddings OK on '{candidate}': dim={len(vectors[0])}")
            embedding_model = candidate
            break
        except VultrInferenceError as exc:
            print(f"Embeddings failed on '{candidate}': {exc}")
    if not embedding_model:
        print("embeddings unavailable — BM25-only mode")

    # VultronRetriever models are served as rerankers (POST /v1/rerank).
    rerank_model = None
    for candidate in embed_candidates:
        try:
            ranked = await vultr_client.rerank(
                "physical therapy dates", ["PT ran 2026-03-14 to 2026-04-30", "patient enjoys gardening"],
                model=candidate,
            )
            print(f"Rerank OK on '{candidate}': top index {ranked[0][0]} score {ranked[0][1]:.3f}")
            rerank_model = candidate
            break
        except VultrInferenceError as exc:
            print(f"Rerank failed on '{candidate}': {exc}")
    if not rerank_model:
        print("rerank unavailable — pure BM25 ordering")

    print(
        f"\nRecord in config.py -> CHAT_MODEL = \"{chat_model}\", "
        f"EMBEDDING_MODEL = {embedding_model!r}, RERANK_MODEL = {rerank_model!r}"
    )


if __name__ == "__main__":
    asyncio.run(main())
