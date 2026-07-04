// Presentation-only metadata for the worklist. The two real cases (A/B) map to
// the same fixed cases the backend already serves; claim numbers and procedure
// labels mirror the synthetic corpus. "Coming soon" rows are pure visual dressing.

export const PAYER = "Meridian Health Plans";

export const CASE_META: Record<string, { procedure: string; claim: string }> = {
  A: { procedure: "MRI Lumbar Spine w/o Contrast", claim: "MH-2026-48213" },
  B: { procedure: "MRI Lumbar Spine w/o Contrast", claim: "MH-2026-51877" },
};

export interface WorklistRow {
  patient: string;
  procedure: string;
  cpt: string;
  claim: string;
  denialDate: string;
}

export const COMING_SOON: WorklistRow[] = [
  {
    patient: "Angela Foster",
    procedure: "CT Abdomen & Pelvis w/ Contrast",
    cpt: "74178",
    claim: "MH-2026-52904",
    denialDate: "2026-06-02",
  },
  {
    patient: "Marcus Bell",
    procedure: "MRI Brain w/o Contrast",
    cpt: "70551",
    claim: "MH-2026-53318",
    denialDate: "2026-06-11",
  },
  {
    patient: "Priya Nair",
    procedure: "Echocardiogram, Transthoracic",
    cpt: "93306",
    claim: "MH-2026-53752",
    denialDate: "2026-06-19",
  },
];

// Days remaining in the 180-day appeal window (mirrors the backend tool; the
// authoritative countdown still comes from appeal_deadline during the run).
export function daysToAppeal(denialDate: string): number {
  const d = new Date(denialDate + "T00:00:00");
  const deadline = new Date(d);
  deadline.setDate(deadline.getDate() + 180);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((deadline.getTime() - today.getTime()) / 86_400_000);
}
