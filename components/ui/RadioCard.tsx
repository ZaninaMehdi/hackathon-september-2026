type RadioCardProps = {
  selected: boolean;
  label: string;
  meta?: string;
  onClick?: () => void;
};

export function RadioCard({ selected, label, meta, onClick }: RadioCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-[15px] text-left ${
        selected ? "border-2 border-accent bg-accent-tint" : "border border-border bg-white"
      }`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] shrink-0 rounded-full ${
          selected ? "border-[5px] border-accent bg-white" : "border-[1.5px] border-border-strong bg-white"
        }`}
      />
      <span className={`text-[15px] ${selected ? "font-semibold text-ink" : "text-body"}`}>
        {label}
      </span>
      {meta && <span className="ml-auto whitespace-nowrap font-mono text-[11.5px] text-body">{meta}</span>}
    </button>
  );
}
