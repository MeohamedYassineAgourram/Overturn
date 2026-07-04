"""Headless CLI that runs the agent on a case and pretty-prints the trace.

Usage: python -m backend.run_case A
"""

import asyncio
import sys

from backend.agent.loop import AppealAgent
from backend.agent.schemas import EventType

ICON = {
    EventType.plan: "🧭 PLAN",
    EventType.criteria: "📋 CRITERIA",
    EventType.criterion_start: "▶  CRITERION",
    EventType.retrieval: "🔍 RETRIEVAL",
    EventType.tool_call: "🛠  TOOL",
    EventType.verdict: "⚖  VERDICT",
    EventType.decision: "🎯 DECISION",
    EventType.letter: "✍  LETTER",
    EventType.gap_report: "📝 GAP REPORT",
    EventType.done: "✅ DONE",
    EventType.error: "❌ ERROR",
}
STATUS_MARK = {"met": "✓ MET", "not_met": "✗ NOT MET", "cannot_verify": "? CANNOT VERIFY"}


def line(char: str = "─") -> None:
    print(char * 78)


def render(event) -> None:
    p = event.payload
    header = ICON.get(event.type, event.type.value)
    if event.type == EventType.plan:
        line()
        print(f"{header}")
        ing = p["ingest"]
        print(f"  Ingested: {ing.get('member')} · claim {ing.get('claim_id')} · "
              f"{ing.get('cpt')}/{ing.get('icd10')} · denied {ing.get('denial_date')}")
        print(f"  Reason:   {ing.get('denial_reason')}")
        print(f"  Plan:     {p['plan']}")
    elif event.type == EventType.criteria:
        line()
        print(f"{header} — {len(p['criteria'])} criteria to verify")
        for c in p["criteria"]:
            print(f"  §{c['criterion_id']}  {c['requirement_text']}")
            print(f"        search: {', '.join(c['doc_types_to_search'])}")
    elif event.type == EventType.criterion_start:
        line()
        print(f"{header} §{p['criterion_id']}: {p['requirement_text']}")
    elif event.type == EventType.retrieval:
        tag = "reranked by VultronRetriever" if p["reranked"] else "BM25 order (rerank fallback)"
        print(f"  {header} #{p['retrieval_number']} [{tag}]  query: {p['query']!r}")
        if not p["chunks"]:
            print("      → (no passages — required documentation absent)")
        for c in p["chunks"]:
            print(f"      → {c['doc_title']} § {c['section_heading']}")
            print(f"        {c['preview']}")
    elif event.type == EventType.tool_call:
        print(f"  {header} {p['tool']}({p.get('inputs')})")
        print(f"        → {p['outputs']}")
    elif event.type == EventType.verdict:
        print(f"  {header}: {STATUS_MARK.get(p['status'], p['status'])} — {p['rationale']}")
        for c in p["citations"]:
            print(f"        cite: [{c['doc_title']} §{c['section_heading']}] \"{c['quote']}\"")
        if p.get("documentation_request"):
            print(f"        need: {p['documentation_request']}")
    elif event.type == EventType.decision:
        line("═")
        print(f"{header}: {p['strength']}  ·  coverage {p['met']}/{p['total']} ({p['coverage']})")
        line("═")
    elif event.type == EventType.letter:
        if p.get("done"):
            print("  ── letter complete ──")
        else:
            print(f"\n{p['delta']}")
    elif event.type == EventType.gap_report:
        print(f"{header}  strength {p['strength']}  ·  coverage {p['coverage']}")
        print(f"  Recommendation: {p['recommendation']}")
        print(f"  Deadline: {p['deadline']} ({p['days_remaining']} days remaining)")
        print("  Evidence checklist:")
        for item in p["checklist"]:
            print(f"    ☐ {item}")
    elif event.type == EventType.done:
        line()
        print(f"{header}")
    elif event.type == EventType.error:
        print(f"{header}: {p.get('message')}")


async def main(case_id: str) -> None:
    agent = AppealAgent()
    async for event in agent.run(case_id):
        render(event)


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1].upper() not in {"A", "B"}:
        sys.exit("Usage: python -m backend.run_case [A|B]")
    asyncio.run(main(sys.argv[1]))
