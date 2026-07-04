"""The Overturn agent loop: an explicit state machine that emits a TraceEvent
for every step. Both the CLI (run_case.py) and the SSE endpoint consume this
async generator. The loop plans, decomposes the cited policy, runs a targeted
retrieval per criterion, calls deterministic tools, issues tool-reconciled
verdicts, decides appeal strength, and produces a letter or a gap report.

No agent framework: the control flow is hand-written and fully visible.
"""

import json
import logging
import re
from collections.abc import AsyncIterator

from backend.agent import prompts, tools
from backend.agent.schemas import (
    AppealStrength,
    CaseResult,
    Citation,
    Criterion,
    EventType,
    TraceEvent,
    Verdict,
    VerdictStatus,
)
from backend.retrieval.index import RetrievalIndex, build_citation
from backend.llm import vultr_client

logger = logging.getLogger(__name__)

FILING_WINDOW_DAYS = 180
ALLOWED_DOC_TYPES = {"chart", "pt_notes", "radiology_log", "denial_letter", "policy"}
MAX_RETRIEVALS_PER_CRITERION = 2

DOC_LABEL = {
    "policy": "Policy MP-142",
    "denial_letter": "Denial Letter",
    "chart": "Chart",
    "pt_notes": "PT Notes",
    "radiology_log": "Radiology Log",
}
_MARKER_RE = re.compile(r"\[[^\]]+§[^\]]+\]")
_CRIT_ID_RE = re.compile(r"(\d+\.\d+)")


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z0-9]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    return text.strip()


async def _llm_json(user: str, retries: int = 1):
    """Chat call that must return JSON. Strips fences, extracts the first JSON
    value if the model adds prose, and retries once with a repair prompt."""
    messages = [
        {"role": "system", "content": prompts.SYSTEM},
        {"role": "user", "content": user},
    ]
    last_error: Exception | None = None
    for _ in range(retries + 1):
        raw = await vultr_client.chat(messages)
        cleaned = _strip_fences(raw)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            last_error = exc
            match = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError:
                    pass
            messages.append({"role": "assistant", "content": raw})
            messages.append({"role": "user", "content": prompts.JSON_REPAIR.format(error=str(exc))})
    raise ValueError(f"LLM did not return valid JSON after repair: {last_error}")


async def _llm_text(user: str) -> str:
    return await vultr_client.chat(
        [
            {"role": "system", "content": prompts.SYSTEM},
            {"role": "user", "content": user},
        ]
    )


def _norm_id(criterion_id: str) -> str:
    match = _CRIT_ID_RE.search(criterion_id or "")
    return match.group(1) if match else criterion_id


def _marker(citation: Citation, doc_type: str) -> str:
    label = DOC_LABEL.get(doc_type, citation.doc_title)
    return f"[{label} §{citation.section_heading}]"


def _find_chunk_with(chunks, *needles):
    """First chunk whose text contains every needle (case-insensitive)."""
    for chunk in chunks:
        haystack = chunk.text.lower()
        if all(needle and needle.lower() in haystack for needle in needles):
            return chunk
    return None


def _snippets(chunks, limit: int = 520) -> str:
    if not chunks:
        return "(no passages retrieved)"
    return "\n".join(
        f"[{i + 1}] ({c.doc_title} § {c.section_heading}) {' '.join(c.text.split())[:limit]}"
        for i, c in enumerate(chunks)
    )


