'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { InnerHtml } from '@/components/common/InnerHtml';
import {
  parseTypewriterRuns,
  sharedTypewriterWords,
  typewriterHtml,
  typewriterLength,
  typewriterStep,
} from '@/utils/heroDisplay';
import {
  createKeystrokePacer,
  typewriterHoldMs,
  typewriterStartMs,
} from '@/utils/typewriterPacing';
import { typewriterPhases } from './heroAnimationState';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

interface RoleTypewriterProps {
  /**
   * The roles this line carries. A single role types once and settles; several
   * cycle — type, hold, backspace away, type the next.
   */
  roles: string[];
  /** Key of this line in the hero role list; keys the resumable phase. */
  slot: number;
  as?: 'p' | 'span' | 'div';
  className?: string;
}

type Phase = 'typing' | 'erasing';

/**
 * The hero role line (docs/DESIGN.md §3). One role types out and stays; a list
 * cycles: each role is typed with a human keystroke rhythm, holds, is
 * backspaced away and replaced by the next one, on a loop.
 *
 * The first paint is the complete line, so server output, hydration and
 * visitors who ask for reduced motion all get static markup; only the typed
 * reveal runs as an effect, and it never starts while motion is reduced. When
 * the line cycles, the roles after the animated one stay in the document
 * (hidden by `.hero-role-rest`, revealed again by the reduced-motion rule in
 * globals.css), so a motionless visitor still reads the stacked list.
 *
 * The reveal phase lives in the document-scoped hero session: a locale switch
 * remounts this line with the other locale's text and resumes at the same role
 * and character instead of restarting.
 */
export function RoleTypewriter({
  roles,
  slot,
  as = 'p',
  className,
}: RoleTypewriterProps) {
  const cycles = roles.length > 1;
  const lines = useMemo(
    () =>
      roles.map((role) => {
        const runs = parseTypewriterRuns(role);
        return {
          runs,
          text: runs.map((run) => run.text).join(''),
          length: typewriterLength(runs),
        };
      }),
    [roles]
  );
  const sharedWords = useMemo(() => sharedTypewriterWords(roles), [roles]);
  const rolesKey = roles.join('\u0000');

  const [active, setActive] = useState(0);
  const [revealed, setRevealed] = useState(lines[0]?.length ?? 0);
  const [cursorVisible, setCursorVisible] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (roles.length === 0 || window.matchMedia(reducedMotionQuery).matches) {
      setActive(0);
      setRevealed(lines[0]?.length ?? 0);
      setCursorVisible(false);
      return;
    }

    const line = (index: number) => {
      const runs = parseTypewriterRuns(roles[index]);
      return {
        runs,
        text: runs.map((run) => run.text).join(''),
        shared: sharedWords[index] ?? [],
      };
    };

    const resume = typewriterPhases.get(slot) ?? null;
    let index = resume ? Math.min(resume.index, roles.length - 1) : 0;
    let current = line(index);
    let typed = Math.min(resume?.typed ?? 0, current.text.length);
    let phase: Phase = cycles && resume?.erasing ? 'erasing' : 'typing';

    // A line that already finished in this document stays finished: full text,
    // no cursor, no timers.
    if (!cycles && typed >= current.text.length) {
      setActive(index);
      setRevealed(current.text.length);
      setCursorVisible(false);
      return;
    }

    const persist = () =>
      typewriterPhases.set(slot, {
        index,
        typed,
        erasing: phase === 'erasing',
      });
    const pacer = createKeystrokePacer();

    setActive(index);
    setRevealed(typed);
    setCursorVisible(true);
    persist();

    const tick = () => {
      if (phase === 'erasing') {
        if (typed > 0) {
          typed = typewriterStep(typed, -1, current.text.length, current.shared);
          setRevealed(typed);
          persist();
          timer.current = window.setTimeout(tick, pacer.backspaceDelay());
          return;
        }
        // Erased: the next role starts after a breath.
        index = (index + 1) % roles.length;
        current = line(index);
        typed = 0;
        phase = 'typing';
        setActive(index);
        setRevealed(0);
        persist();
        timer.current = window.setTimeout(tick, pacer.nextRoleDelay());
        return;
      }
      // A completed single role may acquire companions without remounting.
      if (typed >= current.text.length && cycles) {
        phase = 'erasing';
        persist();
        timer.current = window.setTimeout(
          tick,
          typewriterHoldMs + pacer.backspaceReachDelay()
        );
        return;
      }

      if (typed < current.text.length) {
        const char = current.text[typed];
        typed = typewriterStep(typed, 1, current.text.length, current.shared);
        setRevealed(typed);
        persist();

        if (typed === current.text.length) {
          if (!cycles) {
            // Done: the cursor goes with the animation, the line stays.
            setCursorVisible(false);
            return;
          }
          // A finished role holds, then the hand reaches back for the key.
          phase = 'erasing';
          persist();
          timer.current = window.setTimeout(
            tick,
            typewriterHoldMs + pacer.backspaceReachDelay()
          );
          return;
        }
        timer.current = window.setTimeout(tick, pacer.typingDelay(char));
      }
    };

    timer.current = window.setTimeout(
      tick,
      resume ? pacer.typingDelay('') : typewriterStartMs
    );

    return () => {
      clearTimeout(timer.current);
      persist();
    };
  }, [slot, cycles, rolesKey, roles, lines, sharedWords]);

  const line = lines[Math.min(active, lines.length - 1)];

  return (
    <>
      <InnerHtml
        as={as}
        className={className}
        html={
          line
            ? typewriterHtml(
                line.runs,
                revealed,
                cursorVisible ? 'typewriter-cursor' : undefined,
                sharedWords[active]
              )
            : ''
        }
      />
      {cycles &&
        lines
          .slice(1)
          .map((rest, offset) => (
            <InnerHtml
              as={as}
              className={`${className ?? ''} hero-role-rest`.trim()}
              html={typewriterHtml(rest.runs, rest.length)}
              key={roles[offset + 1]}
            />
          ))}
    </>
  );
}
