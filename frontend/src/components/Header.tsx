import { useEffect, useMemo, useRef, useState } from "react";
import type { CaseInfo, DeadlineResult } from "../types";
import { CASE_META, PAYER, daysToAppeal } from "../caseMeta";
import { IconClock, IconPlay, IconBell, IconSearch, IconArrowRight, IconInbox } from "./icons";

interface Props {
  mode: "worklist" | "case";
  onBack: () => void;
  onRerun: () => void;
  running: boolean;
  deadline?: DeadlineResult;
  caseContext?: { patient: string; claim: string };
  cases: CaseInfo[];
  onOpenCase: (id: string) => void;
}

const HOSPITAL = "Harborview Medical Center";

export default function Header({
  mode,
  onBack,
  onRerun,
  running,
  deadline,
  caseContext,
  cases,
  onOpenCase,
}: Props) {
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
    () =>
      cases.map((c) => ({
        id: c.id,
        patient: c.patient,
        procedure: CASE_META[c.id]?.procedure ?? c.title,
        days: daysToAppeal(c.denial_date),
      })),
    [cases]
  );
  const unread = notifs.filter((n) => !readIds.includes(n.id)).length;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((c) =>
      [c.patient, CASE_META[c.id]?.procedure ?? "", CASE_META[c.id]?.claim ?? "", c.cpt, `case ${c.id}`]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [cases, query]);

  const pick = (id: string) => {
    setMenu(null);
    setQuery("");
    onOpenCase(id);
  };

  return (
    <header className="relative flex items-center justify-between gap-4 border-b border-line bg-white px-6 py-3">
      <div className="flex items-center gap-3">
        {mode === "case" && (
          <button
            onClick={onBack}
            className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-page"
          >
            ← Worklist
          </button>
        )}
        {mode === "case" && caseContext ? (
          <div className="flex items-baseline gap-2.5">
            <span className="text-base font-semibold tracking-tight text-ink">{caseContext.patient}</span>
            <span className="font-mono text-xs text-muted">{caseContext.claim}</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-2.5">
            <span className="text-base font-semibold tracking-tight text-ink">Overturn</span>
            <span className="hidden text-sm text-muted sm:inline">Denial Appeal Agent</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {mode === "case" && deadline && (
          <div className="flex items-center gap-1.5 rounded-full border border-accent-ring bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent">
            <IconClock className="h-3.5 w-3.5" />
            {deadline.days_remaining} days left to file
          </div>
        )}

        {/* Search */}
        <button
          onClick={() => setMenu("search")}
          className="flex h-9 items-center gap-2 rounded-lg border border-line px-2.5 text-slate-500 transition hover:bg-page"
          title="Search cases (⌘K)"
        >
          <IconSearch className="h-4 w-4" />
          <span className="hidden text-xs text-muted lg:inline">Search</span>
          <span className="hidden rounded border border-line bg-page px-1 text-[10px] text-muted lg:inline">⌘K</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setMenu(menu === "notif" ? null : "notif")}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-line text-slate-500 transition hover:bg-page"
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
              <div className="absolute right-0 top-11 z-40 w-80 overflow-hidden rounded-xl border border-line bg-white shadow-pop">
                <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                  <span className="text-sm font-semibold text-ink">Notifications</span>
                  <button
                    onClick={() => setReadIds(notifs.map((n) => n.id))}
                    className="text-[11px] font-medium text-accent hover:underline"
                  >
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
                          <span className="text-[13px] font-semibold text-ink">New denial · {n.patient}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {n.procedure} denied by {PAYER}
                        </span>
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

        {mode === "case" && (
          <button
            onClick={onRerun}
            disabled={running}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconPlay className="h-3.5 w-3.5" />
            {running ? "Running…" : "Re-run agent"}
          </button>
        )}

        {/* Account */}
        <div className="relative ml-1">
          <button
            onClick={() => setMenu(menu === "account" ? null : "account")}
            className="flex items-center gap-2 rounded-lg border border-line py-1 pl-1 pr-2.5 transition hover:bg-page"
          >
            <span className="relative flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-semibold text-white">
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
              <div className="absolute right-0 top-12 z-40 w-72 overflow-hidden rounded-xl border border-line bg-white shadow-pop">
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
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Role</span>
                    <span className="font-medium text-slate-700">Billing &amp; Appeals</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Facility</span>
                    <span className="font-medium text-slate-700">{HOSPITAL}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Status</span>
                    <span className="flex items-center gap-1.5 font-medium text-green-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Connected
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMenu(null)}
                  className="w-full border-t border-line px-4 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-page"
                >
                  Sign out
                </button>
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
                placeholder="Search by patient, claim, procedure, or CPT…"
                className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
              />
              <span className="rounded border border-line bg-page px-1.5 py-0.5 text-[10px] text-muted">esc</span>
            </div>
            <div className="max-h-80 overflow-auto p-2">
              {results.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-muted">No cases match “{query}”.</div>
              )}
              {results.map((c) => (
                <button
                  key={c.id}
                  onClick={() => pick(c.id)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition hover:bg-page"
                >
                  <span>
                    <span className="block text-[13px] font-semibold text-ink">{c.patient}</span>
                    <span className="block text-xs text-muted">
                      {CASE_META[c.id]?.procedure ?? c.title} · {CASE_META[c.id]?.claim ?? c.cpt}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-accent">
                    Open <IconArrowRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
