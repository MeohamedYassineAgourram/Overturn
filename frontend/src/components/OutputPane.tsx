import type { AppState } from "../state";
import type { Citation } from "../types";
import CitationChip from "./CitationChip";
import { IconDownload, IconQuestion } from "./icons";

interface Props {
  state: AppState;
  onOpenCitation: (c: Citation) => void;
}

const MARKER_SPLIT = /(\[[^\]]*§[^\]]*\])/g;
const IS_MARKER = /^\[[^\]]*§[^\]]*\]$/;

function LetterBody({ text, citations, onOpen }: { text: string; citations: Citation[]; onOpen: (c: Citation) => void }) {
  return (
    <>
      {text.split("\n\n").map((para, pi) => (
        <p key={pi} className="mb-3 text-[13.5px] leading-relaxed text-slate-200">
          {para.split(MARKER_SPLIT).map((part, i) => {
            if (IS_MARKER.test(part)) {
              const section = part.slice(1, -1).split("§")[1]?.trim() ?? "";
              const cite = citations.find((c) => section && c.section_heading.includes(section)) ??
                citations.find((c) => section.includes(c.section_heading));
              return (
                <CitationChip
                  key={i}
                  label={part}
                  onClick={() => cite && onOpen(cite)}
                />
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </p>
      ))}
    </>
  );
}

export default function OutputPane({ state, onOpenCitation }: Props) {
  const { letterParas, letterFull, gap, decision, plan, citations } = state;
  const letterText = letterFull ?? letterParas.join("\n\n");
  const hasLetter = letterText.length > 0;

  const exportLetter = () => {
    const blob = new Blob([letterText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appeal_${plan?.ingest.claim_id ?? "letter"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-6">
        {!hasLetter && !gap && (
          <div className="flex h-full items-center justify-center text-center text-sm text-slate-600">
            The appeal letter or gap report will build here as the agent reaches its decision.
          </div>
        )}

        {hasLetter && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full bg-met/10 px-3 py-1 text-xs font-bold text-met">
                {decision?.strength ?? "STRONG"} — appeal drafted
              </span>
              <span className="text-xs text-slate-500">Filing-ready · pending human sign-off</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-6">
              <LetterBody text={letterText} citations={citations} onOpen={onOpenCitation} />
            </div>
          </div>
        )}

        {gap && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full bg-unmet/10 px-3 py-1 text-xs font-bold text-unmet">
                {gap.strength} — do not file yet
              </span>
              <span className="text-xs text-slate-500">Coverage {gap.coverage}</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
              <h3 className="text-sm font-semibold text-slate-200">Gap report</h3>
              <p className="mt-1 text-[13px] text-slate-400">
                This case is not yet appealable. Obtain the items below before filing — the deadline leaves{" "}
                <span className="font-medium text-slate-200">{gap.days_remaining} days</span> (by {gap.deadline}).
              </p>

              <div className="mt-4 space-y-2">
                {gap.unmet?.map((u: any) => (
                  <div key={u.criterion_id} className="rounded-lg border border-unmet/30 bg-unmet/5 p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-unmet">
                      <IconX className="h-3.5 w-3.5" /> §{u.criterion_id} not met
                    </div>
                    <p className="mt-1 text-[13px] text-slate-300">{u.rationale}</p>
                  </div>
                ))}
                {gap.unverifiable?.map((u: any) => (
                  <div key={u.criterion_id} className="rounded-lg border border-verify/30 bg-verify/5 p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-verify">
                      <IconQuestion className="h-3.5 w-3.5" /> §{u.criterion_id} cannot verify
                    </div>
                    <p className="mt-1 text-[13px] text-slate-300">{u.documentation_request}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Evidence checklist</h4>
                <ul className="mt-2 space-y-1.5">
                  {gap.checklist?.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-slate-300">
                      <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-slate-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Human-in-the-loop action bar */}
      <div className="flex items-center justify-between gap-3 border-t border-slate-800 bg-slate-900/80 px-6 py-3">
        <div className="text-[11px] text-slate-500">
          {hasLetter ? "Review the draft, then approve to export." : gap ? "Resolve gaps, then re-run." : ""}
        </div>
        <div className="flex gap-2">
          <button
            disabled={!hasLetter}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            title="Placeholder — routes to a human reviewer in production"
          >
            Request edits
          </button>
          <button
            onClick={exportLetter}
            disabled={!hasLetter}
            className="flex items-center gap-1.5 rounded-lg bg-met px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-met/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconDownload className="h-3.5 w-3.5" />
            Approve &amp; Export
          </button>
        </div>
      </div>
    </div>
  );
}

function IconX({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}
