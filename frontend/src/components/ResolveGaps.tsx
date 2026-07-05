import { useState } from "react";
import { IconDownload, IconDoc } from "./icons";

interface Props {
  gap: any;
  ingest?: { member?: string; claim_id?: string; payer?: string; cpt?: string; icd10?: string; denial_date?: string };
  deadline?: { deadline?: string; days_remaining?: number };
}

interface GapItem {
  key: string;
  cid: string;
  kind: "not met" | "cannot verify";
  ask: string;
  note: string;
}

const decap = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);

function buildItems(gap: any): GapItem[] {
  const items: GapItem[] = [];
  for (const u of gap.unmet ?? [])
    items.push({
      key: "u" + u.criterion_id,
      cid: u.criterion_id,
      kind: "not met",
      ask: `Obtain documentation establishing ${decap(u.requirement_text)}`,
      note: u.rationale ?? "",
    });
  for (const u of gap.unverifiable ?? [])
    items.push({
      key: "v" + u.criterion_id,
      cid: u.criterion_id,
      kind: "cannot verify",
      ask: u.documentation_request ?? "",
      note: "",
    });
  return items;
}

export default function ResolveGaps({ gap, ingest, deadline }: Props) {
  const items = buildItems(gap);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setResolved((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });

  const done = items.filter((it) => resolved.has(it.key)).length;

  const workOrderText = () => {
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const lines = items.map((it) => {
      const box = resolved.has(it.key) ? "[x] requested" : "[ ] pending  ";
      const status = it.note ? `\n        current status: ${it.note}` : "";
      return `  ${box}  §${it.cid} — ${it.ask}${status}`;
    });
    return [
      "EVIDENCE WORK ORDER — Appeal preparation",
      "",
      "To:      Health Information Management / Medical Records",
      "From:    Billing & Appeals — Dr. Yassine, Harborview Medical Center",
      `Date:    ${today}`,
      "",
      `Patient:          ${ingest?.member ?? "—"}`,
      `Claim / Member:   ${ingest?.claim_id ?? "—"}`,
      `Payer:            ${ingest?.payer ?? "—"}`,
      `Denied service:   CPT ${ingest?.cpt ?? "—"} (ICD-10 ${ingest?.icd10 ?? "—"})`,
      `Filing deadline:  ${deadline?.deadline ?? "—"} (${deadline?.days_remaining ?? "—"} days remaining)`,
      "",
      "The appeal for the above denial cannot proceed until the following",
      "documentation is obtained. Please retrieve each item, attach it to the",
      "patient's chart, and notify Billing & Appeals to re-run the review.",
      "",
      "REQUIRED EVIDENCE",
      ...lines,
      "",
      "Prepared with Overturn. This system evaluates documentation against payer",
      "policy criteria. It makes no clinical judgments. All appeals require human",
      "reviewer sign-off before filing. No appeal has been filed on the basis of",
      "this work order.",
      "",
    ].join("\n");
  };

  const download = () => {
    const blob = new Blob([workOrderText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `work_order_${ingest?.claim_id ?? "evidence"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const print = () => {
    const w = window.open("", "_blank", "width=760,height=900");
    if (!w) return download();
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    w.document.write(
      `<!doctype html><html><head><title>Evidence Work Order — ${esc(ingest?.claim_id ?? "")}</title>` +
        `<style>body{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#1c2b27;padding:40px;line-height:1.55;font-size:12.5px}` +
        `pre{white-space:pre-wrap;font-family:inherit;margin:0}</style></head>` +
        `<body><pre>${esc(workOrderText())}</pre></body></html>`
    );
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 150);
  };

  return (
    <div className="mt-5 rounded-xl border border-line bg-page/60 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-ink">Resolve gaps</h4>
        <span className="text-[11px] font-medium text-muted">
          {done} of {items.length} requested
        </span>
      </div>
      <p className="mt-1 text-[12px] text-muted">
        Check off each item as you request it from records, then generate a work order to send to Health Information
        Management. Re-run the agent once the evidence is in the chart.
      </p>

      <ul className="mt-3 space-y-1.5">
        {items.map((it) => {
          const on = resolved.has(it.key);
          return (
            <li key={it.key}>
              <button
                onClick={() => toggle(it.key)}
                className="flex w-full items-start gap-2.5 rounded-lg border border-line bg-white px-3 py-2.5 text-left transition hover:border-accent-ring"
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    on ? "border-accent bg-accent text-white" : "border-slate-300"
                  }`}
                >
                  {on && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
                      <path d="m5 12.5 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="rounded bg-white px-1 font-mono text-[11px] font-semibold text-accent">§{it.cid}</span>
                    <span className={`text-[11px] font-medium ${it.kind === "not met" ? "text-red-600" : "text-amber-600"}`}>
                      {it.kind}
                    </span>
                    {on && <span className="text-[11px] font-medium text-accent">· requested</span>}
                  </span>
                  <span className={`mt-0.5 block text-[13px] ${on ? "text-slate-400 line-through" : "text-slate-700"}`}>
                    {it.ask}
                  </span>
                  {it.note && !on && <span className="mt-0.5 block text-[11px] text-muted">Current: {it.note}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {done === items.length && items.length > 0 && (
        <p className="mt-2.5 rounded-lg border border-accent-ring bg-accent-soft px-3 py-2 text-[12px] text-accent">
          All evidence requested. Once the records are in the chart, re-run the agent to re-evaluate — the appeal is not
          filed automatically.
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={print}
          className="flex items-center gap-1.5 rounded-lg bg-teal px-3.5 py-2 text-xs font-semibold text-white shadow-card transition hover:bg-teal-light"
        >
          <IconDoc className="h-3.5 w-3.5" />
          Print work order
        </button>
        <button
          onClick={download}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-page"
        >
          <IconDownload className="h-3.5 w-3.5" />
          Download .txt
        </button>
      </div>
    </div>
  );
}
