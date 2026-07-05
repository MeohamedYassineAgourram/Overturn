// Presentation-only patient records. Bios and denial details mirror the
// synthetic corpus; documents map to real doc_ids served by /api/document.
// The backend/agent/corpus are untouched — this is just how the UI organises it.

export const PAYER = "Meridian Health Plans";

export interface PatientDoc {
  id: string;
  label: string;
  kind: "denial_letter" | "chart" | "pt_notes" | "radiology_log" | "policy";
}

export interface Denial {
  payer: string;
  claim: string;
  procedure: string;
  cpt: string;
  icd10: string;
  denialDate: string;
  reason: string;
}

export interface Patient {
  id: string; // "A" | "B" | queued ids
  caseId?: "A" | "B"; // present only for live/agent-wired patients
  name: string;
  age: number;
  sex: string;
  dob: string;
  mrn: string;
  memberId: string;
  pcp: string;
  provider: string;
  diagnosis: string;
  diagnosisCode: string;
  denial?: Denial;
  documents: PatientDoc[];
  active: boolean;
}

// The four medical-necessity criteria the agent checks (MP-142 §4).
export const MP142_CRITERIA = [
  { id: "4.1", text: "≥ 6 weeks of provider-directed conservative therapy, with dates documented" },
  { id: "4.2", text: "Persistent symptoms or a documented objective neurological deficit" },
  { id: "4.3", text: "No lumbar MRI within the prior 12 months" },
  { id: "4.4", text: "Requested CPT code consistent with the documented ICD-10 diagnosis" },
];

const DENIAL_REASON =
  "Medical necessity not established: conservative therapy not documented for the required six-week duration (Policy MP-142 §4.1).";

export const PATIENTS: Patient[] = [
  {
    id: "A",
    caseId: "A",
    name: "Robert Callahan",
    age: 52,
    sex: "Male",
    dob: "1974-02-18",
    mrn: "ASO-118842",
    memberId: "MHP-004-7719-02",
    pcp: "Dr. S. Okafor",
    provider: "Aldrich Spine & Orthopedic Associates",
    diagnosis: "Lumbar radiculopathy",
    diagnosisCode: "M54.16",
    denial: {
      payer: PAYER,
      claim: "MH-2026-48213",
      procedure: "MRI Lumbar Spine w/o Contrast",
      cpt: "72148",
      icd10: "M54.16",
      denialDate: "2026-05-12",
      reason: DENIAL_REASON,
    },
    documents: [
      { id: "denial_letter_A", label: "Denial letter", kind: "denial_letter" },
      { id: "chart_A", label: "Patient chart", kind: "chart" },
      { id: "pt_notes_A", label: "Physical therapy record", kind: "pt_notes" },
      { id: "radiology_log_A", label: "Imaging history", kind: "radiology_log" },
      { id: "policy_mp142", label: "Payer policy MP-142", kind: "policy" },
    ],
    active: true,
  },
  {
    id: "B",
    caseId: "B",
    name: "Diane Mercer",
    age: 47,
    sex: "Female",
    dob: "1979-06-03",
    mrn: "CFM-220519",
    memberId: "MHP-011-3382-01",
    pcp: "Dr. S. Okafor",
    provider: "Caldwell Family Medicine Group",
    diagnosis: "Lumbar radiculopathy",
    diagnosisCode: "M54.16",
    denial: {
      payer: PAYER,
      claim: "MH-2026-51877",
      procedure: "MRI Lumbar Spine w/o Contrast",
      cpt: "72148",
      icd10: "M54.16",
      denialDate: "2026-05-20",
      reason: DENIAL_REASON,
    },
    documents: [
      { id: "denial_letter_B", label: "Denial letter", kind: "denial_letter" },
      { id: "chart_B", label: "Patient chart", kind: "chart" },
      { id: "pt_notes_B", label: "Physical therapy record", kind: "pt_notes" },
      { id: "policy_mp142", label: "Payer policy MP-142", kind: "policy" },
    ],
    active: true,
  },
];

export interface QueuedPatient {
  id: string;
  name: string;
  age: number;
  sex: string;
  procedure: string;
  cpt: string;
  claim: string;
  denialDate: string;
}

export const QUEUED: QueuedPatient[] = [
  { id: "q1", name: "Angela Foster", age: 58, sex: "Female", procedure: "CT Abdomen & Pelvis w/ Contrast", cpt: "74178", claim: "MH-2026-52904", denialDate: "2026-06-02" },
  { id: "q2", name: "Marcus Bell", age: 44, sex: "Male", procedure: "MRI Brain w/o Contrast", cpt: "70551", claim: "MH-2026-53318", denialDate: "2026-06-11" },
  { id: "q3", name: "Priya Nair", age: 39, sex: "Female", procedure: "Echocardiogram, Transthoracic", cpt: "93306", claim: "MH-2026-53752", denialDate: "2026-06-19" },
];

export function daysToAppeal(denialDate: string): number {
  const d = new Date(denialDate + "T00:00:00");
  const deadline = new Date(d);
  deadline.setDate(deadline.getDate() + 180);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((deadline.getTime() - today.getTime()) / 86_400_000);
}

export function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
