// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement, StrictMode } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const h = vi.hoisted(() => ({
  incrementViews: vi.fn(),
  getCurrentViews: vi.fn(),
}));

vi.mock('@/app/actions/getCurrentViews', () => ({
  getCurrentViews: h.getCurrentViews,
}));
vi.mock('@/app/actions/incrementViews', () => ({
  incrementViews: h.incrementViews,
}));

import ViewDisplay from './ViewDisplay';

const roots: Root[] = [];

async function renderDisplay(
  postId = '9',
  postType: 'blog' | 'portfolio' = 'blog',
  strict = false
) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  const badge = createElement(ViewDisplay, { postId, postType });
  const element = strict
    ? createElement(StrictMode, null, badge)
    : badge;
  await act(async () => {
    root.render(element);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return container;
}

afterEach(async () => {
  await act(async () => {
    for (const root of roots.splice(0)) root.unmount();
  });
  document.body.innerHTML = '';
});

beforeEach(() => {
  localStorage.clear();
  h.incrementViews.mockReset();
  h.getCurrentViews.mockReset();
  h.incrementViews.mockResolvedValue({ success: true, views: 42 });
  h.getCurrentViews.mockResolvedValue({ success: true, views: 41 });
});

describe('ViewDisplay', () => {
  it('increments exactly once on the first eligible view and shows the authoritative count', async () => {
    const container = await renderDisplay();

    expect(h.incrementViews).toHaveBeenCalledTimes(1);
    expect(h.incrementViews).toHaveBeenCalledWith('9', 'blog');
    expect(container.textContent).toContain('42');
    expect(localStorage.getItem('viewed_blog_9')).not.toBeNull();
  });

  it('does not increment on repeat views within 24h but refreshes the count', async () => {
    localStorage.setItem('viewed_blog_9', Date.now().toString());

    const container = await renderDisplay();

    expect(h.incrementViews).not.toHaveBeenCalled();
    expect(h.getCurrentViews).toHaveBeenCalledTimes(1);
    expect(h.getCurrentViews).toHaveBeenCalledWith('9', 'blog');
    expect(container.textContent).toContain('41');
  });

  it('cannot duplicate the increment when effects rerun', async () => {
    await renderDisplay('9', 'blog', true);

    expect(h.incrementViews).toHaveBeenCalledTimes(1);
  });

  it('falls back to a read when the increment returns no count', async () => {
    h.incrementViews.mockResolvedValue({ success: true });

    const container = await renderDisplay();

    expect(h.incrementViews).toHaveBeenCalledTimes(1);
    expect(h.getCurrentViews).toHaveBeenCalledWith('9', 'blog');
    expect(container.textContent).toContain('41');
  });

  it('degrades to the placeholder when the increment fails', async () => {
    h.incrementViews.mockResolvedValue({
      success: false,
      error: 'unavailable',
    });

    const container = await renderDisplay();

    expect(container.textContent).toContain('—');
    expect(localStorage.getItem('viewed_blog_9')).toBeNull();
  });

  it('never calls the metric path for non-numeric ids', async () => {
    const container = await renderDisplay('preview-1');

    expect(h.incrementViews).not.toHaveBeenCalled();
    expect(h.getCurrentViews).not.toHaveBeenCalled();
    expect(container.textContent).toContain('—');
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function mountDisplay(
  postId: string,
  postType: 'blog' | 'portfolio'
) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(createElement(ViewDisplay, { postId, postType }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return { container, root };
}

async function navigate(
  root: Root,
  postId: string,
  postType: 'blog' | 'portfolio'
) {
  await act(async () => {
    root.render(createElement(ViewDisplay, { postId, postType }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('ViewDisplay client navigation', () => {
  it('runs B’s flow on A → B and never shows A’s count as B’s', async () => {
    const { container, root } = await mountDisplay('9', 'blog');
    expect(container.textContent).toContain('42');

    h.incrementViews.mockResolvedValue({ success: true, views: 77 });
    await navigate(root, '10', 'blog');

    expect(h.incrementViews).toHaveBeenCalledWith('10', 'blog');
    expect(container.textContent).toContain('77');
    expect(container.textContent).not.toContain('42');
  });

  it('respects the 24h marker on A → B → A without double counting', async () => {
    const { container, root } = await mountDisplay('9', 'blog');
    expect(h.incrementViews).toHaveBeenCalledTimes(1);

    h.incrementViews.mockResolvedValue({ success: true, views: 77 });
    await navigate(root, '10', 'blog');
    expect(h.incrementViews).toHaveBeenCalledTimes(2);

    h.getCurrentViews.mockResolvedValue({ success: true, views: 43 });
    await navigate(root, '9', 'blog');
    expect(h.incrementViews).toHaveBeenCalledTimes(2);
    expect(h.getCurrentViews).toHaveBeenCalledWith('9', 'blog');
    expect(container.textContent).toContain('43');
  });

  it('never lets a stale A response overwrite B', async () => {
    const pendingA = deferred<{ success: true; views: number }>();
    h.incrementViews.mockReturnValueOnce(pendingA.promise);
    const { container, root } = await mountDisplay('9', 'blog');
    expect(container.textContent).toContain('—');

    h.incrementViews.mockResolvedValue({ success: true, views: 77 });
    await navigate(root, '10', 'blog');
    expect(container.textContent).toContain('77');

    await act(async () => {
      pendingA.resolve({ success: true, views: 42 });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(container.textContent).toContain('77');
    expect(container.textContent).not.toContain('42');
  });

  it('keeps blog and portfolio identities distinct', async () => {
    const { root } = await mountDisplay('9', 'blog');
    expect(h.incrementViews).toHaveBeenCalledWith('9', 'blog');

    await navigate(root, '9', 'portfolio');
    expect(h.incrementViews).toHaveBeenCalledWith('9', 'portfolio');
    expect(localStorage.getItem('viewed_blog_9')).not.toBeNull();
    expect(localStorage.getItem('viewed_portfolio_9')).not.toBeNull();
  });

  it('keys metrics by post identity with no locale segment', async () => {
    await mountDisplay('9', 'blog');

    expect(h.incrementViews).toHaveBeenCalledWith('9', 'blog');
    expect(localStorage.length).toBe(1);
    expect(localStorage.key(0)).toBe('viewed_blog_9');
  });
});

describe('ViewDisplay navigation edge cases', () => {
  it('only reads an already-viewed destination without incrementing', async () => {
    localStorage.setItem('viewed_blog_10', Date.now().toString());
    h.getCurrentViews.mockResolvedValue({ success: true, views: 55 });

    const { container, root } = await mountDisplay('9', 'blog');
    expect(h.incrementViews).toHaveBeenCalledTimes(1);

    await navigate(root, '10', 'blog');

    expect(h.incrementViews).toHaveBeenCalledTimes(1);
    expect(h.getCurrentViews).toHaveBeenCalledWith('10', 'blog');
    expect(container.textContent).toContain('55');
  });

  it('does not duplicate work on same-identity rerender', async () => {
    const { root } = await mountDisplay('9', 'blog');
    expect(h.incrementViews).toHaveBeenCalledTimes(1);

    await navigate(root, '9', 'blog');

    expect(h.incrementViews).toHaveBeenCalledTimes(1);
    expect(h.getCurrentViews).not.toHaveBeenCalled();
  });

  it('ignores a stale failure continuation after navigation', async () => {
    const pendingA = deferred<{ success: true; views: number }>();
    h.incrementViews.mockReturnValueOnce(pendingA.promise);
    const { container, root } = await mountDisplay('9', 'blog');

    h.incrementViews.mockResolvedValue({ success: true, views: 77 });
    await navigate(root, '10', 'blog');
    expect(container.textContent).toContain('77');

    await act(async () => {
      pendingA.resolve({ success: false, error: 'gone' } as never);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain('77');
    expect(container.textContent).not.toContain('42');
    expect(localStorage.getItem('viewed_blog_10')).not.toBeNull();
  });
});