class AppealAgent:
    def __init__(self, index: RetrievalIndex | None = None) -> None:
        self.index = index or RetrievalIndex()

    async def run(self, case_id: str) -> AsyncIterator[TraceEvent]:
        try:
            async for event in self._run(case_id):
                yield event
        except Exception as exc:  # noqa: BLE001 - never crash the stream
            logger.exception("Agent run failed")
            yield TraceEvent(type=EventType.error, payload={"message": str(exc)})

    async def _run(self, case_id: str) -> AsyncIterator[TraceEvent]:
        case_id = case_id.upper()

        # --- Step 1: INGEST ------------------------------------------------
        denial_text = self.index.load_text(["denial_letter"], case_id)
        ingest = await _llm_json(prompts.INGEST.format(denial_text=denial_text))
        plan = await _llm_json(
            prompts.PLAN_SUMMARY.format(
                member=ingest.get("member"),
                claim_id=ingest.get("claim_id"),
                cpt=ingest.get("cpt"),
                policy_cited=ingest.get("policy_cited"),
            )
        )
        yield TraceEvent(type=EventType.plan, payload={"plan": plan.get("plan", ""), "ingest": ingest})

        # --- Step 2: POLICY DECOMPOSITION ---------------------------------
        policy_text = self.index.load_text(["policy"], case_id)
        criteria_raw = await _llm_json(prompts.DECOMPOSE.format(policy_text=policy_text))
        criteria = self._parse_criteria(criteria_raw)
        yield TraceEvent(
            type=EventType.criteria,
            payload={"criteria": [c.model_dump() for c in criteria]},
        )

        # --- Step 3: PER-CRITERION VERIFICATION ---------------------------
        verdicts: list[Verdict] = []
        for criterion in criteria:
            async for event, verdict in self._verify(criterion, ingest, case_id):
                if event is not None:
                    yield event
                if verdict is not None:
                    verdicts.append(verdict)

        # --- Step 4: DEADLINE ---------------------------------------------
        deadline = tools.appeal_deadline(ingest["denial_date"], FILING_WINDOW_DAYS)
        yield TraceEvent(
            type=EventType.tool_call,
            payload={
                "tool": "appeal_deadline",
                "inputs": {"denial_date": ingest["denial_date"], "window_days": FILING_WINDOW_DAYS},
                "outputs": deadline,
            },
        )

        # --- Step 5: DECISION ---------------------------------------------
        strength, coverage_met, coverage_total = self._decide(verdicts)
        coverage = round(coverage_met / coverage_total, 2) if coverage_total else 0.0
        yield TraceEvent(
            type=EventType.decision,
            payload={
                "strength": strength.value,
                "coverage": coverage,
                "met": coverage_met,
                "total": coverage_total,
            },
        )

        # --- Step 6: OUTPUT -----------------------------------------------
        letter_text: str | None = None
        gap_report: dict | None = None
        if strength == AppealStrength.STRONG:
            letter_text = await self._draft_letter(ingest, verdicts, deadline)
            for i, para in enumerate(p for p in letter_text.split("\n\n") if p.strip()):
                yield TraceEvent(
                    type=EventType.letter,
                    payload={"index": i, "delta": para.strip(), "done": False},
                )
            yield TraceEvent(type=EventType.letter, payload={"done": True, "letter": letter_text})
        else:
            gap_report = self._build_gap_report(verdicts, deadline, strength, coverage)
            yield TraceEvent(type=EventType.gap_report, payload=gap_report)

        # --- Step 7: DONE -------------------------------------------------
        result = CaseResult(
            case_id=case_id,
            ingest=ingest,
            criteria=criteria,
            verdicts=verdicts,
            deadline=deadline,
            strength=strength,
            coverage=coverage,
            coverage_met=coverage_met,
            coverage_total=coverage_total,
            letter=letter_text,
            gap_report=gap_report,
        )
        yield TraceEvent(type=EventType.done, payload={"result": result.model_dump()})

    # ----------------------------------------------------------------------
    def _parse_criteria(self, raw) -> list[Criterion]:
        items = raw if isinstance(raw, list) else raw.get("criteria", [])
        criteria: list[Criterion] = []
        for item in items:
            doc_types = [d for d in item.get("doc_types_to_search", []) if d in ALLOWED_DOC_TYPES]
            if not doc_types:
                doc_types = ["chart"]
            criteria.append(
                Criterion(
                    criterion_id=str(item.get("criterion_id", "")).strip(),
                    requirement_text=item.get("requirement_text", "").strip(),
                    evidence_needed=item.get("evidence_needed", "").strip(),
                    doc_types_to_search=doc_types,
                )
            )
        return criteria

    async def _formulate_query(self, criterion: Criterion) -> str:
        query_obj = await _llm_json(
            prompts.QUERY.format(
                criterion_id=criterion.criterion_id,
                requirement_text=criterion.requirement_text,
                evidence_needed=criterion.evidence_needed,
            )
        )
        return query_obj.get("query", criterion.requirement_text)

    def _retrieval_event(self, criterion: Criterion, query: str, result, number: int) -> TraceEvent:
        return TraceEvent(
            type=EventType.retrieval,
            payload={
                "criterion_id": criterion.criterion_id,
                "retrieval_number": number,
                "query": query,
                "doc_types": criterion.doc_types_to_search,
                "reranked": result.reranked,
                "fallback_reason": result.fallback_reason,
                "chunks": [
                    {
                        "doc_id": c.doc_id,
                        "doc_title": c.doc_title,
                        "section_heading": c.section_heading,
                        "preview": " ".join(c.text.split())[:180],
                    }
                    for c in result.chunks
                ],
            },
        )

    async def _verify(self, criterion: Criterion, ingest: dict, case_id: str):
        yield TraceEvent(
            type=EventType.criterion_start,
            payload={"criterion_id": criterion.criterion_id, "requirement_text": criterion.requirement_text},
        ), None

        cid = _norm_id(criterion.criterion_id)
        # Evidence comes from the patient's records and the policy — never the
        # denial letter, which is the document being appealed.
        doc_types = [d for d in criterion.doc_types_to_search if d != "denial_letter"]
        if not doc_types:
            doc_types = criterion.doc_types_to_search or ["chart"]

        query = await self._formulate_query(criterion)
        result = await self.index.search(query, doc_types, case_id, top_k=4)
        yield self._retrieval_event(criterion, query, result, 1), None
        chunks = result.chunks

        status: VerdictStatus | None = None
        rationale = ""
        documentation_request: str | None = None
        cite_chunk = None
        quote_query = query  # what the citation quote is extracted around

        if cid == "4.1":
            dates = await _llm_json(prompts.EXTRACT_DATES.format(snippets=_snippets(chunks)))
            # Extraction-driven refine: only re-retrieve when the first pass
            # lacked the dates (deterministic — fires only when truly needed).
            if not (dates.get("found") and dates.get("start_date") and dates.get("end_date")):
                refined = "physical therapy discharge summary initial evaluation start end dates duration"
                result = await self.index.search(refined, doc_types, case_id, top_k=4)
                yield self._retrieval_event(criterion, refined, result, 2), None
                chunks = result.chunks
                dates = await _llm_json(prompts.EXTRACT_DATES.format(snippets=_snippets(chunks)))
            if dates.get("found") and dates.get("start_date") and dates.get("end_date"):
                tool_result = tools.date_window_calculator(dates["start_date"], dates["end_date"], 6.0)
                yield self._tool_event("date_window_calculator", tool_result), None
                status = VerdictStatus.met if tool_result["satisfied"] else VerdictStatus.not_met
                cite_chunk = _find_chunk_with(chunks, dates["start_date"], dates["end_date"]) or _find_chunk_with(
                    chunks, dates["end_date"]
                )
                quote_query = f"{dates['start_date']} {dates['end_date']} treatment session discharge duration"
                verb = "meeting" if tool_result["satisfied"] else "short of"
                rationale = (
                    f"Provider-directed conservative therapy ran {tool_result['start_date']} to "
                    f"{tool_result['end_date']} — {tool_result['days']} days ({tool_result['weeks']} weeks), "
                    f"{verb} the {tool_result['required_weeks']:.0f}-week minimum."
                )
            else:
                status = VerdictStatus.cannot_verify
                documentation_request = (
                    "Obtain physical-therapy records documenting the start and end dates of the "
                    "provider-directed conservative-therapy course."
                )
        elif cid == "4.3":
            if not chunks:
                status = VerdictStatus.cannot_verify
                documentation_request = (
                    "Obtain the member's lumbar imaging history for the 12 months preceding the request."
                )
            else:
                mri = await _llm_json(prompts.EXTRACT_MRI.format(snippets=_snippets(chunks)))
                if mri.get("found") and mri.get("mri_date"):
                    tool_result = tools.months_since(mri["mri_date"], ingest["denial_date"])
                    yield self._tool_event("months_since", tool_result), None
                    within_window = tool_result["months"] <= 12
                    status = VerdictStatus.not_met if within_window else VerdictStatus.met
                    cite_chunk = _find_chunk_with(chunks, mri["mri_date"])
                    quote_query = f"{mri['mri_date']} lumbar MRI performed imaging"
                    if within_window:
                        rationale = (
                            f"A prior lumbar MRI on {mri['mri_date']} was {tool_result['months']} months before "
                            f"the request — within the 12-month window, so this criterion is not met."
                        )
                    else:
                        rationale = (
                            f"The most recent prior lumbar MRI was {mri['mri_date']}, {tool_result['months']} "
                            f"months before the request — outside the 12-month window, so no recent MRI bars the study."
                        )
                else:
                    status = VerdictStatus.cannot_verify
                    documentation_request = (
                        "Obtain the member's lumbar imaging history for the 12 months preceding the request."
                    )
        elif cid == "4.4":
            tool_result = tools.code_consistency_check(ingest["cpt"], ingest["icd10"])
            yield self._tool_event("code_consistency_check", tool_result), None
            status = VerdictStatus.met if tool_result["consistent"] else VerdictStatus.not_met
            cite_chunk = _find_chunk_with(chunks, ingest["cpt"]) or (chunks[0] if chunks else None)
            quote_query = f"CPT {ingest['cpt']} {ingest['icd10']} order diagnosis"
            consistent = "consistent with" if tool_result["consistent"] else "not consistent with"
            rationale = (
                f"Requested CPT {ingest['cpt']} ({tool_result.get('cpt_description')}) is {consistent} the "
                f"documented diagnosis {ingest['icd10']}."
            )
        else:
            # §4.2 and any non-mechanical criterion: a genuine evidence
            # judgment, so the LLM issues the verdict.
            verdict_obj = await _llm_json(
                prompts.VERDICT.format(
                    criterion_id=criterion.criterion_id,
                    requirement_text=criterion.requirement_text,
                    evidence_needed=criterion.evidence_needed,
                    snippets=_snippets(chunks),
                    tool_result="(no tool used for this criterion)",
                )
            )
            try:
                status = VerdictStatus(verdict_obj.get("status"))
            except ValueError:
                status = VerdictStatus.cannot_verify
            rationale = verdict_obj.get("rationale", "").strip()
            cite_chunk = chunks[0] if chunks else None

        citations: list[Citation] = []
        if status in (VerdictStatus.met, VerdictStatus.not_met):
            source = cite_chunk or (chunks[0] if chunks else None)
            if source is not None:
                citations = [build_citation(source, quote_query)]

        verdict = Verdict(
            criterion_id=criterion.criterion_id,
            requirement_text=criterion.requirement_text,
            status=status,
            rationale=rationale,
            citations=citations,
            documentation_request=documentation_request if status == VerdictStatus.cannot_verify else None,
        )
        yield TraceEvent(type=EventType.verdict, payload=verdict.model_dump()), verdict

    def _tool_event(self, tool_name: str, tool_result: dict) -> TraceEvent:
        inputs = {k: v for k, v in tool_result.items() if k in
                  {"start_date", "end_date", "required_weeks", "event_date", "reference_date", "cpt", "icd10"}}
        return TraceEvent(
            type=EventType.tool_call,
            payload={"tool": tool_name, "inputs": inputs, "outputs": tool_result},
        )

    def _decide(self, verdicts: list[Verdict]) -> tuple[AppealStrength, int, int]:
        total = len(verdicts)
        met = [v for v in verdicts if v.status == VerdictStatus.met]
        not_met = [v for v in verdicts if v.status == VerdictStatus.not_met]
        cannot = [v for v in verdicts if v.status == VerdictStatus.cannot_verify]
        if not_met or len(cannot) >= 2:
            strength = AppealStrength.WEAK
        elif len(met) == total and total > 0:
            strength = AppealStrength.STRONG
        else:
            strength = AppealStrength.MODERATE
        return strength, len(met), total

    async def _draft_letter(self, ingest: dict, verdicts: list[Verdict], deadline: dict) -> str:
        code_info = tools.code_consistency_check(ingest["cpt"], ingest["icd10"])
        arguments = []
        for v in (x for x in verdicts if x.status == VerdictStatus.met):
            cite = v.citations[0] if v.citations else None
            doc_type = self.index.get_document(cite.doc_id)["doc_type"] if cite else "policy"
            marker = _marker(cite, doc_type) if cite else f"[Policy MP-142 §{v.criterion_id}]"
            quote = cite.quote if cite else ""
            arguments.append(
                f"- Criterion §{v.criterion_id} ({v.requirement_text}) — MET. {v.rationale} "
                f'Evidence quote: "{quote}". Citation marker to place inline: {marker}'
            )
        letter = await _llm_text(
            prompts.LETTER.format(
                payer=ingest["payer"],
                member=ingest["member"],
                claim_id=ingest["claim_id"],
                cpt=ingest["cpt"],
                cpt_description=code_info.get("cpt_description") or ingest["cpt"],
                icd10=ingest["icd10"],
                denial_date=ingest["denial_date"],
                denial_reason=ingest["denial_reason"],
                deadline=deadline["deadline"],
                days_remaining=deadline["days_remaining"],
                arguments="\n".join(arguments),
            )
        )
        letter = _strip_fences(letter).strip()
        # Guarantee every met criterion's citation marker survives (>=4 markers).
        required_markers = [line.split("Citation marker to place inline: ")[1] for line in arguments]
        missing = [m for m in required_markers if m not in letter]
        if missing:
            letter += "\n\nSupporting citations: " + " ".join(missing)
        return letter

    def _build_gap_report(
        self, verdicts: list[Verdict], deadline: dict, strength: AppealStrength, coverage: float
    ) -> dict:
        unmet = [
            {
                "criterion_id": v.criterion_id,
                "requirement_text": v.requirement_text,
                "rationale": v.rationale,
                "citations": [c.model_dump() for c in v.citations],
            }
            for v in verdicts
            if v.status == VerdictStatus.not_met
        ]
        unverifiable = [
            {
                "criterion_id": v.criterion_id,
                "requirement_text": v.requirement_text,
                "documentation_request": v.documentation_request,
            }
            for v in verdicts
            if v.status == VerdictStatus.cannot_verify
        ]
        checklist = [
            f"§{v['criterion_id']}: {v['rationale']} — obtain records that satisfy: {v['requirement_text']}"
            for v in unmet
        ] + [f"§{v['criterion_id']}: {v['documentation_request']}" for v in unverifiable]
        return {
            "strength": strength.value,
            "coverage": coverage,
            "unmet": unmet,
            "unverifiable": unverifiable,
            "checklist": checklist,
            "deadline": deadline["deadline"],
            "days_remaining": deadline["days_remaining"],
            "recommendation": "Do not file yet.",
        }
