import type { Patient } from "../patients";
import { MP142_CRITERIA, daysToAppeal, initials } from "../patients";
import { IconDoc, IconArrowRight, IconClock, IconPlay, IconScale, IconList } from "./icons";

interface Props {
  patient: Patient;
  onLaunch: (caseId: string) => void;
  onViewDoc: (docId: string) => void;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2 last:border-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-[13px] font-medium text-slate-700">{value}</dd>
    </div>
  );
}

export default function PatientPage({ patient: p, onLaunch, onViewDoc }: Props) {
  const days = p.denial ? daysToAppeal(p.denial.denialDate) : 0;

  return (
    <div className="mx-auto max-w-6xl px-8 py-7">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
        {/* Left column — profile */}
        <div className="space-y-5">
          <div className="card overflow-hidden">
            <div className="flex flex-col items-center bg-teal px-5 py-6 text-white">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-xl font-semibold">
                {initials(p.name)}
              </span>
              <div className="mt-3 text-lg font-semibold">{p.name}</div>
              <div className="text-xs text-white/70">{p.age} years · {p.sex}</div>
            </div>
            <dl className="px-5 py-3">
              <Field label="Date of birth" value={p.dob} />
              <Field label="MRN" value={p.mrn} />
              <Field label="Member ID" value={p.memberId} />
              <Field label="Diagnosis" value={`${p.diagnosis} (${p.diagnosisCode})`} />
              <Field label="Primary care" value={p.pcp} />
              <Field label="Provider" value={p.provider} />
            </dl>
          </div>

          {/* Documents */}
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent-soft text-accent"><IconDoc className="h-3.5 w-3.5" /></span>
              <h3 className="text-sm font-semibold text-ink">Documents</h3>
            </div>
            <div className="space-y-1.5">
              {p.documents.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onViewDoc(d.id)}
                  className="group flex w-full items-center justify-between rounded-lg border border-line px-3 py-2.5 text-left transition hover:border-accent-ring hover:bg-accent-soft/50"
                >
                  <span className="flex items-center gap-2.5 text-[13px] text-slate-700">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-page text-slate-500 group-hover:text-accent">
                      <IconDoc className="h-4 w-4" />
                    </span>
                    {d.label}
                  </span>
                  <IconArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-accent" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — denial + action + criteria */}
        <div className="space-y-5">
          {p.denial && (
            <div className="overflow-hidden rounded-2xl bg-teal text-white shadow-card">
              <div className="px-6 py-5">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Claim denied</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/90">
                    <IconClock className="h-3.5 w-3.5" /> {days} days left to file
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-semibold">{p.denial.procedure}</h2>
                <div className="mt-1 text-sm text-white/70">
                  {p.denial.payer} · Claim {p.denial.claim} · CPT {p.denial.cpt} · ICD-10 {p.denial.icd10}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/10 px-3.5 py-2.5">
                    <div className="text-[11px] text-white/60">Denial date</div>
                    <div className="text-sm font-medium">{p.denial.denialDate}</div>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3.5 py-2.5">
                    <div className="text-[11px] text-white/60">Policy cited</div>
                    <div className="text-sm font-medium">MP-142 §4.1</div>
                  </div>
                </div>
                <p className="mt-4 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-[13px] leading-relaxed text-white/85">
                  “{p.denial.reason}”
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-black/10 px-6 py-3.5">
                <span className="text-xs text-white/70">Draft a filing-ready appeal grounded in the payer's own policy.</span>
                <button
                  onClick={() => p.caseId && onLaunch(p.caseId)}
                  className="flex shrink-0 items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-accent-hover"
                >
                  <IconPlay className="h-3.5 w-3.5" />
                  Launch appeal agent
                </button>
              </div>
            </div>
          )}

          {/* What the agent will check */}
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent-soft text-accent"><IconList className="h-3.5 w-3.5" /></span>
              <h3 className="text-sm font-semibold text-ink">What the agent checks</h3>
              <span className="text-xs text-muted">Meridian Medical Policy MP-142 §4</span>
            </div>
            <ul className="space-y-2">
              {MP142_CRITERIA.map((c) => (
                <li key={c.id} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                  <span className="mt-0.5 shrink-0 rounded-md bg-page px-1.5 py-0.5 font-mono text-[11px] font-semibold text-accent">§{c.id}</span>
                  {c.text}
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-page px-3 py-2 text-[11px] text-muted">
              <IconScale className="h-3.5 w-3.5 text-slate-400" />
              The agent retrieves evidence per criterion, runs deterministic date/code tools, and either drafts an appeal or reports the gaps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
