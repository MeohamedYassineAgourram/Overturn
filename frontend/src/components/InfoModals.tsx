import Modal from "./Modal";

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const rows = [
    { k: "Signed in as", v: "Dr. Yassine — Harborview Medical Center" },
    { k: "Chat model", v: "NVIDIA Nemotron-Cascade-2 (Vultr Serverless Inference)" },
    { k: "Retrieval reranker", v: "VultronRetriever Prime (Vultr Serverless Inference)" },
    { k: "Filing window", v: "180 days from the denial notice" },
    { k: "Determinism", v: "Temperature 0.2 · reasoning off" },
  ];
  return (
    <Modal title="Settings" subtitle="Workspace configuration" onClose={onClose}>
      <div className="p-5">
        <dl className="divide-y divide-line">
          {rows.map((r) => (
            <div key={r.k} className="flex items-start justify-between gap-6 py-2.5">
              <dt className="text-xs text-muted">{r.k}</dt>
              <dd className="text-right text-[13px] font-medium text-slate-700">{r.v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 rounded-lg bg-page px-3 py-2 text-[11px] text-muted">
          This is a hackathon demo workspace. All patients, providers, and the payer are fictional.
        </p>
      </div>
    </Modal>
  );
}

export function HelpModal({ onClose }: { onClose: () => void }) {
  const steps = [
    "Open a case from the Denials Worklist to run the appeal agent.",
    "Watch the left pane: the agent decomposes the payer policy, retrieves evidence per criterion, and calls date/code tools.",
    "When evidence is buried, the agent re-retrieves — e.g. it searches the chart, comes up short, then dives into the therapy record.",
    "On the right, a strong case becomes a filing-ready appeal letter; a weak case becomes an honest gap report.",
    "Click any citation chip to see the exact source passage highlighted in the original document.",
  ];
  return (
    <Modal title="How Overturn works" subtitle="A multi-step, document-grounded appeal agent" onClose={onClose}>
      <div className="p-5">
        <ol className="space-y-2.5">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-[13px] text-slate-700">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-lg bg-page px-3 py-2 text-[11px] text-muted">
          Every appeal requires human reviewer sign-off before filing. The agent makes no clinical judgments.
        </p>
      </div>
    </Modal>
  );
}
