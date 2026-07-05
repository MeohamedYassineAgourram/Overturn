import { useEffect, useMemo, useRef, useState } from "react";
import { PATIENTS, PAYER, daysToAppeal, initials } from "../patients";
import { IconSearch, IconBell, IconArrowRight, IconInbox, IconGrid, IconDoc, IconGear, IconHelp } from "./icons";

type Nav = "dashboard" | "documents";

interface Props {
  activeNav: Nav;
  onNav: (n: Nav) => void;
  onOpenPatient: (id: string) => void;
  onSettings: () => void;
  onHelp: () => void;
}

const HOSPITAL = "Harborview Medical Center";

export default function TopBar({ activeNav, onNav, onOpenPatient, onSettings, onHelp }: Props) {
  const [menu, setMenu] = useState<null | "search" | "notif" | "account">(null);
  const [query, setQuery] = useState("");
  const [readIds, setReadIds] = useState<string[]>([]);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMenu("search");
      }
      if (e.key === "Escape") setMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (menu === "search") setTimeout(() => searchInput.current?.focus(), 20);
  }, [menu]);

  const notifs = useMemo(
    () => PATIENTS.map((p) => ({ id: p.id, name: p.name, procedure: p.denial?.procedure ?? "", days: p.denial ? daysToAppeal(p.denial.denialDate) : 0 })),
    []
  );
  const unread = notifs.filter((n) => !readIds.includes(n.id)).length;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PATIENTS;
    return PATIENTS.filter((p) =>
      [p.name, p.denial?.procedure ?? "", p.denial?.claim ?? "", p.denial?.cpt ?? "", p.diagnosis]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query]);

  const pick = (id: string) => {
    setMenu(null);
    setQuery("");
    onOpenPatient(id);
  };

  const navBtn = (n: Nav, label: string, Icon: (p: { className?: string }) => JSX.Element) => (
    <button
      onClick={() => onNav(n)}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        activeNav === n ? "bg-accent text-white shadow-card" : "text-muted hover:bg-page hover:text-ink"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <header className="relative z-20 flex items-center justify-between gap-4 border-b border-line bg-white px-6 py-2.5">
      <div className="flex items-center gap-5">
        <button onClick={() => onNav("dashboard")} className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
            <IconGrid className="h-4 w-4" />
          </span>
          <span className="text-base font-bold tracking-tight text-ink">Overturn</span>
        </button>
        <nav className="flex items-center gap-1 rounded-full border border-line bg-white p-1">
          {navBtn("dashboard", "Dashboard", IconInbox)}
          {navBtn("documents", "Documents", IconDoc)}
        </nav>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setMenu("search")}
          className="flex h-9 items-center gap-2 rounded-full border border-line px-3 text-slate-500 transition hover:bg-page"
          title="Search patients (⌘K)"
        >
          <IconSearch className="h-4 w-4" />
          <span className="hidden text-xs text-muted lg:inline">Search</span>
          <span className="hidden rounded border border-line bg-page px-1 text-[10px] text-muted lg:inline">⌘K</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setMenu(menu === "notif" ? null : "notif")}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line text-slate-500 transition hover:bg-page"
            title="Notifications"
          >
            <IconBell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          {menu === "notif" && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenu(null)} />
              <div className="absolute right-0 top-11 z-40 w-80 overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
                <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                  <span className="text-sm font-semibold text-ink">Notifications</span>
                  <button onClick={() => setReadIds(notifs.map((n) => n.id))} className="text-[11px] font-medium text-accent hover:underline">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-auto">
                  {notifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => pick(n.id)}
                      className="flex w-full items-start gap-3 border-b border-line/70 px-4 py-3 text-left transition last:border-0 hover:bg-page"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                        <IconInbox className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          {!readIds.includes(n.id) && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                          <span className="text-[13px] font-semibold text-ink">New denial · {n.name}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">{n.procedure} denied by {PAYER}</span>
                        <span className="mt-0.5 block text-[11px] text-slate-400">{n.days} days left to appeal</span>
                      </span>
                      <IconArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Account */}
        <div className="relative">
          <button
            onClick={() => setMenu(menu === "account" ? null : "account")}
            className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-2.5 transition hover:bg-page"
          >
            <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
              DY
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-xs font-semibold text-ink">Dr. Yassine</span>
              <span className="block text-[10px] text-muted">Billing &amp; Appeals</span>
            </span>
          </button>
          {menu === "account" && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenu(null)} />
              <div className="absolute right-0 top-12 z-40 w-72 overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
                <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white">
                    DY
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink">Dr. Yassine</div>
                    <div className="truncate text-xs text-muted">y.agourram@harborview.org</div>
                  </div>
                </div>
                <div className="space-y-2 px-4 py-3 text-xs">
                  <div className="flex items-center justify-between"><span className="text-muted">Facility</span><span className="font-medium text-slate-700">{HOSPITAL}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted">Status</span><span className="flex items-center gap-1.5 font-medium text-green-600"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Connected</span></div>
                </div>
                <div className="border-t border-line">
                  <button onClick={() => { setMenu(null); onSettings(); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-page">
                    <IconGear className="h-4 w-4 text-slate-400" /> Settings
                  </button>
                  <button onClick={() => { setMenu(null); onHelp(); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-page">
                    <IconHelp className="h-4 w-4 text-slate-400" /> Help
                  </button>
                  <button onClick={() => setMenu(null)} className="w-full border-t border-line px-4 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-page">
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search command palette */}
      {menu === "search" && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24">
          <div className="absolute inset-0 bg-slate-900/30" onClick={() => setMenu(null)} />
          <div className="animate-slide-up relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
            <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
              <IconSearch className="h-4 w-4 text-slate-400" />
              <input
                ref={searchInput}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patients by name, claim, procedure, or CPT…"
                className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
              />
              <span className="rounded border border-line bg-page px-1.5 py-0.5 text-[10px] text-muted">esc</span>
            </div>
            <div className="max-h-80 overflow-auto p-2">
              {results.length === 0 && <div className="px-3 py-6 text-center text-sm text-muted">No patients match “{query}”.</div>}
              {results.map((p) => (
                <button key={p.id} onClick={() => pick(p.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-page">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-xs font-semibold text-accent">{initials(p.name)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-ink">{p.name}</span>
                    <span className="block truncate text-xs text-muted">{p.denial?.procedure} · {p.denial?.claim}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-accent">Open <IconArrowRight className="h-3.5 w-3.5" /></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
