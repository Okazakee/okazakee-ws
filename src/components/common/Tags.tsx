'use client';

import { Tag } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

/** Gap between chips in every state — also the marquee's loop distance slack. */
const CHIP_GAP = 6;

/**
 * Post tags, canon chip row (docs/DESIGN.md §5.2): the chips keep one line and
 * only when the list is wider than its container does the row become a seamless
 * marquee. The second copy exists only while looping, so a list that fits is
 * never duplicated.
 */
export const Tags = ({ tags }: { tags: string }) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [looping, setLooping] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  const list = useMemo(
    () =>
      tags
        ? Array.from(tags.matchAll(/"([^"]*?)"/g), (match) => match[1])
        : [],
    [tags]
  );

  useEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;

    const measure = () => {
      const copies = looping ? 2 : 1;
      // Track width includes the trailing chip gap; it must not count as
      // overflow, or a row that fits exactly would start looping.
      const single = track.scrollWidth / copies - CHIP_GAP;
      const reduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      const overflows = single > viewport.clientWidth + 1;

      if (overflows && !reduced) {
        if (!looping) setLooping(true);
        setDuration(Math.max(12, Math.round((single + CHIP_GAP) / 45)));
        return;
      }

      if (looping) setLooping(false);
      setDuration(null);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [looping, list.length]);

  if (list.length === 0) return null;

  const chip = (tag: string, index: number, copy: string) => (
    <span
      className="mr-1.5 inline-flex shrink-0 items-center gap-1 rounded border border-border-subtle bg-surface-raised px-2 py-0.5 font-mono text-xs text-text-muted"
      key={`${copy}-${tag}-${index}`}
    >
      <Tag className="mr-0.5 h-3 w-3 shrink-0 text-accent-violet/70" />
      {tag}
    </span>
  );

  const group = (copy: string, hidden: boolean) => (
    <div
      aria-hidden={hidden || undefined}
      className={looping ? 'flex shrink-0' : 'contents'}
      key={copy}
    >
      {list.map((tag, index) => chip(tag, index, copy))}
    </div>
  );

  return (
    <div
      className="tags-viewport relative w-full overflow-hidden"
      ref={viewportRef}
    >
      <div
        className={`flex w-max ${looping ? 'animate-tags' : ''}`}
        ref={trackRef}
        style={
          looping && duration
            ? ({ '--tags-duration': `${duration}s` } as React.CSSProperties)
            : undefined
        }
      >
        {group('single', false)}
        {looping ? group('loop', true) : null}
      </div>
    </div>
  );
};

export default Tags;
