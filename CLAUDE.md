# OVERTURN — Claims Denial Appeal Agent

**RAISE Summit Hackathon 2026 · Vultr Track · Solo remote build with Claude Code**

You (Claude Code) are building this project with me. Read this entire file before writing any code. This document is the contract: if a feature is not in this file, do not build it. If something in this file is ambiguous, ask me before improvising.

---

## 1. Mission and context

**One-liner:** A web-based enterprise agent that helps hospital billing teams fight wrongful insurance denials. It reads a denial letter, retrieves the insurer's own published medical policy, checks the patient's chart against every policy criterion (each criterion triggering its own targeted retrieval), calls deterministic tools for date math and code checks, and produces either a filing-ready appeal letter with pinpoint citations or an honest "this case is weak, here's what to obtain first" report.

**Why it exists:** Insurers deny a significant share of claims. Appealed denials are frequently overturned, but most denials are never appealed because drafting an appeal means hours of manual cross-referencing between the denial letter, the payer's policy, and a thick patient chart. Hospitals write off recoverable revenue because the paperwork is too expensive to fight. Overturn makes fighting nearly free.

**Hackathon problem statement we must satisfy (Vultr track, verbatim requirements):**
- Web-based Enterprise Agent for a real-world workflow that **grounds its decisions in documents**
- "A single retrieve-then-answer call is not enough"
- Must show a **multi-step workflow** where the system **plans, retrieves more than once when it needs to, calls tools, makes decisions, and produces an outcome a real enterprise team could actually use**

**Judging weights:** Demo 50%, Impact 25%, Creativity 15%, Pitch 10%. Remote judges see only: a 1-minute demo video, the GitHub repo, and a project description. Everything we build must serve those three artifacts.

---

## 2. Non-negotiable constraints

1. **All LLM inference and embeddings run on Vultr Serverless Inference.** No OpenAI, no Anthropic API, no local LLMs, no other providers, anywhere in the code. Vultr GPUs are banned for this event — Serverless Inference only.
2. **Use the VultronRetriever models** (available through Vultr Serverless Inference; see the Hugging Face collection `vultr/vultronretriever`) for retrieval/embeddings if they are exposed on the inference endpoint. Verify what the endpoint actually serves in Phase 0 before assuming.
3. **No Streamlit** (banned project category). Frontend is React.
4. **Never use the word "RAG"** in code, comments, README, or UI copy. This project is a "multi-step document-grounded agent." "Basic RAG applications" is a banned category and we are structurally not that — our language must reflect it.
5. **No medical advice, ever.** The agent reasons about *documentation completeness against payer policy criteria*. It never recommends treatment, never interprets symptoms clinically, never addresses patients. All outputs go to a human biller who must approve before anything is filed. This exact sentence must appear in the README and the UI footer: *"This system evaluates documentation against payer policy criteria. It makes no clinical judgments. All appeals require human reviewer sign-off before filing."*
6. **The dashboard is not the main feature.** The main feature is the agent loop and the appeal letter it produces. The UI exists to make the agent's reasoning visible.
7. **Everything built during the event.** Granular commits with descriptive messages after every meaningful unit of work — the commit history is our proof. Repo is public from the first commit.
8. **All data is synthetic.** Fictional payer, fictional patients, fictional providers. No real PHI, no real insurer names, no scraped documents. We write our own corpus modeled on the *structure* of real payer policies.
9. **Deterministic demo.** Temperature ≤ 0.2 on all LLM calls. The two demo cases must produce the same outcome on every run.

---

## 3. The two demo cases (the product IS these two cases)

Everything is built around two pre-loaded cases. The 60-second demo video shows Case A for ~40 seconds and Case B for ~5 seconds. If a feature does not appear in one of these two runs, it does not get built.

### Case A — "The insurer is wrong" (hero case)

