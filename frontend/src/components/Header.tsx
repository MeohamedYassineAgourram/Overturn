import type { CaseInfo, DeadlineResult } from "../types";
import { IconClock, IconPlay } from "./icons";

interface Props {
  cases: CaseInfo[];
  selected: string;
  onSelect: (id: string) => void;
  onRun: () => void;
  running: boolean;
  deadline?: DeadlineResult;
}

export default function Header({ cases, selected, onSelect, onRun, running, deadline }: Props) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/80 px-6 py-3.5 backdrop-blur">
      <div className="flex items-baseline gap-3">
        <span className="text-lg font-semibold tracking-tight text-slate-100">
          Overturn
        </span>
        <span className="hidden text-sm text-slate-500 sm:inline">Denial Appeal Agent</span>
      </div>

      <div className="flex items-center gap-3">
        {deadline && (
          <div className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">
            <IconClock className="h-3.5 w-3.5" />
            {deadline.days_remaining} days left to file
          </div>
        )}

        <div className="flex rounded-lg border border-slate-700 bg-slate-800/60 p-0.5">
          {cases.map((c) => (
            <button
              key={c.id}
              disabled={running}
              onClick={() => onSelect(c.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                selected === c.id ? "bg-slate-700 text-slate-100 shadow" : "text-slate-400 hover:text-slate-200"
              } disabled:opacity-50`}
              title={c.title}
            >
              Case {c.id}
            </button>
          ))}
        </div>

        <button
          onClick={onRun}
          disabled={running}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <IconPlay className="h-3.5 w-3.5" />
          {running ? "Running…" : "Run agent"}
        </button>
      </div>
    </header>
  );
}
