interface Props {
  label: string;
  onClick: () => void;
}

export default function CitationChip({ label, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="mx-0.5 inline-flex items-center rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 align-baseline text-[11px] font-medium text-accent transition hover:border-accent/70 hover:bg-accent/20"
    >
      {label}
    </button>
  );
}
