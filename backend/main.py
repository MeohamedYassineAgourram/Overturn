"""FastAPI app: case list, SSE trace stream, source viewer, health.

The SSE endpoint consumes the exact same AppealAgent.run async generator the
CLI (run_case.py) uses — there is no separate logic path for the API.
"""

import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from backend import config
from backend.agent.loop import AppealAgent
from backend.retrieval.index import RetrievalIndex

# Static case metadata for the selector. The agent derives everything else at
# run time from the corpus; this is only what the header needs before a run.
CASES = [
    {
        "id": "A",
        "title": "Callahan — Lumbar MRI denial",
        "patient": "Robert Callahan",
        "cpt": "72148",
        "denial_date": "2026-05-12",
    },
    {
        "id": "B",
        "title": "Mercer — Lumbar MRI denial",
        "patient": "Diane Mercer",
        "cpt": "72148",
        "denial_date": "2026-05-20",
    },
]
VALID_CASES = {c["id"] for c in CASES}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Build the retrieval index once at startup and share it across requests.
    app.state.index = RetrievalIndex()
    yield


app = FastAPI(title="Overturn — Denial Appeal Agent", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # open for localhost dev
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "model": config.CHAT_MODEL,
        "embeddings": config.EMBEDDINGS_ENABLED,
        "rerank": config.RERANK_MODEL if config.RERANK_ENABLED else False,
    }


@app.get("/api/cases")
async def cases():
    return CASES


@app.get("/api/document/{doc_id}")
async def document(doc_id: str):
    doc = app.state.index.get_document(doc_id)
    if doc is None:
        raise HTTPException(status_code=404, detail=f"Unknown document: {doc_id}")
    return {"doc_id": doc_id, "title": doc["title"], "doc_type": doc["doc_type"], "markdown": doc["markdown"]}


@app.get("/api/run/{case_id}")
async def run(case_id: str):
    case_id = case_id.upper()
    if case_id not in VALID_CASES:
        raise HTTPException(status_code=404, detail=f"Unknown case: {case_id}")

    agent = AppealAgent(index=app.state.index)

    async def event_stream():
        async for event in agent.run(case_id):
            yield {
                "event": event.type.value,
                "id": event.event_id,
                "data": json.dumps(event.payload, default=str),
            }

    return EventSourceResponse(event_stream())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
