import { useEffect, useReducer, useRef, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Worklist from "./components/Worklist";
import TracePane from "./components/TracePane";
import OutputPane from "./components/OutputPane";
import CitationDrawer from "./components/CitationDrawer";
import { initialState, reducer } from "./state";
import { CASE_META, PAYER } from "./caseMeta";
import type { CaseInfo, Citation, EventType } from "./types";

const EVENT_TYPES: EventType[] = [
  "plan",
  "criteria",
  "criterion_start",
  "retrieval",
  "tool_call",
  "verdict",
  "decision",
  "letter",
  "gap_report",
  "done",
  "error",
];

export default function App() {
  const [cases, setCases] = useState<CaseInfo[]>([]);
  const [view, setView] = useState<"worklist" | "case">("worklist");
  const [selected, setSelected] = useState<string>("A");
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [drawer, setDrawer] = useState<{ docId: string; quote: string } | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetch("/api/cases")
      .then((r) => r.json())
      .then(setCases)
      .catch(() => setCases([]));
    return () => esRef.current?.close();
  }, []);

  const run = (caseId: string) => {
    esRef.current?.close();
    dispatch({ type: "reset" });
    setTick(0);
    setRunning(true);

    const es = new EventSource(`/api/run/${caseId}`);
    esRef.current = es;

    for (const t of EVENT_TYPES) {
      es.addEventListener(t, (e) => {
        // The "error" listener also receives EventSource's native connection
        // error, which carries no data — ignore those here (onerror handles
        // them) and guard against any malformed payload.
        const raw = (e as MessageEvent).data;
        if (raw == null) return;
        let payload: any;
        try {
          payload = JSON.parse(raw);
        } catch {
          return;
        }
        dispatch({ type: "event", event: { type: t, payload } });
        setTick((n) => n + 1);
        if (t === "done" || t === "error") {
          es.close();
          setRunning(false);
        }
      });
    }
    es.onerror = () => {
      es.close();
      setRunning(false);
    };
  };

  const openCase = (id: string) => {
    setSelected(id);
    setView("case");
    run(id);
  };

  const backToWorklist = () => {
    esRef.current?.close();
    setRunning(false);
    setView("worklist");
  };

  const openCitation = (c: Citation) => setDrawer({ docId: c.doc_id, quote: c.quote });

  const activeCase = cases.find((c) => c.id === selected);
  const claim = CASE_META[selected]?.claim ?? "";

  if (view === "worklist") {
    return (
      <div className="flex h-screen flex-col">
        <Header mode="worklist" onBack={backToWorklist} onRerun={() => run(selected)} running={running} />
        <div className="min-h-0 flex-1 overflow-auto">
          <Worklist cases={cases} onOpen={openCase} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <Header
        mode="case"
        onBack={backToWorklist}
        onRerun={() => run(selected)}
        running={running}
        deadline={state.deadline}
        caseContext={activeCase ? { patient: activeCase.patient, claim } : undefined}
      />

      {/* Email-origin framing — pure visual, implies the denial arrived by mail */}
      <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/50 px-6 py-1.5 text-[11px] text-slate-500">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent/70" />
        Denial received — from <span className="text-slate-400">{PAYER}</span> · attachment: denial letter
        <span className="font-mono text-slate-400">{claim}</span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
        <section className="min-h-0 overflow-auto border-r border-slate-800 p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Agent trace
            {running && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />}
          </div>
          <TracePane state={state} tick={tick} onOpenCitation={openCitation} />
        </section>

        <section className="min-h-0 overflow-hidden">
          <OutputPane state={state} onOpenCitation={openCitation} />
        </section>
      </div>

      <Footer />

      <CitationDrawer docId={drawer?.docId ?? null} quote={drawer?.quote ?? ""} onClose={() => setDrawer(null)} />
    </div>
  );
}
