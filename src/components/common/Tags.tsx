'use client';

import { Tag } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Post tags, always on a single row (DESIGN.md §5.2). When the chips are wider
 * than their container the list loops seamlessly: the track holds two copies and
 * slides by half its width. A single measurement (no per-chip summing) decides
 * whether to animate, and the duration keeps the speed constant.
 */
export const Tags = ({ tags }: { tags: string }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState<number | null>(null);

  const list = useMemo(
    () =>
      tags ? Array.from(tags.matchAll(/"([^"]*?)"/g), (match) => match[1]) : [],
    [tags]
  );

  useEffect(() => {
    const track = trackRef.current;
    const viewport = track?.parentElement;
    if (!track || !viewport) return;

    const measure = () => {
      const single = track.scrollWidth / 2;
      const overflows = single > viewport.clientWidth + 1;
      setDuration(overflows ? Math.max(12, Math.round(single / 45)) : null);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  if (list.length === 0) return null;

  const chips = (copy: string, hidden: boolean) => (
    <div aria-hidden={hidden || undefined} className="flex shrink-0">
      {list.map((tag) => (
        <span
          className="mr-2 inline-flex shrink-0 items-center gap-1 rounded border border-border-subtle bg-surface-raised px-2 py-0.5 font-mono text-xs text-text-muted"
          key={`${copy}-${tag}`}
        >
          <Tag className="h-3 w-3 shrink-0 text-accent-violet/70" />
          {tag}
        </span>
      ))}
    </div>
  );

  return (
    <div className="tags-row relative w-full overflow-hidden">
      <div
        className={`flex w-max ${duration ? 'animate-tags' : ''}`}
        ref={trackRef}
        style={
          duration
            ? ({ '--tags-duration': `${duration}s` } as React.CSSProperties)
            : undefined
        }
      >
        {chips('first', false)}
        {chips('copy', true)}
      </div>
    </div>
  );
};

export default Tags;
