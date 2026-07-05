import { useEffect, useReducer, useRef, useState } from "react";
import TopBar from "./components/TopBar";
import Footer from "./components/Footer";
import Dashboard from "./components/Dashboard";
import PatientPage from "./components/PatientPage";
import TracePane from "./components/TracePane";
import OutputPane from "./components/OutputPane";
import CitationDrawer from "./components/CitationDrawer";
import DocumentsModal from "./components/DocumentsModal";
import { SettingsModal, HelpModal } from "./components/InfoModals";
import { initialState, reducer } from "./state";
import { PATIENTS, PAYER } from "./patients";
import type { Citation, EventType } from "./types";

const EVENT_TYPES: EventType[] = [
  "plan", "criteria", "criterion_start", "retrieval", "tool_call",
  "verdict", "decision", "letter", "gap_report", "done", "error",
];

type View = "dashboard" | "patient" | "run";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [patientId, setPatientId] = useState<string>("A");
  const [caseId, setCaseId] = useState<string>("A");
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [drawer, setDrawer] = useState<{ docId: string; quote: string } | null>(null);
  const [overlay, setOverlay] = useState<null | "documents" | "settings" | "help">(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => () => esRef.current?.close(), []);

  const run = (cid: string) => {
    esRef.current?.close();
    dispatch({ type: "reset" });
    setTick(0);
    setRunning(true);
    const es = new EventSource(`/api/run/${cid}`);
    esRef.current = es;
    for (const t of EVENT_TYPES) {
      es.addEventListener(t, (e) => {
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

  const openPatient = (id: string) => {
    setPatientId(id);
    setView("patient");
  };
  const launchAgent = (cid: string) => {
    setCaseId(cid);
    setView("run");
    run(cid);
  };
  const stopStream = () => {
    esRef.current?.close();
    setRunning(false);
  };
  const gotoDashboard = () => {
    stopStream();
    setView("dashboard");
  };
  const gotoPatient = () => {
    stopStream();
    setView("patient");
  };

  const openCitation = (c: Citation) => setDrawer({ docId: c.doc_id, quote: c.quote });
  const viewDocument = (docId: string) => {
    setOverlay(null);
    setDrawer({ docId, quote: "" });
  };

  const patient = PATIENTS.find((p) => p.id === patientId) ?? PATIENTS[0];

  const overlays = (
    <>
      <CitationDrawer docId={drawer?.docId ?? null} quote={drawer?.quote ?? ""} onClose={() => setDrawer(null)} />
      {overlay === "documents" && <DocumentsModal onView={viewDocument} onClose={() => setOverlay(null)} />}
      {overlay === "settings" && <SettingsModal onClose={() => setOverlay(null)} />}
      {overlay === "help" && <HelpModal onClose={() => setOverlay(null)} />}
    </>
  );

  const topbar = (
    <TopBar
      activeNav="dashboard"
      onNav={(n) => (n === "dashboard" ? gotoDashboard() : setOverlay("documents"))}
      onOpenPatient={openPatient}
      onSettings={() => setOverlay("settings")}
      onHelp={() => setOverlay("help")}
    />
  );

  const Crumb = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-3 border-b border-line bg-white px-6 py-2.5">{children}</div>
  );
  const BackBtn = ({ onClick, label }: { onClick: () => void; label: string }) => (
    <button onClick={onClick} className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-page">
      ← {label}
    </button>
  );

  // -------- Dashboard --------
  if (view === "dashboard") {
    return (
      <div className="flex h-screen flex-col bg-page">
        {topbar}
        <div className="min-h-0 flex-1 overflow-auto">
          <Dashboard onOpenPatient={openPatient} />
        </div>
        <Footer />
        {overlays}
      </div>
    );
  }

  // -------- Patient page --------
  if (view === "patient") {
    return (
      <div className="flex h-screen flex-col bg-page">
        {topbar}
        <Crumb>
          <BackBtn onClick={gotoDashboard} label="Dashboard" />
          <span className="text-xs text-muted">Patients</span>
          <span className="text-xs text-slate-300">/</span>
          <span className="text-xs font-medium text-ink">{patient.name}</span>
        </Crumb>
        <div className="min-h-0 flex-1 overflow-auto">
          <PatientPage patient={patient} onLaunch={launchAgent} onViewDoc={viewDocument} />
        </div>
        <Footer />
        {overlays}
      </div>
    );
  }

  // -------- Agent run --------
  return (
    <div className="flex h-screen flex-col bg-page">
      {topbar}
      <Crumb>
        <BackBtn onClick={gotoPatient} label={patient.name} />
        <span className="text-xs text-muted">Patients</span>
        <span className="text-xs text-slate-300">/</span>
        <span className="text-xs text-muted">{patient.name}</span>
        <span className="text-xs text-slate-300">/</span>
        <span className="text-xs font-medium text-ink">Appeal agent</span>
        <div className="ml-auto flex items-center gap-2.5">
          {state.deadline && (
            <span className="flex items-center gap-1.5 rounded-full border border-accent-ring bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent">
              ⏱ {state.deadline.days_remaining} days left to file
            </span>
          )}
          <button
            onClick={() => run(caseId)}
            disabled={running}
            className="rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-white shadow-card transition hover:bg-accent-hover disabled:opacity-60"
          >
            {running ? "Running…" : "Re-run agent"}
          </button>
        </div>
      </Crumb>

      <div className="flex items-center gap-2 border-b border-line bg-white px-6 py-1.5 text-[11px] text-muted">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
        Denial received — from <span className="font-medium text-slate-600">{PAYER}</span> · attachment: denial letter
        <span className="font-mono text-slate-600">{patient.denial?.claim}</span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
        <section className="min-h-0 overflow-auto border-r border-line bg-page p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
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
      {overlays}
    </div>
  );
}
