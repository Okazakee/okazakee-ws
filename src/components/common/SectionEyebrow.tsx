interface SectionEyebrowProps {
  index: number;
  label: string;
}

export function SectionEyebrow({ index, label }: SectionEyebrowProps) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-border-subtle pb-2.5 font-mono text-xs tracking-wider text-text-dim">
      <span aria-hidden="true" className="text-accent-violet">
        &gt;
      </span>
      <span aria-hidden="true">{`${String(index).padStart(2, '0')}.`}</span>
      <h3>{label}</h3>
    </div>
  );
}
