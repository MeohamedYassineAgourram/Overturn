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
  return <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-slate-600" />;
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
    <div className="animate-slide-up rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-2 flex items-center gap-2 text-slate-300">
        <span className="text-slate-400">{icon}</span>
        <div className="text-[13px] font-semibold uppercase tracking-wide">{title}</div>
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
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
          Select a case and press <span className="font-medium text-slate-300">Run agent</span> to watch the agent
          work through the denial step by step.
        </div>
      )}

      {plan && (
        <Card icon={<IconPlan className="h-4 w-4" />} title="Plan">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400">
            <div><span className="text-slate-500">Member:</span> {plan.ingest.member}</div>
            <div><span className="text-slate-500">Claim:</span> {plan.ingest.claim_id}</div>
            <div><span className="text-slate-500">Service:</span> {plan.ingest.cpt} / {plan.ingest.icd10}</div>
            <div><span className="text-slate-500">Denied:</span> {plan.ingest.denial_date}</div>
          </div>
          <p className="mt-2 border-l-2 border-slate-700 pl-3 text-xs text-slate-500">{plan.ingest.denial_reason}</p>
          <p className="mt-2 text-[13px] text-slate-300">{plan.plan}</p>
        </Card>
      )}

      {criteria.length > 0 && (
        <Card icon={<IconList className="h-4 w-4" />} title={`Policy criteria (${criteria.length})`}>
          <ul className="space-y-1.5">
            {criteria.map((c) => {
              const v = perCriterion[c.criterion_id]?.verdict;
              return (
                <li key={c.criterion_id} className="flex items-start gap-2.5 text-[13px]">
                  <span className="mt-0.5 shrink-0">
                    <StatusIcon status={v?.status} />
                  </span>
                  <span className="shrink-0 font-mono text-xs text-slate-500">§{c.criterion_id}</span>
                  <span className={v ? "text-slate-300" : "text-slate-400"}>{c.requirement_text}</span>
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
          <div key={id} className="animate-slide-up rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-accent">§{id}</span>
              <span className="text-[13px] text-slate-300">{crit?.requirement_text}</span>
            </div>

            {/* Retrievals — the two-step §4.1 reads as chart → came up short → PT notes */}
            <div className="space-y-2">
              {run.retrievals.map((r: any, i: number) => (
                <div key={i}>
                  {i > 0 && (
                    <div className="my-1.5 flex items-center gap-2 pl-1 text-[11px] font-medium text-verify">
                      <IconArrowRight className="h-3.5 w-3.5" />
                      First pass came up short — re-retrieving into {r.doc_types.join(", ")}
                    </div>
                  )}
                  <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <IconSearch className="h-3.5 w-3.5 text-slate-500" />
                      <span className="font-medium text-slate-300">Retrieval #{r.retrieval_number}</span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                        {r.doc_types.join(", ")}
                      </span>
                      {r.reranked && (
                        <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] text-accent">
                          reranked · VultronRetriever
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 font-mono text-[11px] text-slate-500">query: {r.query}</div>
                    <ul className="mt-1.5 space-y-1">
                      {r.chunks.length === 0 && (
                        <li className="text-[11px] italic text-verify/80">
                          no passages — required documentation absent
                        </li>
                      )}
                      {r.chunks.map((c: any, j: number) => (
                        <li key={j} className="text-[11px] text-slate-500">
                          <span className="text-slate-400">{c.doc_title}</span>
                          <span className="text-slate-600"> § {c.section_heading}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Tool calls */}
            {run.tools.map((t: any, i: number) => (
              <div key={i} className="mt-2 rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <IconTool className="h-3.5 w-3.5 text-slate-500" />
                  <span className="font-mono font-medium">{t.tool}</span>
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-500">in: {JSON.stringify(t.inputs)}</div>
                <div className="mt-0.5 font-mono text-[11px] text-met/90">out: {JSON.stringify(t.outputs)}</div>
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
                <p className="mt-1.5 text-[13px] text-slate-300">{v.rationale}</p>
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
                  <p className="mt-2 rounded border border-verify/30 bg-verify/5 px-2 py-1.5 text-[12px] text-verify/90">
                    Needs: {v.documentation_request}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {deadline && (
        <Card icon={<IconClock className="h-4 w-4" />} title="Filing deadline">
          <div className="font-mono text-[11px] text-slate-500">
            in: {JSON.stringify(state.deadlineTool.inputs)}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-met/90">out: {JSON.stringify(deadline)}</div>
        </Card>
      )}

      {decision && (
        <div className={`animate-slide-up rounded-xl border p-4 ring-1 ${STRENGTH_STYLE[decision.strength]?.ring ?? ""} border-slate-800 bg-slate-900/60`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <IconTarget className="h-4 w-4 text-slate-400" />
              <span className="text-[13px] font-semibold uppercase tracking-wide">Decision</span>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${STRENGTH_STYLE[decision.strength]?.text} ${STRENGTH_STYLE[decision.strength]?.bg}`}>
              {decision.strength}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Criteria coverage: <span className="font-medium text-slate-200">{decision.met}/{decision.total}</span> met ({decision.coverage})
          </div>
        </div>
      )}

      {state.error && (
        <div className="rounded-xl border border-unmet/40 bg-unmet/10 p-4 text-sm text-unmet">
          Agent error: {state.error}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
