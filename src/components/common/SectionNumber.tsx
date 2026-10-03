/**
 * Section index badge (docs/DESIGN.md §4): the `01`, `02`, ... marker that
 * matches the numbering the navbar shows for the same sections, so the anchor
 * you clicked and the heading you landed on carry the same index. Sits inline
 * to the left of the section name.
 */
export function SectionNumber({ index }: { index: number }) {
  return (
    <span className="font-mono text-xs tracking-[0.2em] text-accent-violet-light">
      {String(index).padStart(2, '0')}
    </span>
  );
}