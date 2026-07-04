import { useEffect, useReducer, useRef, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import TracePane from "./components/TracePane";
import OutputPane from "./components/OutputPane";
import CitationDrawer from "./components/CitationDrawer";
import { initialState, reducer } from "./state";
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
  const [selected, setSelected] = useState("A");
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

  const run = () => {
    esRef.current?.close();
    dispatch({ type: "reset" });
    setTick(0);
    setRunning(true);

    const es = new EventSource(`/api/run/${selected}`);
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

  const openCitation = (c: Citation) => setDrawer({ docId: c.doc_id, quote: c.quote });

  return (
    <div className="flex h-screen flex-col">
      <Header
        cases={cases}
        selected={selected}
        onSelect={setSelected}
        onRun={run}
        running={running}
        deadline={state.deadline}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
        {/* LEFT — the live agent trace (the star) */}
        <section className="min-h-0 overflow-auto border-r border-slate-800 p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Agent trace
            {running && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />}
          </div>
          <TracePane state={state} tick={tick} onOpenCitation={openCitation} />
        </section>

        {/* RIGHT — the output builds */}
        <section className="min-h-0 overflow-hidden">
          <OutputPane state={state} onOpenCitation={openCitation} />
        </section>
      </div>

      <Footer />

      <CitationDrawer
        docId={drawer?.docId ?? null}
        quote={drawer?.quote ?? ""}
        onClose={() => setDrawer(null)}
      />
    </div>
  );
}
