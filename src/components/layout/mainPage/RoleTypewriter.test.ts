// @vitest-environment happy-dom
import { act, createElement, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { typewriterPhases } from '@/components/layout/mainPage/heroAnimationState';
import { RoleTypewriter } from '@/components/layout/mainPage/RoleTypewriter';
import { formatLabels } from '@/utils/formatLabels';
import {
  createKeystrokePacer,
  typewriterStartMs,
} from '@/utils/typewriterPacing';

const role = 'Fullstack ****Developer****';
const nextRole = 'Problem ****Solver****';

let container: HTMLDivElement;
let root: Root;

function setReducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

async function render(element: ReactElement) {
  await act(async () => root.render(element));
}

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

/** Advances in slices until `done` holds, so no test hardcodes a delay. */
async function advanceUntil(done: () => boolean, limitMs = 30_000) {
  for (let elapsed = 0; elapsed < limitMs; elapsed += 20) {
    if (done()) return elapsed;
    await advance(20);
  }
  return done() ? limitMs : -1;
}

/** The animated line: the roles it is not cycling through are hidden siblings. */
const live = () => container.querySelector('p')?.textContent ?? '';

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers();
  typewriterPhases.clear();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('RoleTypewriter', () => {
  it('serves a single role finished, so server output and hydration are complete', () => {
    expect(
      renderToStaticMarkup(
        createElement(RoleTypewriter, { roles: [role], slot: 0 })
      )
    ).toBe(`<p>${formatLabels(role)}</p>`);
  });

  it('keeps the roles it is not cycling through in the document', () => {
    expect(
      renderToStaticMarkup(
        createElement(RoleTypewriter, { roles: [role, nextRole], slot: 0 })
      )
    ).toBe(
      `<p>${formatLabels(role)}</p>` +
        `<p class="hero-role-rest">${formatLabels(nextRole)}</p>`
    );
  });

  it('stays static for the whole session under reduced motion', async () => {
    setReducedMotion(true);
    await render(
      createElement(RoleTypewriter, {
        roles: ['Developer', 'Analyst'],
        slot: 1,
      })
    );

    await advance(60_000);

    expect(live()).toBe('Developer');
    expect(
      [...container.querySelectorAll('p')].map((el) => el.textContent)
    ).toEqual(['Developer', 'Analyst']);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('types a single role once with the paced rhythm, then settles', async () => {
    setReducedMotion(false);
    const text = 'Developer';
    await render(createElement(RoleTypewriter, { roles: [text], slot: 2 }));

    await advance(typewriterStartMs);
    expect(live()).toBe('D');
    expect(container.innerHTML).toContain('typewriter-cursor');

    // Replay the pacer the component draws from: the reveal is deterministic,
    // so each advance lands exactly on the next keystroke.
    const pacer = createKeystrokePacer();
    for (let index = 0; index < text.length - 1; index += 1) {
      await advance(pacer.typingDelay(text[index]));
      expect(live()).toBe(text.slice(0, index + 2));
    }

    expect(live()).toBe(text);
    expect(container.innerHTML).not.toContain('typewriter-cursor');
    expect(vi.getTimerCount()).toBe(0);
  });
  it('keeps words shared by roles visible while typing only unique words', async () => {
    setReducedMotion(false);
    await render(
      createElement(RoleTypewriter, {
        roles: ['Fullstack Developer', 'Mobile Developer'],
        slot: 5,
      })
    );

    await advance(typewriterStartMs);
    expect(live()).toBe('F Developer');

    expect(
      await advanceUntil(() => live() === 'Fullstack Developer')
    ).toBeGreaterThan(0);
    expect(await advanceUntil(() => live() === 'Mobile Developer')).toBeGreaterThan(0);
  });

  it('types, holds four seconds, backspaces away and types the next role', async () => {
    setReducedMotion(false);
    await render(
      createElement(RoleTypewriter, {
        roles: ['Developer', 'Analyst'],
        slot: 3,
      })
    );

    expect(await advanceUntil(() => live() === 'Developer')).toBeGreaterThan(0);
    expect(container.innerHTML).toContain('typewriter-cursor');

    // The finished role is held, then the hand reaches back for the key.
    let heldFor = 0;
    while (live() === 'Developer' && heldFor < 8000) {
      await advance(20);
      heldFor += 20;
    }
    expect(heldFor).toBeGreaterThanOrEqual(4000);
    expect(heldFor).toBeLessThanOrEqual(4000 + 240 + 40);
    expect('Developer'.startsWith(live())).toBe(true);
    expect(live().length).toBeLessThan('Developer'.length);

    // Backspaced all the way out, then the next role types in its place.
    expect(await advanceUntil(() => live() === '')).toBeGreaterThanOrEqual(0);
    expect(await advanceUntil(() => live() === 'Analyst')).toBeGreaterThan(0);
    expect(container.innerHTML).toContain('typewriter-cursor');

    // …and the cycle keeps going.
    expect(
      await advanceUntil(() => live() === 'Developer', 60_000)
    ).toBeGreaterThan(0);
  });

  it('starts cycling when a completed single role gains companions', async () => {
    setReducedMotion(false);
    await render(
      createElement(RoleTypewriter, { roles: ['Developer'], slot: 0 })
    );
    await advanceUntil(() => live() === 'Developer');
    await render(
      createElement(RoleTypewriter, {
        roles: ['Developer', 'Analyst'],
        slot: 0,
      })
    );
    expect(await advanceUntil(() => live() === 'Analyst')).toBeGreaterThan(0);
    expect(container.innerHTML).toContain('typewriter-cursor');
  });

  it('finishes and stops when a cycling list becomes a single role', async () => {
    setReducedMotion(false);
    await render(
      createElement(RoleTypewriter, {
        roles: ['Developer', 'Analyst'],
        slot: 0,
      })
    );
    await advanceUntil(() => live() === 'Developer');
    await advanceUntil(() => live().length < 'Developer'.length);
    await render(
      createElement(RoleTypewriter, { roles: ['Developer'], slot: 0 })
    );
    await advanceUntil(() => live() === 'Developer');
    expect(container.innerHTML).not.toContain('typewriter-cursor');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops its timer on unmount', async () => {
    setReducedMotion(false);
    await render(
      createElement(RoleTypewriter, { roles: ['Developer'], slot: 4 })
    );

    await advance(typewriterStartMs + 120);
    await act(async () => root.unmount());

    expect(vi.getTimerCount()).toBe(0);
  });
});
