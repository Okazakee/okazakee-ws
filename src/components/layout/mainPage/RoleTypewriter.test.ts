// @vitest-environment happy-dom
import { act, createElement, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleTypewriter } from '@/components/layout/mainPage/RoleTypewriter';
import { formatLabels } from '@/utils/formatLabels';

const role = 'Fullstack ****Developer****';

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

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers();
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
  it('serves the finished line, so server output and hydration are complete', () => {
    expect(
      renderToStaticMarkup(createElement(RoleTypewriter, { text: role }))
    ).toBe(`<p>${formatLabels(role)}</p>`);
  });

  it('stays static for the whole session under reduced motion', async () => {
    setReducedMotion(true);
    await render(createElement(RoleTypewriter, { text: role }));

    await advance(60_000);

    expect(container.textContent).toBe('Fullstack Developer');
    expect(container.innerHTML).toBe(`<p>${formatLabels(role)}</p>`);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('types, holds and erases the line when motion is allowed', async () => {
    setReducedMotion(false);
    await render(createElement(RoleTypewriter, { text: 'Developer' }));

    await advance(400);
    expect(container.textContent).toBe('D');

    await advance(55 * 2);
    expect(container.textContent).toBe('Dev');

    await advance(55 * 6);
    expect(container.textContent).toBe('Developer');
    await advance(1600);
    expect(container.textContent).toBe('Developer');

    await advance(28 * 8);
    expect(container.textContent?.length).toBeLessThan(9);
    expect('Developer'.startsWith(container.textContent ?? '')).toBe(true);
  });

  it('stops its timer on unmount', async () => {
    setReducedMotion(false);
    await render(createElement(RoleTypewriter, { text: 'Developer' }));

    await advance(400 + 55 * 2);
    await act(async () => root.unmount());

    expect(vi.getTimerCount()).toBe(0);
    await advance(10_000);
  });
});
