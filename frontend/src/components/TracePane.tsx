import { useEffect, useRef } from "react";
import type { AppState } from "../state";
import type { Citation, VerdictStatus } from "../types";
import { VERDICT_STYLE, STRENGTH_STYLE } from "../verdict";
import CitationChip from "./CitationChip";
import {
  IconPlan,
  IconList,
  IconSearch,
  IconTool,
  IconScale,
  IconTarget,
  IconClock,
  IconCheck,
  IconX,
  IconQuestion,
  IconArrowRight,
} from "./icons";

interface Props {
  state: AppState;
  tick: number;
  onOpenCitation: (c: Citation) => void;
}

function StatusIcon({ status }: { status?: VerdictStatus }) {
  if (status === "met") return <IconCheck className="h-4 w-4 text-met" />;
  if (status === "not_met") return <IconX className="h-4 w-4 text-unmet" />;
  if (status === "cannot_verify") return <IconQuestion className="h-4 w-4 text-verify" />;
  return <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-slate-300" />;
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="card animate-slide-up p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent-soft text-accent">{icon}</span>
        <div className="text-[13px] font-semibold text-ink">{title}</div>
      </div>
      {children}
    </div>
  );
}

export default function TracePane({ state, tick, onOpenCitation }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [tick]);

  const { plan, criteria, order, perCriterion, decision, deadline } = state;

  return (
    <div className="flex flex-col gap-3">
      {!plan && !state.error && (
        <div className="card border-dashed p-8 text-center text-sm text-muted">
          Select a case and press <span className="font-medium text-ink">Run agent</span> to watch the agent work
          through the denial step by step.
        </div>
      )}

      {plan && (
        <Card icon={<IconPlan className="h-3.5 w-3.5" />} title="Plan">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
            <div><span className="text-muted">Member:</span> {plan.ingest.member}</div>
            <div><span className="text-muted">Claim:</span> {plan.ingest.claim_id}</div>
            <div><span className="text-muted">Service:</span> {plan.ingest.cpt} / {plan.ingest.icd10}</div>
            <div><span className="text-muted">Denied:</span> {plan.ingest.denial_date}</div>
          </div>
          <p className="mt-2 border-l-2 border-line pl-3 text-xs text-muted">{plan.ingest.denial_reason}</p>
          <p className="mt-2 text-[13px] text-slate-700">{plan.plan}</p>
        </Card>
      )}

      {criteria.length > 0 && (
        <Card icon={<IconList className="h-3.5 w-3.5" />} title={`Policy criteria (${criteria.length})`}>
          <ul className="space-y-1.5">
            {criteria.map((c) => {
              const v = perCriterion[c.criterion_id]?.verdict;
              return (
                <li key={c.criterion_id} className="flex items-start gap-2.5 text-[13px]">
                  <span className="mt-0.5 shrink-0">
                    <StatusIcon status={v?.status} />
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted">§{c.criterion_id}</span>
                  <span className={v ? "text-slate-700" : "text-slate-500"}>{c.requirement_text}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {order.map((id) => {
        const run = perCriterion[id];
        const crit = criteria.find((c) => c.criterion_id === id);
        if (!run) return null;
        const v = run.verdict;
        return (
          <div key={id} className="card animate-slide-up p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-md bg-accent-soft px-1.5 py-0.5 font-mono text-xs font-semibold text-accent">
                §{id}
              </span>
              <span className="text-[13px] text-slate-700">{crit?.requirement_text}</span>
            </div>

            {/* Retrievals — the two-step §4.1 reads as chart → came up short → PT notes */}
            <div className="space-y-2">
              {run.retrievals.map((r: any, i: number) => (
                <div key={i}>
                  {i > 0 && (
                    <div className="my-1.5 flex items-center gap-2 pl-1 text-[11px] font-semibold text-verify">
                      <IconArrowRight className="h-3.5 w-3.5" />
                      First pass came up short — re-retrieving into {r.doc_types.join(", ")}
                    </div>
                  )}
                  <div className="monobox bg-page">
                    <div className="flex flex-wrap items-center gap-2 font-sans text-xs text-slate-600">
                      <IconSearch className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-medium text-ink">Retrieval #{r.retrieval_number}</span>
                      <span className="tag">{r.doc_types.join(", ")}</span>
                      {r.reranked && (
                        <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">
                          reranked · VultronRetriever
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 text-[11px] text-slate-500">query: {r.query}</div>
                    <ul className="mt-1.5 space-y-1 font-sans">
                      {r.chunks.length === 0 && (
                        <li className="text-[11px] italic text-verify">no passages — required documentation absent</li>
                      )}
                      {r.chunks.map((c: any, j: number) => (
                        <li key={j} className="text-[11px] text-slate-500">
                          <span className="text-slate-600">{c.doc_title}</span>
                          <span className="text-slate-400"> § {c.section_heading}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Tool calls */}
            {run.tools.map((t: any, i: number) => (
              <div key={i} className="monobox mt-2 bg-page">
                <div className="flex items-center gap-2 font-sans text-xs text-slate-700">
                  <IconTool className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-mono font-semibold text-ink">{t.tool}</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500">in: {JSON.stringify(t.inputs)}</div>
                <div className="mt-0.5 text-[11px] text-green-700">out: {JSON.stringify(t.outputs)}</div>
              </div>
            ))}

            {/* Verdict */}
            {v && (
              <div className={`mt-2.5 rounded-lg border p-3 ${VERDICT_STYLE[v.status as VerdictStatus].border} ${VERDICT_STYLE[v.status as VerdictStatus].bg}`}>
                <div className="flex items-center gap-2">
                  <IconScale className={`h-4 w-4 ${VERDICT_STYLE[v.status as VerdictStatus].text}`} />
                  <span className={`text-xs font-bold uppercase tracking-wide ${VERDICT_STYLE[v.status as VerdictStatus].text}`}>
                    {VERDICT_STYLE[v.status as VerdictStatus].label}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] text-slate-700">{v.rationale}</p>
                {v.citations?.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    {v.citations.map((c: Citation, k: number) => (
                      <CitationChip
                        key={k}
                        label={`${c.doc_title.split(" — ")[0].split(" (")[0]} §${c.section_heading}`}
                        onClick={() => onOpenCitation(c)}
                      />
                    ))}
                  </div>
                )}
                {v.documentation_request && (
                  <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-[12px] text-amber-800">
                    Needs: {v.documentation_request}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {deadline && (
        <Card icon={<IconClock className="h-3.5 w-3.5" />} title="Filing deadline">
          <div className="monobox bg-page">
            <div className="text-[11px] text-slate-500">in: {JSON.stringify(state.deadlineTool.inputs)}</div>
            <div className="mt-0.5 text-[11px] text-green-700">out: {JSON.stringify(deadline)}</div>
          </div>
        </Card>
      )}

      {decision && (
        <div className={`card animate-slide-up p-4 ring-1 ${STRENGTH_STYLE[decision.strength]?.ring ?? "ring-line"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <IconTarget className="h-3.5 w-3.5" />
              </span>
              <span className="text-[13px] font-semibold text-ink">Decision</span>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${STRENGTH_STYLE[decision.strength]?.text} ${STRENGTH_STYLE[decision.strength]?.bg}`}>
              {decision.strength}
            </span>
          </div>
          <div className="mt-2 text-xs text-muted">
            Criteria coverage: <span className="font-semibold text-ink">{decision.met}/{decision.total}</span> met ({decision.coverage})
          </div>
        </div>
      )}

      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Agent error: {state.error}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