- Patient **Robert Callahan** (fictional), 52, lumbar radiculopathy (ICD-10 M54.16).
- Provider requested **CPT 72148** (MRI lumbar spine without contrast). Payer **Meridian Health Plans** (fictional) **denied** it on 2026-05-12 with reason: *"Medical necessity not established: conservative therapy not documented for the required six-week duration (Policy MP-142 §4.1)."*
- The truth, planted in the corpus: PT notes document provider-directed physical therapy from **2026-03-14 to 2026-04-30** (47 days ≈ **6.7 weeks**) — but the key evidence is buried deep in a long PT progress note, easy for a human reviewer to miss. The chart also documents a positive straight-leg raise and diminished left ankle reflex (satisfies §4.2), the radiology log shows the last lumbar MRI was **2025-04-02** (>12 months prior, satisfies §4.3), and the CPT/ICD pairing is consistent (§4.4).
- **Expected agent behavior:** decompose MP-142 into criteria §4.1–§4.4 → for each criterion, run a *targeted* retrieval into the specific document type that can answer it → the §4.1 check retrieves the PT notes, finds the buried date range, calls `date_window_calculator(2026-03-14, 2026-04-30, required_weeks=6)` → tool returns 6.7 weeks, satisfied → all four criteria **met** with citations → appeal strength **STRONG** → agent drafts a filing-ready appeal letter in which every argument cites document + section (e.g., *"PT progress notes, 2026-03-14 through 2026-04-30, satisfy MP-142 §4.1's six-week requirement — 6.7 weeks documented"*) → `appeal_deadline` tool shows days remaining in the 180-day filing window → human clicks Approve & Export.

### Case B — "The insurer is right" (honest-decline case)

- Patient **Diane Mercer** (fictional), 47, same denial reason, same policy.
- The truth: PT documented only **2026-04-01 to 2026-04-28** (27 days ≈ **3.9 weeks** → §4.1 genuinely **not met**), and **no radiology log exists in her file** (§4.3 → **cannot verify — documentation missing**). §4.2 and §4.4 are met.
- **Expected agent behavior:** the agent does **not** bluff and does **not** draft an appeal. It outputs a **gap report**: appeal strength **WEAK**, §4.1 not met (cited: only 3.9 weeks documented), §4.3 cannot be verified (specific ask: "obtain lumbar imaging history for the prior 12 months"), a concrete evidence checklist to complete before filing, and the filing deadline countdown so the biller knows how much time remains to gather it.

Case B is what makes Case A credible. An agent that can say "don't file this yet" reads as enterprise-trustworthy.

---

## 4. Architecture

```
┌─────────────────────────── Browser ────────────────────────────┐
│  React (Vite + TS + Tailwind)                                   │
│  Left pane: live agent trace (SSE)   Right pane: output builds  │
│  Citation chips → source viewer with highlighted passage        │
└────────────────────────────┬────────────────────────────────────┘
                             │ SSE (text/event-stream)
┌────────────────────────────┴────────────────────────────────────┐
│  FastAPI backend (Python 3.11+)                                  │
│  agent/loop.py      — plan → per-criterion retrieve → tools →    │
│                       verdicts → decision → letter/gap report    │
│  agent/tools.py     — deterministic tools (pure functions)       │
│  retrieval/index.py — section-aware chunking, hybrid BM25 +      │
│                       embeddings, returns chunks w/ citations    │
│  llm/vultr_client.py— THE ONLY module that talks to Vultr.       │
│                       OpenAI-compatible chat + embeddings.       │
│  corpus/            — 9 synthetic documents (see §5)             │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                Vultr Serverless Inference
                (chat model for planning/reasoning/drafting;
                 VultronRetriever for embeddings if served)
```

- **No agent frameworks** (no LangChain/LlamaIndex). The loop is hand-rolled and explicit — more transparent, easier to trace, and it demonstrates we built the agent, not imported one.
- **No database.** Corpus lives as files; the retrieval index is built in memory at startup. Two fixed cases; persistence is pointless complexity.
- **`vultr_client.py` is the only file allowed to import httpx toward the inference API.** Retries (3, exponential backoff), timeout 60s, temperature from config. If the endpoint or model names differ from assumptions, only this file changes.

### Repo layout

```
overturn/
├── CLAUDE.md                  (this file)
├── README.md                  (Phase 6)
├── .env.example               (VULTR_API_KEY=, VULTR_INFERENCE_BASE_URL=)
├── .gitignore                 (.env, node_modules, __pycache__, dist)
├── backend/
│   ├── requirements.txt       (fastapi, uvicorn, httpx, pydantic, rank-bm25, numpy, python-dotenv, sse-starlette)
│   ├── main.py                (FastAPI app, SSE endpoint)
│   ├── config.py
│   ├── llm/vultr_client.py
│   ├── retrieval/index.py
│   ├── agent/loop.py
│   ├── agent/tools.py
│   ├── agent/prompts.py       (all prompts in one place, as constants)
│   ├── agent/schemas.py       (pydantic models: TraceEvent, Verdict, Citation, CaseResult)
│   ├── smoke.py               (Phase 0 check: list models, one chat call, one embedding call)
│   └── run_case.py            (headless CLI: python -m backend.run_case A)
├── corpus/                    (9 files, see §5)
└── frontend/                  (Vite + React + TS + Tailwind)
```

