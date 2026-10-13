// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement, useEffect } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

import { useZoom } from './useZoom';

type ZoomApi = ReturnType<typeof useZoom>;

const roots: Root[] = [];
let latest: ZoomApi | null = null;

function Probe() {
  const api = useZoom();
  useEffect(() => {
    latest = api;
  }, [api]);
  return createElement('span', null, String(api.scale));
}

async function renderProbe(): Promise<HTMLElement> {
  latest = null;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(createElement(Probe));
  });
  if (!latest) throw new Error('hook api not captured');
  return container;
}

afterEach(async () => {
  await act(async () => {
    for (const root of roots.splice(0)) root.unmount();
  });
  document.body.innerHTML = '';
});

describe('useZoom zoom step', () => {
  it('zooms in on negative deltas, capped at 3x', async () => {
    const container = await renderProbe();
    await act(async () => {
      latest?.zoomBy(-500);
    });
    expect(container.textContent).toBe('3');
  });

  it('zooms out on positive deltas, floored at 1x', async () => {
    const container = await renderProbe();
    await act(async () => {
      latest?.zoomBy(-100);
    });
    expect(container.textContent).toBe('2');
    await act(async () => {
      latest?.zoomBy(100000);
    });
    expect(container.textContent).toBe('1');
  });

  it('keeps a stable zoom callback identity', async () => {
    await renderProbe();
    const first = latest?.zoomBy;
    await act(async () => {
      latest?.zoomBy(-10);
    });
    expect(latest?.zoomBy).toBe(first);
  });
});
