// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, createElement, StrictMode, useRef } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

import { useGlitch } from '@/libs/glitch/useGlitch';

const roots: Root[] = [];

function Probe({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useGlitch(ref, {
    mode: 'both',
    trigger: 'self',
    probability: 1,
    active,
  });
  return createElement(
    'div',
    { ref },
    createElement('span', null, 'tile')
  );
}

function clones(container: HTMLElement): number {
  return container.querySelectorAll('[data-glitch-layer]').length;
}

async function renderProbe(active: boolean, strict: boolean) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  const probe = createElement(Probe, { active });
  await act(async () => {
    root.render(
      strict ? createElement(StrictMode, null, probe) : probe
    );
  });
  return { container, root };
}

// Stub WAAPI before any render: the hook only needs animate/getAnimations
// to exist for clone bookkeeping.
Object.defineProperty(Element.prototype, 'animate', {
  configurable: true,
  value: vi.fn().mockReturnValue({ cancel: () => {} }),
});
Object.defineProperty(Element.prototype, 'getAnimations', {
  configurable: true,
  value: () => [],
});

afterEach(async () => {
  await act(async () => {
    for (const root of roots.splice(0)) root.unmount();
  });
  document.body.innerHTML = '';
});

describe('useGlitch mount contract', () => {
  it('never bursts on initial mount when already active', async () => {
    const { container } = await renderProbe(true, false);

    expect(clones(container)).toBe(0);
  });

  it('never bursts on StrictMode remount when already active', async () => {
    const { container } = await renderProbe(true, true);

    expect(clones(container)).toBe(0);
  });

  it('still bursts on a genuine inactive-to-active change', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push(root);
    await act(async () => {
      root.render(createElement(Probe, { active: false }));
    });
    expect(clones(container)).toBe(0);

    await act(async () => {
      root.render(createElement(Probe, { active: true }));
    });
    expect(clones(container)).toBeGreaterThan(0);
  });

  it('bursts again after true → false → true', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push(root);
    await act(async () => {
      root.render(createElement(Probe, { active: true }));
    });
    expect(clones(container)).toBe(0);

    await act(async () => {
      root.render(createElement(Probe, { active: false }));
    });
    await act(async () => {
      root.render(createElement(Probe, { active: true }));
    });
    expect(clones(container)).toBeGreaterThan(0);
  });
});
