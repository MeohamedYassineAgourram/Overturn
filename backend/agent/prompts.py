"""All LLM prompts, as named constants. No prompt strings live inline in the
loop. Every prompt that expects structured output demands raw JSON with no
prose and no code fences; the loop parses defensively regardless.
"""

SYSTEM = """You are the reasoning core of Overturn, an enterprise agent that helps hospital billing teams evaluate whether an insurance denial can be appealed.

Your job is strictly documentation analysis: you check whether a patient's records satisfy the payer's written medical-policy criteria. You do NOT give medical advice, do NOT interpret symptoms clinically, and do NOT recommend treatment. You reason only about whether documentation exists and meets the stated policy language. Every output is reviewed by a human biller before any action is taken.

When asked for JSON, return ONLY the raw JSON object or array — no explanation, no markdown fences."""

# --- Step 1: INGEST -------------------------------------------------------
INGEST = """Read this insurance denial notice and extract its key fields.

DENIAL NOTICE:
---
{denial_text}
---

Return ONLY a JSON object with exactly these keys:
{{
  "payer": string,
  "member": string,
  "claim_id": string,
  "cpt": string,
  "icd10": string,
  "denial_date": string in YYYY-MM-DD,
  "denial_reason": string (one sentence, the stated reason),
  "policy_cited": string (e.g. "MP-142 §4.1")
}}"""

PLAN_SUMMARY = """You are about to evaluate a denial for {member} (claim {claim_id}). The payer denied {cpt} citing {policy_cited}.

In one or two sentences, describe the plan you will follow: decompose the cited policy into its medical-necessity criteria, then check the patient's documentation against each criterion with targeted retrieval and deterministic date/code tools, and finally decide whether the denial can be appealed. Return ONLY a JSON object: {{"plan": string}}."""

# --- Step 2: POLICY DECOMPOSITION ----------------------------------------
DECOMPOSE = """Below is the payer's medical policy. Decompose its Section 4 "Medical Necessity Criteria" into a checklist of individual criteria the patient's documentation must satisfy.

POLICY:
---
{policy_text}
---

For each criterion under Section 4, produce an object. The document types available for retrieval are exactly: "chart", "pt_notes", "radiology_log", "denial_letter", "policy". For each criterion choose the document type(s) whose records would actually answer it.

Return ONLY a JSON array, one object per criterion, in section order:
[
  {{
    "criterion_id": string (e.g. "4.1"),
    "requirement_text": string (the requirement in plain language),
    "evidence_needed": string (what documentation would satisfy it),
    "doc_types_to_search": array of strings from the allowed list
  }}
]"""

# --- Step 3a: per-criterion query formulation ----------------------------
QUERY = """You are checking this policy criterion against the patient's records:

Criterion {criterion_id}: {requirement_text}
Evidence needed: {evidence_needed}

Write a single focused search query (keywords, not a question) to find the records that would satisfy or refute this criterion. Return ONLY a JSON object: {{"query": string}}."""

# --- Step 3b: targeted extraction for tool inputs ------------------------
EXTRACT_DATES = """From the passages below, extract the start and end dates of the patient's provider-directed conservative therapy course (the physical-therapy course): the initial evaluation / first treatment date and the discharge / final session date.

Report found=true ONLY if BOTH the therapy start date and the therapy end date are explicitly stated in the passages. Do NOT infer a span from referral dates, medication order dates, or office-visit dates, and do NOT guess. If either the start or the end date of the therapy course is not explicitly present, return found=false with nulls.

PASSAGES:
{snippets}

Return ONLY a JSON object:
{{"found": boolean, "start_date": string YYYY-MM-DD or null, "end_date": string YYYY-MM-DD or null}}"""

EXTRACT_MRI = """From the passages below, find the date of the most recent prior lumbar spine MRI, if any is documented.

PASSAGES:
{snippets}

Return ONLY a JSON object:
{{"found": boolean, "mri_date": string YYYY-MM-DD or null}}"""

# --- Step 3c: verdict ----------------------------------------------------
VERDICT = """Decide whether the patient's documentation satisfies this policy criterion.

Criterion {criterion_id}: {requirement_text}
Evidence needed: {evidence_needed}

Retrieved passages:
{snippets}

Deterministic tool result (authoritative for any date/number math; trust it over your own arithmetic):
{tool_result}

Rules:
- "met": the documentation clearly satisfies the criterion. Requires support from the passages above.
- "not_met": the documentation exists but fails the requirement (e.g. duration too short).
- "cannot_verify": the required documentation is absent or not retrievable. Never guess.
- Base any date/duration/count conclusion on the tool result, not your own math.

Return ONLY a JSON object:
{{"status": "met" | "not_met" | "cannot_verify", "rationale": string (one sentence)}}"""

# --- Step 6: appeal letter ----------------------------------------------
LETTER = """Draft a professional first-level appeal letter to the payer's Appeals Department. This letter will be reviewed and signed by a human biller before filing.

Case facts:
- Payer: {payer}
- Member: {member}
- Claim: {claim_id}
- Service denied: {cpt} ({cpt_description})
- Diagnosis: {icd10}
- Denial date: {denial_date}
- Stated denial reason: {denial_reason}
- Filing deadline: {deadline} ({days_remaining} days remaining)

The denial is disputed. Each criterion below is MET, with its supporting evidence and the exact citation marker you must place inline in that argument:

{arguments}

Write the letter with this structure:
1. A header block (To: {payer} Appeals Department; Re: claim {claim_id}, member {member}).
2. An opening: "We formally appeal the denial of ..." naming the service and directly disputing the stated denial reason.
3. One short paragraph per criterion, each making the factual argument and carrying its exact citation marker (the bracketed string given above) inline.
4. A closing that requests the denial be overturned and references the {days_remaining}-day filing window.

Every factual claim must carry its bracketed citation marker exactly as provided. Do not invent facts beyond those given. Return the letter as plain text (not JSON)."""

JSON_REPAIR = """Your previous response was not valid JSON. Return ONLY the corrected raw JSON, no prose, no code fences. The error was: {error}"""
