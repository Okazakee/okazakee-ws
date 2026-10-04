/**
 * Section index badge (docs/DESIGN.md §4): the `01`, `02`, ... marker that
 * matches the numbering the navbar shows for the same sections, so the anchor
 * you clicked and the heading you landed on carry the same index. Rendered in
 * the left column of the heading grid, so it hangs beside the section name
 * without pulling the title off the container's centre line.
 */
export function SectionNumber({
  className,
  index,
}: {
  className?: string;
  index: number;
}) {
  return (
    <span
      className={`font-mono text-xs tracking-[0.2em] text-accent-violet-light ${className ?? ''}`}
    >
      {String(index).padStart(2, '0')}
    </span>
  );
}