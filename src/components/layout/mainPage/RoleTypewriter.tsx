'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { InnerHtml } from '@/components/common/InnerHtml';
import {
  parseTypewriterRuns,
  typewriterHtml,
  typewriterLength,
} from '@/utils/heroDisplay';
import { typewriterPhases } from './heroAnimationState';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
const startDelayMs = 400;
const typeDelayMs = 55;
const eraseDelayMs = 28;
const holdMs = 1600;

interface RoleTypewriterProps {
  text: string;
  /** Stable position in the role list; keys the resumable reveal phase. */
  slot: number;
  /** Single-role hero: type once, keep the line, drop the cursor. Loops otherwise. */
  once?: boolean;
  as?: 'p' | 'span' | 'div';
  className?: string;
}

/**
 * One hero role line typed out on a loop (docs/DESIGN.md §3). The first paint
 * is the complete line, so server output, hydration and visitors who ask for
 * reduced motion all get today's static markup; only the typed reveal runs as
 * an effect, and it never starts while motion is reduced.
 *
 * A blinking terminal cursor rides at the insertion point, in the accent tone
 * that follows the theme tokens, while the line animates. With `once` (a
 * single role) the line types once and settles without it; otherwise it keeps
 * typing and erasing.
 *
 * The reveal phase lives in the document-scoped hero session: a locale switch
 * remounts this line with the other locale's text, and the reveal continues
 * from the same character index instead of restarting or cutting ahead.
 */
export function RoleTypewriter({
  text,
  slot,
  once = false,
  as = 'p',
  className,
}: RoleTypewriterProps) {
  const runs = useMemo(() => parseTypewriterRuns(text), [text]);
  const total = typewriterLength(runs);
  const [revealed, setRevealed] = useState(total);
  const [cursorVisible, setCursorVisible] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (total === 0) return;
    if (window.matchMedia(reducedMotionQuery).matches) return;

    const resume = typewriterPhases.get(slot) ?? null;
    let typed = Math.min(resume?.typed ?? 0, total);
    let erasing = resume?.erasing ?? false;

    // A single-role line that already finished in this document stays
    // finished: full text, no cursor, no timers.
    if (once && resume && typed >= total && !erasing) {
      setRevealed(total);
      return;
    }

    setRevealed(typed);
    setCursorVisible(true);

    const tick = () => {
      if (!erasing) {
        if (typed < total) {
          typed += 1;
          setRevealed(typed);
          timer.current = window.setTimeout(tick, typeDelayMs);
          return;
        }
        if (once) {
          // Done: the cursor goes with the animation, the line stays.
          typewriterPhases.set(slot, { typed, erasing });
          setCursorVisible(false);
          return;
        }
        erasing = true;
        timer.current = window.setTimeout(tick, holdMs);
        return;
      }
      if (typed === 0) {
        erasing = false;
        timer.current = window.setTimeout(tick, typeDelayMs);
        return;
      }
      typed -= 1;
      setRevealed(typed);
      timer.current = window.setTimeout(tick, eraseDelayMs);
    };

    timer.current = window.setTimeout(
      tick,
      resume ? typeDelayMs : startDelayMs
    );

    return () => {
      clearTimeout(timer.current);
      typewriterPhases.set(slot, { typed, erasing });
    };
  }, [slot, total, once]);

  return (
    <InnerHtml
      as={as}
      className={className}
      html={typewriterHtml(
        runs,
        revealed,
        cursorVisible ? 'typewriter-cursor' : undefined
      )}
    />
  );
}
