import { IconGrid, IconInbox, IconDoc, IconGear, IconHelp } from "./icons";

interface Props {
  onHome: () => void;
}

// Slim navigation rail (Finexy-style). The inbox item is the live action
// (return to the worklist); the rest are quiet, non-functional affordances
// that give the product its enterprise shell.
export default function Sidebar({ onHome }: Props) {
  return (
    <aside className="flex w-16 shrink-0 flex-col items-center border-r border-line bg-white py-4">
      <button
        onClick={onHome}
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-card"
        title="Overturn"
      >
        <span className="text-lg font-bold leading-none">O</span>
      </button>

      <nav className="flex flex-1 flex-col items-center gap-1.5">
        <button
          onClick={onHome}
          title="Denials worklist"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"
        >
          <IconInbox className="h-5 w-5" />
        </button>
        {[IconGrid, IconDoc].map((Icon, i) => (
          <button
            key={i}
            disabled
            className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl text-slate-300"
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </nav>

      <div className="flex flex-col items-center gap-1.5">
        {[IconGear, IconHelp].map((Icon, i) => (
          <button
            key={i}
            disabled
            className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl text-slate-300"
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>
    </aside>
  );
}
