import type { DeadlineResult } from "../types";
import { IconClock, IconPlay } from "./icons";

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
    <header className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/80 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        {mode === "case" && (
          <button
            onClick={onBack}
            className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800"
          >
            ← Worklist
          </button>
        )}
        <div className="flex items-baseline gap-2.5">
          <span className="text-lg font-semibold tracking-tight text-slate-100">Overturn</span>
          <span className="hidden text-sm text-slate-500 sm:inline">Denial Appeal Agent</span>
        </div>
        {mode === "case" && caseContext && (
          <div className="ml-2 hidden items-center gap-2 border-l border-slate-700 pl-3 text-xs text-slate-400 md:flex">
            <span className="font-medium text-slate-300">{caseContext.patient}</span>
            <span className="font-mono text-slate-500">{caseContext.claim}</span>
          </div>
        )}
      </div>

      {mode === "case" && (
        <div className="flex items-center gap-3">
          {deadline && (
            <div className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">
              <IconClock className="h-3.5 w-3.5" />
              {deadline.days_remaining} days left to file
            </div>
          )}
          <button
            onClick={onRerun}
            disabled={running}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconPlay className="h-3.5 w-3.5" />
            {running ? "Running…" : "Re-run agent"}
          </button>
        </div>
      )}
    </header>
  );
}
