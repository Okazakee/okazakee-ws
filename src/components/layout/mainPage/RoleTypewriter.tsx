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
import { typewriterHoldMs, typewriterStartMs } from '@/utils/typewriterPacing';
import { typewriterPhases } from './heroAnimationState';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
const typewriterCharacterMs = 80;
const typewriterBackspaceMs = 40;
const typewriterNextRoleMs = 320;


interface RoleTypewriterProps {
  /** The roles this line carries. */
  roles: string[];
  /** Key of this line in the hero role list; keys the resumable phase. */
  slot: number;
  as?: 'p' | 'span' | 'div';
  className?: string;
}

type Phase = 'typing' | 'holding' | 'erasing';

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

  // Latest derived data for the animation effect below. The effect
  // subscribes to the semantic key (`rolesKey`) rather than these fresh
  // identities, so an identical-content rerender never restarts it; the
  // mirror always hands it the newest values when the key does change.
  const live = useRef({ roles, lines, sharedWords });
  live.current = { roles, lines, sharedWords };

  const [active, setActive] = useState(0);
  const [revealed, setRevealed] = useState(lines[0]?.length ?? 0);
  const [cursorVisible, setCursorVisible] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    const { roles: currentRoles, lines: currentLines } = live.current;
    if (
      currentRoles.length === 0 ||
      window.matchMedia(reducedMotionQuery).matches
    ) {
      setActive(0);
      setRevealed(currentLines[0]?.length ?? 0);
      setCursorVisible(false);
      return;
    }

    const line = (index: number) => {
      const runs = parseTypewriterRuns(currentRoles[index]);
      return {
        runs,
        text: runs.map((run) => run.text).join(''),
        shared: live.current.sharedWords[index] ?? [],
      };
    };

    const resume = typewriterPhases.get(slot) ?? null;
    let index = Math.min(resume?.index ?? 0, currentRoles.length - 1);
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

    setActive(index);
    setRevealed(typed);
    setCursorVisible(true);
    persist();

    const tick = () => {
      if (phase === 'holding') {
        phase = 'erasing';
        setCursorVisible(true);
        timer.current = window.setTimeout(tick, 0);
        return;
      }

      if (phase === 'erasing') {
        if (typed > 0) {
          typed = typewriterStep(typed, -1, current.text.length, current.shared);
          setRevealed(typed);
          persist();
          timer.current = window.setTimeout(tick, typewriterBackspaceMs);
          return;
        }
        // Erased: the next role starts after a breath.
        index = (index + 1) % currentRoles.length;
        current = line(index);
        typed = 0;
        phase = 'typing';
        setActive(index);
        setRevealed(0);
        persist();
        setCursorVisible(true);
        timer.current = window.setTimeout(tick, typewriterNextRoleMs);
        return;
      }
      // A completed single role may acquire companions without remounting.
      if (typed >= current.text.length && cycles) {
        phase = 'holding';
        setCursorVisible(false);
        persist();
        timer.current = window.setTimeout(tick, typewriterHoldMs);
        return;
      }

      if (typed < current.text.length) {
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
          phase = 'holding';
          persist();
          setCursorVisible(false);
          timer.current = window.setTimeout(tick, typewriterHoldMs);
          return;
        }
        timer.current = window.setTimeout(tick, typewriterCharacterMs);
      }
    };

    timer.current = window.setTimeout(
      tick,
      resume ? typewriterCharacterMs : typewriterStartMs
    );

    return () => {
      clearTimeout(timer.current);
      persist();
    };
  }, [slot, cycles, rolesKey]);

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
      {roles.length > 1 &&
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
