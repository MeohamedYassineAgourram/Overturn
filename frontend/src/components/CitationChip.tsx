interface Props {
  label: string;
  onClick: () => void;
}

export default function CitationChip({ label, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="mx-0.5 inline-flex items-center rounded-md border border-accent-ring bg-accent-soft px-1.5 py-0.5 align-baseline text-[11px] font-medium text-accent transition hover:bg-accent hover:text-white"
    >
      {label}
    </button>
  );
}
