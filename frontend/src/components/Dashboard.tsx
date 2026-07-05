import { PATIENTS, QUEUED, PAYER, daysToAppeal, initials } from "../patients";
import { IconInbox, IconClock, IconScale, IconArrowRight } from "./icons";

interface Props {
  onOpenPatient: (id: string) => void;
}

function Countdown({ denialDate, light }: { denialDate: string; light?: boolean }) {
  const days = daysToAppeal(denialDate);
  const tone = light ? "text-white/90" : days < 30 ? "text-unmet" : days < 60 ? "text-verify" : "text-slate-600";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${tone}`}>
      <IconClock className="h-3.5 w-3.5" />
      {days} days to appeal
    </span>
  );
}

export default function Dashboard({ onOpenPatient }: Props) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const deadlines = PATIENTS.map((p) => (p.denial ? daysToAppeal(p.denial.denialDate) : 999));
  const nearest = Math.min(...deadlines);

  return (
    <div className="mx-auto max-w-6xl px-8 py-7">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Good morning, Dr. Yassine</h1>
          <p className="mt-1 text-sm text-muted">Open payer denials awaiting appeal review · {today}</p>
        </div>
      </div>

      {/* Summary widgets */}
      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-teal p-5 text-white shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">Open denials</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15"><IconInbox className="h-4 w-4" /></span>
          </div>
          <div className="mt-3 text-3xl font-semibold">{PATIENTS.length}</div>
          <div className="mt-0.5 text-[11px] text-white/70">Ready for agent review</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Nearest deadline</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent"><IconClock className="h-4 w-4" /></span>
          </div>
          <div className="mt-3 text-3xl font-semibold text-ink">{nearest} days</div>
          <div className="mt-0.5 text-[11px] text-muted">180-day filing window</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Queued denials</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent"><IconScale className="h-4 w-4" /></span>
          </div>
          <div className="mt-3 text-3xl font-semibold text-ink">{QUEUED.length}</div>
          <div className="mt-0.5 text-[11px] text-muted">Awaiting intake</div>
        </div>
      </div>

      {/* Live patients */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Patients</h2>
        <span className="text-xs text-muted">{PATIENTS.length} active · {QUEUED.length} queued</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PATIENTS.map((p) => (
          <button
            key={p.id}
            onClick={() => onOpenPatient(p.id)}
            className="card group p-5 text-left transition hover:-translate-y-0.5 hover:shadow-cardhover"
          >
            <div className="flex items-start gap-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-sm font-semibold text-accent">
                {initials(p.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-ink">{p.name}</span>
                  <IconArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-accent" />
                </div>
                <div className="text-xs text-muted">{p.age} · {p.sex} · {p.diagnosis} ({p.diagnosisCode})</div>
                <div className="mt-3 rounded-xl border border-line bg-page px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-slate-700">{p.denial?.procedure}</span>
                    <span className="tag font-mono">CPT {p.denial?.cpt}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-muted">{PAYER} · {p.denial?.claim}</span>
                    {p.denial && <Countdown denialDate={p.denial.denialDate} />}
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Queued (non-functional) */}
      <div className="mb-2 mt-7 text-sm font-semibold text-ink">Queued for intake</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {QUEUED.map((q) => (
          <div key={q.id} className="card p-4 opacity-55">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-page text-xs font-semibold text-slate-500">
                {initials(q.name)}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-slate-600">{q.name}</div>
                <div className="truncate text-[11px] text-slate-400">{q.procedure} · CPT {q.cpt}</div>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Coming soon · {q.denialDate}</div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-slate-400">
        Two patients are wired to the live agent. Queued patients are illustrative and non-functional.
      </p>
    </div>
  );
}
