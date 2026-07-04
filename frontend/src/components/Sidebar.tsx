import { IconGrid, IconInbox, IconDoc, IconGear, IconHelp } from "./icons";

interface Props {
  active: "worklist" | "case";
  onHome: () => void;
  onDocuments: () => void;
  onSettings: () => void;
  onHelp: () => void;
}

function Item({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
        active ? "bg-accent/10 text-accent" : "text-slate-400 hover:bg-page hover:text-slate-600"
      }`}
    >
      {icon}
    </button>
  );
}

// Every rail item is now functional: inbox and dashboard return to the worklist;
// documents opens the source-document library; settings and help open modals.
export default function Sidebar({ active, onHome, onDocuments, onSettings, onHelp }: Props) {
  return (
    <aside className="flex w-16 shrink-0 flex-col items-center border-r border-line bg-white py-4">
      <button
        onClick={onHome}
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-card"
        title="Overturn — home"
      >
        <span className="text-lg font-bold leading-none">O</span>
      </button>

      <nav className="flex flex-1 flex-col items-center gap-1.5">
        <Item icon={<IconInbox className="h-5 w-5" />} label="Denials worklist" active={active === "worklist"} onClick={onHome} />
        <Item icon={<IconGrid className="h-5 w-5" />} label="Dashboard" onClick={onHome} />
        <Item icon={<IconDoc className="h-5 w-5" />} label="Documents" onClick={onDocuments} />
      </nav>

      <div className="flex flex-col items-center gap-1.5">
        <Item icon={<IconGear className="h-5 w-5" />} label="Settings" onClick={onSettings} />
        <Item icon={<IconHelp className="h-5 w-5" />} label="Help" onClick={onHelp} />
      </div>
    </aside>
  );
}
