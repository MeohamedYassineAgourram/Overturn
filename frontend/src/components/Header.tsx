import type { DeadlineResult } from "../types";
import { IconClock, IconPlay, IconBell, IconSearch } from "./icons";

interface Props {
  mode: "worklist" | "case";
  onBack: () => void;
  onRerun: () => void;
  running: boolean;
  deadline?: DeadlineResult;
  caseContext?: { patient: string; claim: string };
}

export default function Header({ mode, onBack, onRerun, running, deadline, caseContext }: Props) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-line bg-white px-6 py-3">
      <div className="flex items-center gap-3">
        {mode === "case" && (
          <button
            onClick={onBack}
            className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-page"
          >
            ← Worklist
          </button>
        )}
        {mode === "case" && caseContext ? (
          <div className="flex items-baseline gap-2.5">
            <span className="text-base font-semibold tracking-tight text-ink">{caseContext.patient}</span>
            <span className="font-mono text-xs text-muted">{caseContext.claim}</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-2.5">
            <span className="text-base font-semibold tracking-tight text-ink">Overturn</span>
            <span className="hidden text-sm text-muted sm:inline">Denial Appeal Agent</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {mode === "case" && deadline && (
          <div className="flex items-center gap-1.5 rounded-full border border-accent-ring bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent">
            <IconClock className="h-3.5 w-3.5" />
            {deadline.days_remaining} days left to file
          </div>
        )}

        <button className="hidden h-9 w-9 items-center justify-center rounded-lg border border-line text-slate-500 transition hover:bg-page sm:flex" disabled>
          <IconSearch className="h-4 w-4" />
        </button>
        <button className="hidden h-9 w-9 items-center justify-center rounded-lg border border-line text-slate-500 transition hover:bg-page sm:flex" disabled>
          <IconBell className="h-4 w-4" />
        </button>

        {mode === "case" && (
          <button
            onClick={onRerun}
            disabled={running}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconPlay className="h-3.5 w-3.5" />
            {running ? "Running…" : "Re-run agent"}
          </button>
        )}

        <div className="ml-1 flex items-center gap-2 rounded-lg border border-line py-1 pl-1 pr-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-page text-xs font-semibold text-slate-600">
            RC
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-xs font-semibold text-ink">Revenue Integrity</div>
            <div className="text-[10px] text-muted">Billing &amp; Appeals</div>
          </div>
        </div>
      </div>
    </header>
  );
}
