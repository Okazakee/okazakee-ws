import { Tag } from 'lucide-react';

/**
 * Post tags, canon chip row (docs/DESIGN.md §5.2): chips wrap like the mock
 * when the list is wider than its container, so nothing is duplicated and no
 * marquee machinery is needed.
 */
export const Tags = ({ tags }: { tags: string }) => {
  const list = tags
    ? Array.from(tags.matchAll(/"([^"]*?)"/g), (match) => match[1])
    : [];

  if (list.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((tag) => (
        <span
          className="inline-flex items-center gap-1 rounded border border-border-subtle bg-surface-raised px-2 py-0.5 font-mono text-xs text-text-muted"
          key={tag}
        >
          <Tag className="mr-0.5 h-3 w-3 shrink-0 text-accent-violet/70" />
          {tag}
        </span>
      ))}
    </div>
  );
};

export default Tags;