---

## 5. The synthetic corpus (write these in Phase 1, exactly as specified)

All documents are Markdown with clear section headers (chunking is section-based). Realistic length matters — the PT note in particular must be long enough that the key evidence is genuinely buried. Every file starts with a comment line: `<!-- Synthetic document created for RAISE Hackathon 2026. All entities fictional. -->`

1. **`corpus/policy_MP-142_lumbar_mri.md`** — *Meridian Health Plans, Medical Policy MP-142: Magnetic Resonance Imaging of the Lumbar Spine.* Structured like a real payer policy (~700–1000 words): Purpose, Scope, Definitions, then **§4 Medical Necessity Criteria**:
   - **§4.1** — ≥ 6 weeks of provider-directed conservative therapy (physical therapy, NSAIDs, and/or activity modification) within the 6 months preceding the request, with dates documented.
   - **§4.2** — Persistent symptoms despite conservative therapy, OR documented objective neurological deficit (e.g., positive straight-leg raise, diminished deep tendon reflex, dermatomal sensory loss).
   - **§4.3** — No lumbar MRI within the prior 12 months, absent new or progressive neurological deficit.
   - **§4.4** — Requested CPT code consistent with the documented ICD-10 diagnosis.
   - **§7 Appeals** — First-level appeal must be filed within **180 days** of the date on the denial notice; appeals must reference the specific criteria disputed and attach supporting documentation.
2. **`corpus/denial_letter_case_A.md`** — Meridian letterhead style, dated **2026-05-12**, member Robert Callahan, claim #MH-2026-48213, CPT 72148, ICD-10 M54.16, denial reason quoting §4.1 ("conservative therapy not documented for the required six-week duration"), appeal rights paragraph referencing §7.
3. **`corpus/chart_case_A.md`** — Robert Callahan's chart: demographics, problem list, med list (naproxen since March 2026), visit notes. A 2026-03-10 visit note orders PT; a 2026-05-02 note records positive straight-leg raise at 40°, diminished left Achilles reflex, and "symptoms persist despite completed course of PT." The chart *references* PT but does not contain the dates — forcing the agent to go retrieve the PT notes (this is the conditional-retrieval moment).
4. **`corpus/pt_notes_case_A.md`** — Riverside Physical Therapy records: initial evaluation **2026-03-14**, twice-weekly sessions, discharge summary **2026-04-30**. Make it long (12+ dated session entries with routine detail) so the date range is buried mid-document. This is "page 12."
5. **`corpus/radiology_log_case_A.md`** — imaging history: lumbar MRI **2025-04-02** (13 months before the request), plus unrelated studies for realism.
6. **`corpus/denial_letter_case_B.md`** — same structure, dated **2026-05-20**, member Diane Mercer, claim #MH-2026-51877, same CPT/ICD, same §4.1 denial reason.
7. **`corpus/chart_case_B.md`** — Diane Mercer's chart: PT referenced, neurological findings documented (§4.2 met). **No imaging history section and no radiology log file exists for her** — that absence drives the §4.3 "cannot verify" verdict.
8. **`corpus/pt_notes_case_B.md`** — initial evaluation **2026-04-01**, last session **2026-04-28**. Only ~8 sessions.
9. **`corpus/cpt_icd_reference.json`** — small mapping used by the code-consistency tool, e.g. `{"72148": {"description": "MRI lumbar spine w/o contrast", "consistent_icd10": ["M54.16", "M54.17", "M51.26", "M48.06"]}}`.

Each corpus file is registered in a manifest (`corpus/manifest.json`) with: `doc_id`, `title`, `doc_type` (one of: `policy`, `denial_letter`, `chart`, `pt_notes`, `radiology_log`), and `case` (`A`, `B`, or `shared`). Retrieval can be filtered by `doc_type` and `case` — that filter is what makes per-criterion retrieval *targeted*.

---

## 6. Retrieval

