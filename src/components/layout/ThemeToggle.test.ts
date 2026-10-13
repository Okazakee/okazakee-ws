// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement, Profiler } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

import ThemeToggle from './ThemeToggle';
import useThemeStore from '@/store/themeStore';

const roots: Root[] = [];
const commits: string[] = [];

function onRender(id: string) {
  commits.push(id);
}

async function renderToggle() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      createElement(
        Profiler,
        { id: 'toggle', onRender },
        createElement(ThemeToggle, { ariaLabel: 'toggle' })
      )
    );
  });
  return { container, root };
}

afterEach(async () => {
  await act(async () => {
    for (const root of roots.splice(0)) root.unmount();
  });
  document.body.innerHTML = '';
  commits.length = 0;
  useThemeStore.setState({ mode: 'auto', isDark: false });
});

describe('ThemeToggle store subscription', () => {
  it('does not rerender when unrelated theme state changes', async () => {
    await renderToggle();
    const baseline = commits.length;
    expect(baseline).toBeGreaterThan(0);

    // System flip in auto mode: isDark changes, mode does not. The
    // toggle renders the mode icon only.
    await act(async () => {
      useThemeStore.setState({ isDark: true });
    });

    expect(commits.length).toBe(baseline);
  });

  it('rerenders when the rendered mode changes', async () => {
    const { container } = await renderToggle();
    const baseline = commits.length;

    await act(async () => {
      useThemeStore.getState().setThemeMode('dark');
    });

    expect(commits.length).toBeGreaterThan(baseline);
    expect(container.innerHTML).not.toBe('');
  });
});
