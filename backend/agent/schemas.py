"""Pydantic models shared across retrieval, the agent loop, and the API."""

import uuid
from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field


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


class VerdictStatus(str, Enum):
    met = "met"
    not_met = "not_met"
    cannot_verify = "cannot_verify"


class Criterion(BaseModel):
    """One medical-necessity criterion produced by policy decomposition."""

    criterion_id: str
    requirement_text: str
    evidence_needed: str
    doc_types_to_search: list[str]


class Verdict(BaseModel):
    """The agent's determination on a single criterion."""

    criterion_id: str
    requirement_text: str
    status: VerdictStatus
    rationale: str
    citations: list[Citation] = Field(default_factory=list)
    documentation_request: str | None = None


class EventType(str, Enum):
    plan = "plan"
    criteria = "criteria"
    criterion_start = "criterion_start"
    retrieval = "retrieval"
    tool_call = "tool_call"
    verdict = "verdict"
    decision = "decision"
    letter = "letter"
    gap_report = "gap_report"
    done = "done"
    error = "error"


class TraceEvent(BaseModel):
    """One step in the agent's reasoning, emitted by the loop and consumed
    by both the CLI and the SSE endpoint."""

    event_id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    type: EventType
    payload: dict


class AppealStrength(str, Enum):
    STRONG = "STRONG"
    MODERATE = "MODERATE"
    WEAK = "WEAK"


class CaseResult(BaseModel):
    """The final state the frontend renders after a run completes."""

    case_id: str
    ingest: dict
    criteria: list[Criterion]
    verdicts: list[Verdict]
    deadline: dict
    strength: AppealStrength
    coverage: float
    coverage_met: int
    coverage_total: int
    letter: str | None = None
    gap_report: dict | None = None
