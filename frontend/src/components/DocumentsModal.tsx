import Modal from "./Modal";
import { IconDoc, IconArrowRight } from "./icons";

interface Props {
  onView: (docId: string) => void;
  onClose: () => void;
}

// The corpus is fixed, so the library is a known list; each item opens the real
// document via the existing /api/document/{doc_id} endpoint + artifact viewer.
const GROUPS: { group: string; items: { id: string; label: string }[] }[] = [
  { group: "Payer policy", items: [{ id: "policy_mp142", label: "Medical Policy MP-142 — Lumbar Spine MRI" }] },
  {
    group: "Robert Callahan · Case A",
    items: [
      { id: "denial_letter_A", label: "Denial letter" },
      { id: "chart_A", label: "Patient chart" },
      { id: "pt_notes_A", label: "Physical therapy record" },
      { id: "radiology_log_A", label: "Imaging history" },
    ],
  },
  {
    group: "Diane Mercer · Case B",
    items: [
      { id: "denial_letter_B", label: "Denial letter" },
      { id: "chart_B", label: "Patient chart" },
      { id: "pt_notes_B", label: "Physical therapy record" },
    ],
  },
];

export default function DocumentsModal({ onView, onClose }: Props) {
  return (
    <Modal title="Documents" subtitle="Browse the source documents behind the cases" onClose={onClose} width="max-w-xl">
      <div className="max-h-[60vh] overflow-auto p-5">
        {GROUPS.map((g) => (
          <div key={g.group} className="mb-4 last:mb-0">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{g.group}</div>
            <div className="space-y-1">
              {g.items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => onView(it.id)}
                  className="group flex w-full items-center justify-between rounded-lg border border-line px-3 py-2.5 text-left transition hover:border-accent-ring hover:bg-accent-soft/50"
                >
                  <span className="flex items-center gap-2.5 text-[13px] text-slate-700">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-page text-slate-500 group-hover:text-accent">
                      <IconDoc className="h-4 w-4" />
                    </span>
                    {it.label}
                  </span>
                  <IconArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-accent" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
