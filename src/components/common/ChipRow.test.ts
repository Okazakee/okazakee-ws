// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const h = vi.hoisted(() => ({
  observers: [] as Array<{
    callback: ResizeObserverCallback;
    targets: Element[];
  }>,
}));

class FakeResizeObserver {
  private entry: {
    callback: ResizeObserverCallback;
    targets: Element[];
  };

  constructor(callback: ResizeObserverCallback) {
    this.entry = { callback, targets: [] };
    h.observers.push(this.entry);
  }
  observe = (target: Element) => {
    this.entry.targets.push(target);
  };
  unobserve = () => {};
  disconnect = () => {};
}

vi.stubGlobal('ResizeObserver', FakeResizeObserver);

import { ChipRow } from './ChipRow';

const roots: Root[] = [];

// Scripted layout: the track reports `trackWidth`, the viewport 300px.
const dims = { trackWidth: 0 };

function nodes(container: HTMLElement) {
  const viewport = container.querySelector(
    '.tags-viewport'
  ) as HTMLElement | null;
  if (!viewport) throw new Error('viewport missing');
  const track = viewport.firstElementChild as HTMLElement | null;
  if (!track) throw new Error('track missing');
  Object.defineProperty(track, 'scrollWidth', {
    configurable: true,
    get: () => dims.trackWidth,
  });
  Object.defineProperty(viewport, 'clientWidth', {
    configurable: true,
    get: () => 300,
  });
  return { viewport, track };
}

function chips(count: number) {
  return Array.from({ length: count }, (_, index) =>
    createElement('span', { key: index }, `chip-${index}`)
  );
}

async function renderRow(count: number) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    // biome-ignore lint/correctness/noChildrenProp: children-as-prop keeps TS props inference in .ts tests.
    root.render(createElement(ChipRow, { children: chips(count) }));
  });
  return { container, root };
}

async function rerenderRow(root: Root, count: number) {
  await act(async () => {
    // biome-ignore lint/correctness/noChildrenProp: children-as-prop keeps TS props inference in .ts tests.
    root.render(createElement(ChipRow, { children: chips(count) }));
  });
}

// Fires only observers watching `target`, like a real ResizeObserver.
async function fireFor(target: Element) {
  await act(async () => {
    for (const observer of h.observers) {
      if (observer.targets.includes(target)) {
        observer.callback([], null as unknown as ResizeObserver);
      }
    }
  });
}

function isLooping(container: HTMLElement): boolean {
  return (
    container.querySelector('.tags-viewport > div')?.classList.contains(
      'animate-tags'
    ) ?? false
  );
}

function durationOf(container: HTMLElement): string {
  const track = container.querySelector(
    '.tags-viewport > div'
  ) as HTMLElement | null;
  return track?.style.getPropertyValue('--tags-duration') ?? '';
}

beforeEach(() => {
  h.observers = [];
  dims.trackWidth = 0;
});

afterEach(async () => {
  await act(async () => {
    for (const root of roots.splice(0)) root.unmount();
  });
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
});

describe('ChipRow measurement lifecycle', () => {
  it('starts looping when children grow past the viewport', async () => {
    dims.trackWidth = 100;
    const { container, root } = await renderRow(2);
    const { viewport } = nodes(container);
    await fireFor(viewport);
    expect(isLooping(container)).toBe(false);

    // Twelve chips overflow the 300px viewport; no viewport resize
    // happens, so only a children-aware component remeasures.
    dims.trackWidth = 12 * 60 + 6;
    await rerenderRow(root, 12);
    expect(isLooping(container)).toBe(true);
  });

  it('stops looping when children shrink back to fit', async () => {
    dims.trackWidth = 12 * 60 + 6;
    const { container, root } = await renderRow(12);
    const { viewport } = nodes(container);
    await fireFor(viewport);
    expect(isLooping(container)).toBe(true);

    dims.trackWidth = 100;
    await rerenderRow(root, 2);
    expect(isLooping(container)).toBe(false);
  });

  it('observes the track so content changes recalculate', async () => {
    dims.trackWidth = 100;
    const { container } = await renderRow(2);
    const { track } = nodes(container);

    expect(
      h.observers.some((observer) => observer.targets.includes(track))
    ).toBe(true);
  });

  it('recalculates duration when content width changes', async () => {
    dims.trackWidth = 12 * 60 + 6;
    const { container } = await renderRow(12);
    const { track, viewport } = nodes(container);
    await fireFor(viewport);
    const first = durationOf(container);
    expect(first).not.toBe('');

    dims.trackWidth = 20 * 60 + 6;
    await fireFor(track);
    const second = durationOf(container);
    expect(second).not.toBe('');
    expect(second).not.toBe(first);
  });
});
