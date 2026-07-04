import { useEffect } from "react";

interface Props {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}

export default function Modal({ title, subtitle, onClose, children, width = "max-w-lg" }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <div className={`animate-slide-up relative z-10 w-full ${width} overflow-hidden rounded-2xl border border-line bg-white shadow-pop`}>
        <div className="flex items-start justify-between border-b border-line px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-line px-2.5 py-1 text-xs text-slate-600 hover:bg-page"
          >
            Close ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
