import { useEffect, useRef, useState } from "react";
import { findQuoteRange } from "../highlight";

interface Props {
  docId: string | null;
  quote: string;
  onClose: () => void;
}

export default function CitationDrawer({ docId, quote, onClose }: Props) {
  const [doc, setDoc] = useState<{ title: string; markdown: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const markRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!docId) return;
    setLoading(true);
    setDoc(null);
    fetch(`/api/document/${docId}`)
      .then((r) => r.json())
      .then((d) => setDoc({ title: d.title, markdown: d.markdown }))
      .catch(() => setDoc(null))
      .finally(() => setLoading(false));
  }, [docId]);

  useEffect(() => {
    if (markRef.current) markRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [doc, quote]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!docId) return null;

  let body: React.ReactNode = null;
  if (doc) {
    const range = findQuoteRange(doc.markdown, quote);
    if (range) {
      const [s, e] = range;
      body = (
        <>
          {doc.markdown.slice(0, s)}
          <mark ref={markRef} className="rounded bg-accent/40 px-0.5 text-white ring-1 ring-accent/60">
            {doc.markdown.slice(s, e)}
          </mark>
          {doc.markdown.slice(e)}
        </>
      );
    } else {
      body = doc.markdown;
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="animate-drawer-in relative z-10 flex h-full w-full max-w-xl flex-col border-l border-slate-700 bg-slate-900 shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-700 px-5 py-3.5">
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Source document</div>
            <h2 className="truncate text-sm font-semibold text-slate-100">{doc?.title ?? "Loading…"}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            Close ✕
          </button>
        </header>
        <div className="mb-3 border-b border-slate-800 px-5 py-2.5">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">Cited passage</div>
          <p className="mt-1 text-xs italic text-accent/90">“{quote}”</p>
        </div>
        <div className="flex-1 overflow-auto px-5 pb-6">
          {loading && <div className="text-sm text-slate-500">Loading document…</div>}
          {doc && (
            <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed text-slate-300">
              {body}
            </pre>
          )}
        </div>
      </aside>
    </div>
  );
}
