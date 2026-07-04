import { useEffect, useRef, useState } from "react";
import DocumentArtifact from "./DocumentArtifact";

interface Props {
  docId: string | null;
  quote: string;
  onClose: () => void;
}

interface DocData {
  title: string;
  markdown: string;
  doc_type: string;
}

export default function CitationDrawer({ docId, quote, onClose }: Props) {
  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!docId) return;
    setLoading(true);
    setDoc(null);
    fetch(`/api/document/${docId}`)
      .then((r) => r.json())
      .then((d) => setDoc({ title: d.title, markdown: d.markdown, doc_type: d.doc_type }))
      .catch(() => setDoc(null))
      .finally(() => setLoading(false));
  }, [docId]);

  useEffect(() => {
    if (!doc) return;
    // Scroll the highlighted passage into view once rendered.
    const t = setTimeout(() => {
      scrollRef.current?.querySelector("#cited-mark")?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 60);
    return () => clearTimeout(t);
  }, [doc, quote]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!docId) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <aside className="animate-drawer-in relative z-10 flex h-full w-full max-w-xl flex-col border-l border-line bg-white shadow-pop">
        <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted">Source document</div>
            <h2 className="truncate text-sm font-semibold text-ink">{doc?.title ?? "Loading…"}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-line px-2.5 py-1 text-xs text-slate-600 hover:bg-page"
          >
            Close ✕
          </button>
        </header>
        {quote && (
          <div className="border-b border-line bg-accent-soft/40 px-5 py-2.5">
            <div className="text-[11px] uppercase tracking-wider text-muted">Cited passage</div>
            <p className="mt-1 text-xs italic text-accent">“{quote}”</p>
          </div>
        )}
        <div ref={scrollRef} className="flex-1 overflow-auto bg-page px-5 py-5">
          {loading && <div className="text-sm text-muted">Loading document…</div>}
          {doc && <DocumentArtifact docType={doc.doc_type} markdown={doc.markdown} quote={quote} />}
        </div>
      </aside>
    </div>
  );
}
