import type { CaseInfo } from "../types";
import { CASE_META, COMING_SOON, PAYER, daysToAppeal } from "../caseMeta";
import { IconArrowRight, IconClock } from "./icons";

interface Props {
  cases: CaseInfo[];
  onOpen: (id: string) => void;
}

function Countdown({ denialDate }: { denialDate: string }) {
  const days = daysToAppeal(denialDate);
  const tone = days < 30 ? "text-unmet" : days < 60 ? "text-verify" : "text-slate-300";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${tone}`}>
      <IconClock className="h-3.5 w-3.5" />
      {days} days
    </span>
  );
}

export default function Worklist({ cases, onOpen }: Props) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-100">Denials Worklist</h1>
          <p className="mt-1 text-sm text-slate-400">
            Inbound payer denials awaiting appeal review · {today}
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div className="font-medium text-slate-300">Billing &amp; Appeals</div>
          <div>Revenue Integrity</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-2.5 font-medium">Patient</th>
              <th className="px-4 py-2.5 font-medium">Procedure denied</th>
              <th className="px-4 py-2.5 font-medium">Payer</th>
              <th className="px-4 py-2.5 font-medium">Claim #</th>
              <th className="px-4 py-2.5 font-medium">Denial date</th>
              <th className="px-4 py-2.5 font-medium">Time to appeal</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => {
              const meta = CASE_META[c.id];
              return (
                <tr
                  key={c.id}
                  onClick={() => onOpen(c.id)}
                  className="group cursor-pointer border-b border-slate-800/70 bg-slate-900/20 transition hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-slate-100">{c.patient}</div>
                    <div className="text-[11px] text-slate-500">Case {c.id}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-300">
                    {meta?.procedure ?? c.title}
                    <span className="ml-1.5 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                      CPT {c.cpt}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400">{PAYER}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{meta?.claim ?? "—"}</td>
                  <td className="px-4 py-3.5 text-slate-400">{c.denial_date}</td>
                  <td className="px-4 py-3.5">
                    <Countdown denialDate={c.denial_date} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent opacity-0 transition group-hover:opacity-100">
                      Review <IconArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </td>
                </tr>
              );
            })}

            {COMING_SOON.map((r) => (
              <tr key={r.claim} className="cursor-not-allowed border-b border-slate-800/70 opacity-40">
                <td className="px-4 py-3.5">
                  <div className="font-medium text-slate-300">{r.patient}</div>
                  <div className="text-[11px] text-slate-600">Queued</div>
                </td>
                <td className="px-4 py-3.5 text-slate-400">
                  {r.procedure}
                  <span className="ml-1.5 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                    CPT {r.cpt}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-500">{PAYER}</td>
                <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{r.claim}</td>
                <td className="px-4 py-3.5 text-slate-500">{r.denialDate}</td>
                <td className="px-4 py-3.5">
                  <Countdown denialDate={r.denialDate} />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-[11px] text-slate-600">Coming soon</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-slate-600">
        Two live cases are wired to the agent. Additional rows are illustrative and non-functional.
      </p>
    </div>
  );
}
