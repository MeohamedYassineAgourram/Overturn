"""Pydantic models shared across retrieval, the agent loop, and the API.

Phase 2 defines the retrieval-facing models (Chunk, Citation). The agent
loop's TraceEvent / Verdict / CaseResult models are added in Phase 3.
"""

from pydantic import BaseModel


class Citation(BaseModel):
    """A pinpoint reference to a passage that supports a verdict or a
    letter argument. `quote` is a <=25-word load-bearing extract."""

    doc_id: str
    doc_title: str
    section_heading: str
    quote: str


class Chunk(BaseModel):
    """A section-aware slice of a corpus document. Every chunk is a
    potential citation."""

    doc_id: str
    doc_title: str
    doc_type: str
    case: str
    section_heading: str
    text: str
