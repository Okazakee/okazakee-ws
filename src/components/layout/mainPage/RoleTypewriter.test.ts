// @vitest-environment happy-dom
import { act, createElement, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { typewriterPhases } from '@/components/layout/mainPage/heroAnimationState';
import { RoleTypewriter } from '@/components/layout/mainPage/RoleTypewriter';
import { formatLabels } from '@/utils/formatLabels';
import { typewriterStartMs } from '@/utils/typewriterPacing';

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

/** Read visible text on either side of the cursor, including nested labels. */
function cursorText() {
  const line = container.querySelector('p');
  const cursor = line?.querySelector('.typewriter-cursor');
  expect(line).not.toBeNull();
  expect(cursor).not.toBeNull();
  const before = document.createRange();
  before.selectNodeContents(line!);
  before.setEndBefore(cursor!);
  const after = document.createRange();
  after.selectNodeContents(line!);
  after.setStartAfter(cursor!);
  return { before: before.toString(), after: after.toString() };
}

const labels = () =>
  [...container.querySelectorAll('p:first-child label')]
    .map((label) => label.textContent)
    .filter(Boolean);

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

  it('types a single role at a constant speed, then settles', async () => {
    setReducedMotion(false);
    const text = 'Developer';
    await render(createElement(RoleTypewriter, { roles: [text], slot: 2 }));

    await advance(typewriterStartMs);
    expect(live()).toBe('D');
    expect(container.innerHTML).toContain('typewriter-cursor');

    for (let index = 0; index < text.length - 1; index += 1) {
      await advance(80);
      expect(live()).toBe(text.slice(0, index + 2));
    }

    expect(live()).toBe(text);
    expect(container.innerHTML).not.toContain('typewriter-cursor');
    expect(vi.getTimerCount()).toBe(0);
  });
  it('keeps the English shared suffix after the cursor through erasure and typing', async () => {
    setReducedMotion(false);
    const slot = 5;
    await render(
      createElement(RoleTypewriter, {
        roles: ['Full-stack ****Developer****', 'Mobile ****Developer****'],
        slot,
      })
    );

    const expectBoundary = (changing: string) => {
      const text = cursorText();
      expect(text.before).toBe(changing);
      expect(text.after.trimStart()).toBe('Developer');
      expect(labels()).toEqual(['Developer']);
    };
    expect(live()).toBe(' Developer');
    expectBoundary('');
    expect(await advanceUntil(() => live() === 'F Developer')).toBeGreaterThan(
      0
    );
    expectBoundary('F');
    expect(
      await advanceUntil(() => live() === 'Full-stack Developer')
    ).toBeGreaterThan(0);
    expect(labels()).toEqual(['Developer']);

    expect(
      await advanceUntil(() => {
        const phase = typewriterPhases.get(slot);
        return phase?.index === 0 && phase.erasing && phase.typed === 0;
      })
    ).toBeGreaterThan(0);
    expect(live()).toBe(' Developer');
    expectBoundary('');
    expect(
      await advanceUntil(() => {
        const phase = typewriterPhases.get(slot);
        return phase?.index === 1 && !phase.erasing && phase.typed === 0;
      })
    ).toBeGreaterThan(0);
    expect(live()).toBe(' Developer');
    expectBoundary('');
    expect(await advanceUntil(() => live() === 'Mo Developer')).toBeGreaterThan(
      0
    );
    expectBoundary('Mo');
    expect(
      await advanceUntil(() => live() === 'Mobile Developer')
    ).toBeGreaterThan(0);
    expect(labels()).toEqual(['Developer']);
  });

  it('keeps the Italian shared prefix before the cursor throughout both role transitions', async () => {
    setReducedMotion(false);
    const slot = 6;
    await render(
      createElement(RoleTypewriter, {
        roles: [
          'Sviluppatore ****Full-stack****',
          'Sviluppatore ****Mobile****',
        ],
        slot,
      })
    );

    const expectBoundary = (changing: string) => {
      const text = cursorText();
      expect(text.before.trimEnd()).toBe(
        changing ? `Sviluppatore ${changing}` : 'Sviluppatore'
      );
      expect(text.after).toBe('');
      expect(labels()).toEqual(changing ? [changing] : []);
    };
    const until = async (done: () => boolean) => {
      expect(
        await advanceUntil(() => {
          expect(live().startsWith('Sviluppatore')).toBe(true);
          return done();
        })
      ).toBeGreaterThan(0);
    };
    const atBoundary = (index: number, erasing: boolean) => {
      const phase = typewriterPhases.get(slot);
      return (
        phase?.index === index && phase.erasing === erasing && phase.typed === 0
      );
    };

    expect(live().trimEnd()).toBe('Sviluppatore');
    expectBoundary('');
    await until(() => live() === 'Sviluppatore F');
    expectBoundary('F');
    await until(() => live() === 'Sviluppatore Full-stack');
    expect(labels()).toEqual(['Full-stack']);
    expect(container.querySelector('p .typewriter-cursor')).toBeNull();

    await until(() => atBoundary(0, true));
    expectBoundary('');
    await until(() => atBoundary(1, false));
    expectBoundary('');
    await until(() => live() === 'Sviluppatore Mo');
    expectBoundary('Mo');
    await until(() => live() === 'Sviluppatore Mobile');
    expect(labels()).toEqual(['Mobile']);
    expect(container.querySelector('p .typewriter-cursor')).toBeNull();

    await until(() => atBoundary(1, true));
    expectBoundary('');
    await until(() => atBoundary(0, false));
    expectBoundary('');
    await until(() => live() === 'Sviluppatore Fu');
    expectBoundary('Fu');
    await until(() => live() === 'Sviluppatore Full-stack');
    expect(labels()).toEqual(['Full-stack']);
  });

  it('resumes a locale remount inside the Italian shared prefix without moving the cursor before it', async () => {
    setReducedMotion(false);
    const slot = 7;
    await render(
      createElement(RoleTypewriter, {
        key: 'en',
        roles: ['Full-stack ****Developer****', 'Mobile ****Developer****'],
        slot,
      })
    );
    expect(
      await advanceUntil(() => live() === 'Full- Developer')
    ).toBeGreaterThan(0);
    const saved = { ...typewriterPhases.get(slot)! };
    expect(saved.typed).toBeGreaterThan(0);
    expect(saved.typed).toBeLessThan('Sviluppatore'.length);

    await render(
      createElement(RoleTypewriter, {
        key: 'it',
        roles: [
          'Sviluppatore ****Full-stack****',
          'Sviluppatore ****Mobile****',
        ],
        slot,
      })
    );
    expect(typewriterPhases.get(slot)).toEqual(saved);
    expect(live().trimEnd()).toBe('Sviluppatore');
    expect(cursorText()).toEqual({ before: 'Sviluppatore', after: '' });
    expect(labels()).toEqual([]);

    expect(
      await advanceUntil(() => {
        expect(live().startsWith('Sviluppatore')).toBe(true);
        return live() === 'Sviluppatore F';
      })
    ).toBeGreaterThan(0);
    expect(cursorText()).toEqual({ before: 'Sviluppatore F', after: '' });
    expect(labels()).toEqual(['F']);
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
    expect(container.innerHTML).not.toContain('typewriter-cursor');

    // The finished role is held, then the hand reaches back for the key.
    let heldFor = 0;
    while (live() === 'Developer' && heldFor < 8000) {
      await advance(20);
      heldFor += 20;
    }
    expect(heldFor).toBeGreaterThanOrEqual(4000);
    expect(heldFor).toBeLessThanOrEqual(4040);
    expect('Developer'.startsWith(live())).toBe(true);
    expect(live().length).toBeLessThan('Developer'.length);

    // The cursor returns when the next role begins, then leaves after it types.
    expect(await advanceUntil(() => live() === '')).toBeGreaterThanOrEqual(0);
    await advance(40);
    expect(container.innerHTML).toContain('typewriter-cursor');
    expect(await advanceUntil(() => live() === 'Analyst')).toBeGreaterThan(0);
    expect(container.innerHTML).not.toContain('typewriter-cursor');

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
    expect(container.innerHTML).not.toContain('typewriter-cursor');
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
