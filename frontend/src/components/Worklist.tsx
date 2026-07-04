import type { CaseInfo } from "../types";
import { CASE_META, COMING_SOON, PAYER, daysToAppeal } from "../caseMeta";
import { IconArrowRight, IconClock, IconInbox, IconScale, IconTarget } from "./icons";

interface Props {
  cases: CaseInfo[];
  onOpen: (id: string) => void;
}

function Countdown({ denialDate }: { denialDate: string }) {
  const days = daysToAppeal(denialDate);
  const tone = days < 30 ? "text-unmet" : days < 60 ? "text-verify" : "text-slate-600";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${tone}`}>
      <IconClock className="h-3.5 w-3.5" />
      {days} days
    </span>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className={`card p-4 ${accent ? "bg-accent text-white shadow-cardhover" : ""}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${accent ? "text-white/80" : "text-muted"}`}>{label}</span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            accent ? "bg-white/20 text-white" : "bg-accent-soft text-accent"
          }`}
        >
          {icon}
        </span>
      </div>
      <div className={`mt-2 text-2xl font-semibold tracking-tight ${accent ? "text-white" : "text-ink"}`}>{value}</div>
      <div className={`mt-0.5 text-[11px] ${accent ? "text-white/75" : "text-muted"}`}>{sub}</div>
    </div>
  );
}

export default function Worklist({ cases, onOpen }: Props) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const deadlines = cases.map((c) => daysToAppeal(c.denial_date));
  const nearest = deadlines.length ? Math.min(...deadlines) : 0;
  const atRisk = deadlines.filter((d) => d < 30).length;

  return (
    <div className="mx-auto max-w-6xl px-8 py-7">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Good morning, Revenue Integrity</h1>
        <p className="mt-1 text-sm text-muted">
          Inbound payer denials awaiting appeal review · {today}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          accent
          icon={<IconInbox className="h-4 w-4" />}
          label="Open denials"
          value={String(cases.length)}
          sub="Awaiting appeal review"
        />
        <Stat
          icon={<IconScale className="h-4 w-4" />}
          label="Ready to review"
          value={String(cases.length)}
          sub="Agent-ready cases"
        />
        <Stat
          icon={<IconClock className="h-4 w-4" />}
          label="Nearest deadline"
          value={`${nearest} days`}
          sub="180-day filing window"
        />
        <Stat
          icon={<IconTarget className="h-4 w-4" />}
          label="At risk"
          value={String(atRisk)}
          sub="Under 30 days to file"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">Denials worklist</h2>
          <span className="text-xs text-muted">{cases.length} live · {COMING_SOON.length} queued</span>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
              <th className="px-5 py-2.5 font-medium">Patient</th>
              <th className="px-5 py-2.5 font-medium">Procedure denied</th>
              <th className="px-5 py-2.5 font-medium">Payer</th>
              <th className="px-5 py-2.5 font-medium">Claim #</th>
              <th className="px-5 py-2.5 font-medium">Denial date</th>
              <th className="px-5 py-2.5 font-medium">Time to appeal</th>
              <th className="px-5 py-2.5 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => {
              const meta = CASE_META[c.id];
              return (
                <tr
                  key={c.id}
                  onClick={() => onOpen(c.id)}
                  className="group cursor-pointer border-b border-line/70 transition hover:bg-page"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-ink">{c.patient}</div>
                    <div className="text-[11px] text-muted">Case {c.id}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">
                    {meta?.procedure ?? c.title}
                    <span className="tag ml-1.5 font-mono">CPT {c.cpt}</span>
                  </td>
                  <td className="px-5 py-3.5 text-muted">{PAYER}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-muted">{meta?.claim ?? "—"}</td>
                  <td className="px-5 py-3.5 text-muted">{c.denial_date}</td>
                  <td className="px-5 py-3.5">
                    <Countdown denialDate={c.denial_date} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1 rounded-full border border-accent-ring bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
                      Review <IconArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </td>
                </tr>
              );
            })}

            {COMING_SOON.map((r) => (
              <tr key={r.claim} className="cursor-not-allowed border-b border-line/70 opacity-45">
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-slate-600">{r.patient}</div>
                  <div className="text-[11px] text-slate-400">Queued</div>
                </td>
                <td className="px-5 py-3.5 text-slate-500">
                  {r.procedure}
                  <span className="tag ml-1.5 font-mono">CPT {r.cpt}</span>
                </td>
                <td className="px-5 py-3.5 text-slate-400">{PAYER}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{r.claim}</td>
                <td className="px-5 py-3.5 text-slate-400">{r.denialDate}</td>
                <td className="px-5 py-3.5">
                  <Countdown denialDate={r.denialDate} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="rounded-full bg-page px-2.5 py-1 text-[11px] text-slate-400">Coming soon</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-slate-400">
        Two live cases are wired to the agent. Additional rows are illustrative and non-functional.
      </p>
    </div>
  );
}