- **Chunking:** split each Markdown document on `##`/`###` headers; each chunk carries `{doc_id, doc_title, section_heading, text}`. Long PT notes additionally split every ~10 session entries.
- **Hybrid scoring:** BM25 (rank-bm25) over all chunks **plus** cosine similarity over embeddings **if** an embedding/VultronRetriever model is available on the Vultr endpoint (discovered in Phase 0). Final score = 0.5 · normalized BM25 + 0.5 · cosine. **If no embedding model is served, run BM25-only** — the corpus is small enough that this must remain fully functional. Never block the demo on embeddings.
- **Interface:** `search(query: str, doc_types: list[str] | None, case: str, top_k: int = 4) -> list[Chunk]`. Every returned chunk is a potential citation.
- **Citation object:** `{doc_id, doc_title, section_heading, quote}` where `quote` is a ≤ 25-word extract of the load-bearing text (e.g., the line containing the PT date range). Citations flow from retrieval → verdicts → letter, and the frontend uses them for click-through highlighting.

---

## 7. The agent loop (backend/agent/loop.py)

The loop is an explicit state machine that **emits a TraceEvent for every step** (an async generator the SSE endpoint and the CLI both consume). LLM calls request JSON output; parse defensively (strip code fences, retry once on parse failure).

**Steps:**

1. **INGEST** — LLM reads the denial letter → extract `{payer, member, claim_id, cpt, icd10, denial_date, denial_reason, policy_cited}`. Emit `plan` event describing what the agent will do.
2. **POLICY DECOMPOSITION** — retrieve the policy document (`doc_types=["policy"]`), LLM decomposes §4 into a criteria list: `{criterion_id, requirement_text, evidence_needed, doc_types_to_search}`. Emit one event listing the criteria checklist.
3. **PER-CRITERION VERIFICATION** — for each criterion, in order:
   - Emit `criterion_start`.
   - LLM formulates a targeted search query; call `search()` restricted to that criterion's `doc_types_to_search` and the current case. Emit `retrieval` event with the query and the returned chunk snippets. **If the first retrieval is insufficient, the LLM may issue one refined follow-up retrieval** (cap: 2 retrievals per criterion) — emit that too; visible re-retrieval is a feature.
   - If the criterion needs computation, call the deterministic tool and emit `tool_call` with exact inputs and outputs (§4.1 → `date_window_calculator`; §4.3 → date check against the 12-month window; §4.4 → `code_consistency_check`).
   - LLM issues a verdict: `met` / `not_met` / `cannot_verify` + citations + one-sentence rationale. **Rules:** a `met` verdict requires ≥ 1 citation; if retrieval returns nothing relevant for a required document type, the verdict is `cannot_verify` with a specific `documentation_request` string — never guess. Emit `verdict`.
