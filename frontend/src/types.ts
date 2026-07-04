export type EventType =
  | "plan"
  | "criteria"
  | "criterion_start"
  | "retrieval"
  | "tool_call"
  | "verdict"
  | "decision"
  | "letter"
  | "gap_report"
  | "done"
  | "error";

export type VerdictStatus = "met" | "not_met" | "cannot_verify";

export interface Citation {
  doc_id: string;
  doc_title: string;
  section_heading: string;
  quote: string;
}

export interface Criterion {
  criterion_id: string;
  requirement_text: string;
  evidence_needed: string;
  doc_types_to_search: string[];
}

export interface RetrievalChunk {
  doc_id: string;
  doc_title: string;
  section_heading: string;
  preview: string;
}

export interface Ingest {
  payer: string;
  member: string;
  claim_id: string;
  cpt: string;
  icd10: string;
  denial_date: string;
  denial_reason: string;
  policy_cited: string;
}

export interface DeadlineResult {
  denial_date: string;
  deadline: string;
  days_remaining: number;
  expired: boolean;
}

export interface CaseInfo {
  id: string;
  title: string;
  patient: string;
  cpt: string;
  denial_date: string;
}

export interface TraceEvent {
  type: EventType;
  payload: any;
}