4. **DEADLINE** — call `appeal_deadline(denial_date, 180, today)`; emit `tool_call`.
5. **DECISION** — compute appeal strength: `STRONG` if all criteria the denial hinges on are `met` and nothing is `not_met`; `WEAK` if any criterion is `not_met` or ≥ 2 are `cannot_verify`; else `MODERATE`. Also emit a coverage score: `met_count / total`. Emit `decision`.
6. **OUTPUT** —
   - **STRONG** → LLM drafts the appeal letter (professional, addressed to Meridian Appeals Department, references claim #, disputes the specific denial reason, and makes every factual argument carry an inline citation marker like `[PT Notes §Discharge Summary]` that the frontend renders as a chip). Structure: header block → "We formally appeal…" → criterion-by-criterion evidence → request for overturn → deadline reference. Stream it via `letter` events (paragraph-sized deltas).
   - **WEAK/MODERATE** → emit a `gap_report`: unmet/unverifiable criteria with citations or documentation requests, a concrete evidence checklist, days remaining, and the explicit recommendation "Do not file yet."
7. **DONE** — emit `done` with the full `CaseResult` for the frontend to render the final state.

**TraceEvent schema (pydantic):** `{event_id, timestamp, type: plan|criteria|criterion_start|retrieval|tool_call|verdict|decision|letter|gap_report|done|error, payload: dict}`. The CLI pretty-prints these; the SSE endpoint forwards them as JSON.

---

## 8. Tools (backend/agent/tools.py — pure functions, unit-testable, no LLM inside)

```python
def date_window_calculator(start_date: str, end_date: str, required_weeks: float) -> dict
    # → {"days": 47, "weeks": 6.7, "required_weeks": 6.0, "satisfied": true}

def months_since(event_date: str, reference_date: str) -> dict
    # → {"months": 13.3, "days": 406}   (used for the §4.3 12-month window)

def code_consistency_check(cpt: str, icd10: str) -> dict
    # reads corpus/cpt_icd_reference.json
    # → {"consistent": true, "cpt_description": "..."}

def appeal_deadline(denial_date: str, window_days: int, today: str | None = None) -> dict
    # today defaults to system date
    # → {"deadline": "2026-11-08", "days_remaining": 127, "expired": false}
```

The LLM never does arithmetic. Dates in, booleans and numbers out, and the trace shows the exact inputs/outputs — judges must see deterministic tools doing deterministic work.

---

## 9. API (backend/main.py)

- `GET /api/cases` → `[{id: "A", title: "Callahan — Lumbar MRI denial", ...}, {id: "B", ...}]`
- `GET /api/run/{case_id}` → **SSE stream** of TraceEvents (use sse-starlette). One agent run per request; no auth; CORS open for localhost dev.
- `GET /api/document/{doc_id}` → `{title, markdown}` (source viewer)
- `GET /api/health` → `{status, model, embeddings: bool}`

---

## 10. Frontend (frontend/ — Vite + React + TS + Tailwind)

Single screen, two panes, dark professional theme (slate background, one accent color — emerald for `met`, amber for `cannot_verify`, red for `not_met`).

- **Header:** "Overturn — Denial Appeal Agent", case selector (Case A / Case B), Run button, and after the deadline tool fires, a persistent badge: "⏱ 127 days left to file".
- **Left pane — Agent Trace (the star):** events stream in as cards with icons: 🧭 plan, 📋 criteria checklist (rows update live with ✓/✗/? as verdicts land), 🔍 retrieval (query + snippet previews), 🛠 tool call (monospace inputs → outputs), ⚖ verdict (colored, with citation chips), 🎯 decision (strength + coverage). Auto-scroll; smooth entrance animation (CSS only, subtle).
- **Right pane — Output:** appeal letter streaming in with citation chips inline (Case A), or the gap report with its evidence checklist (Case B). Bottom bar: **"Approve & Export"** (downloads the letter as `.txt`) and **"Request edits"** (non-functional placeholder is fine — the point is the visible human-in-the-loop step). 
- **Citation click-through:** clicking any citation chip opens a right-side drawer showing the full source document with the cited passage highlighted (match on the quote string). This is a top-3 demo moment — make it smooth.
- **Footer (always visible):** the §2.5 disclaimer sentence.
- No routing, no state library — component state + one EventSource is enough.

---

## 11. Build plan — phases with acceptance gates

Work through phases **in order**. At the end of each phase: run the acceptance check, `git add -A && git commit` with a descriptive message, and report status to me before continuing. If an acceptance check fails, fix it before moving on — do not build forward on a broken base.

**Phase 0 — Skeleton + Vultr connectivity (target: 45 min)**
Init git repo, layout from §4, `.env.example`, `.gitignore`, README stub. **First: read the Vultr Serverless Inference docs (docs.vultr.com/products/compute/serverless-inference) and the VultronRetriever Hugging Face collection to confirm the base URL, auth header, model listing route, and served model names — do not trust assumptions, including the default base URL in `.env.example`.** Write `vultr_client.py` (chat + embeddings + list_models, retries, temperature 0.2) and `smoke.py`.
✅ *Accept:* `python -m backend.smoke` prints the model list, a successful chat completion, and either a successful embedding call or "embeddings unavailable — BM25-only mode". Record the chosen chat model name in `config.py`.

**Phase 1 — Corpus (target: 1 h)**
Write all 9 corpus files + manifest exactly per §5. Verify the planted facts: Case A PT range 2026-03-14 → 2026-04-30; Case B 2026-04-01 → 2026-04-28; Case A prior MRI 2025-04-02; denial dates 2026-05-12 / 2026-05-20; no radiology log for Case B.
✅ *Accept:* I will personally read `pt_notes_case_A.md` and confirm the date evidence is genuinely buried, and skim the policy for realism.

**Phase 2 — Retrieval (target: 1 h)**
Chunking, BM25, optional embeddings, hybrid `search()` with doc_type/case filters, citation extraction.
✅ *Accept:* a test script shows (a) query "conservative therapy duration physical therapy dates" filtered to `pt_notes`, case A returns the chunk containing 2026-03-14/2026-04-30; (b) any radiology query for case B returns empty.

**Phase 3 — Agent loop, headless (target: 2.5–3 h) — the load-bearing phase**
Implement §7 + §8 + prompts + schemas + `run_case.py` CLI that pretty-prints the trace.
✅ *Accept:* `python -m backend.run_case A` → all four criteria `met`, date tool shows 6.7 weeks, strength STRONG, letter contains ≥ 4 citation markers and disputes §4.1 specifically. `python -m backend.run_case B` → §4.1 `not_met` (3.9 weeks), §4.3 `cannot_verify` with a specific documentation request, strength WEAK, gap report, no letter. **Run each case 3× — outcomes must be identical.**

**Phase 4 — API layer (target: 45 min)**
FastAPI + SSE per §9.
✅ *Accept:* `curl -N localhost:8000/api/run/A` streams the full event sequence ending in `done`.

**Phase 5 — Frontend (target: 3–4 h)**
Everything in §10.
✅ *Accept:* full Case A run in browser with streaming trace, live checklist, citation click-through with highlighted passage, letter export; Case B shows the gap report. No console errors.

**Phase 6 — Hardening + README (target: 1.5 h)**
Error events render gracefully; one retry on LLM JSON parse failures; README with: one-liner, problem/impact paragraph, architecture diagram (Mermaid), **a section titled "Why this is an agent, not a single retrieve-then-answer call"** mapping each loop step to the track statement's own words (plans / retrieves more than once / calls tools / makes decisions / produces an outcome), the tech stack naming **Vultr Serverless Inference and VultronRetriever** explicitly, run instructions, the disclaimer, and "built entirely during RAISE Hackathon 2026 — see commit history."
✅ *Accept:* fresh clone + README instructions → running app in under 5 minutes.

**Phase 7 — Deploy + demo assets (target: 1.5 h, only after 0–6 are done)**
Dockerfile(s) + compose; deploy to a small Vultr Compute instance (stack becomes Vultr end-to-end — mention in README). Record a clean screen capture of Case A and Case B for the video. If deployment fights back for more than 45 minutes, abandon it — a flawless local recording beats a broken cloud deploy.

**Cut order if time collapses (cut from the top):** deploy → entrance animations → letter export button → citation highlight precision (chip that opens the doc without exact highlight is acceptable). **Never cut:** per-criterion conditional retrieval, the tool-call trace, Case B's honest decline, citations in the letter.

---

## 12. Engineering rules for Claude Code

1. Commit after every phase and after any significant sub-step. Messages describe the change ("Add hybrid retrieval with doc_type filters"), never "wip".
2. All prompts live in `agent/prompts.py` as named constants — no inline prompt strings.
3. All Vultr traffic goes through `vultr_client.py`. If the API surprises us, one file changes.
4. LLM JSON responses: request JSON explicitly, strip markdown fences before parsing, retry once with an error-correction prompt, then emit an `error` TraceEvent — never crash the stream.
5. Type hints and pydantic models throughout the backend. Keep functions small.
6. Do not add: auth, databases, file upload, multi-payer support, PDF parsing, additional cases, or any feature not in this file. If you think something extra is essential, ask me first.
7. Forbidden strings anywhere in the repo: "RAG", real insurer names, real patient data.
8. When blocked for more than ~10 minutes on any external dependency, implement the fallback (BM25-only mode, static fallback, etc.) and flag it to me rather than stalling.

---

## 13. The 60-second demo video (build priorities flow backward from this)

1. **0–10s** — problem: insurers deny claims; appealed denials frequently get overturned; most are never appealed because appeals take hours to draft. Hospitals write off recoverable revenue.
2. **10–45s** — Case A live: denial letter ingested → policy decomposed into a checklist → criteria verify one by one → the §4.1 moment: agent dives into the PT notes, surfaces the buried date range, the date tool prints **6.7 weeks ≥ 6.0 → satisfied**, verdict flips to met → strength STRONG → letter assembles with citation chips → click a chip, the source passage highlights → Approve & Export.
3. **45–50s** — Case B smash cut: strength WEAK, "Do not file yet," evidence checklist, deadline countdown.
4. **50–60s** — the exported letter + one line: *"Planning, reasoning, and retrieval run entirely on Vultr Serverless Inference with VultronRetriever. Built solo in 24 hours."*

## 14. Timeline (deadline: Sunday 2026-07-05, 12:00 PM Paris = 11:00 AM Marrakesh)

- **Saturday:** Phases 0–3 by evening (headless agent working is the day's victory condition), Phase 4–5 into the night.
- **Sunday 07:00–09:30 (Paris):** Phase 6, then Phase 7. **Feature freeze 09:30.**
- **Sunday 09:30–11:00:** record video, final README pass, submission form.
- **Submit by 11:30 Paris. Never 11:59.**

Now start with Phase 0. Report back after the smoke test passes.
