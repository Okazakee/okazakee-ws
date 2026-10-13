// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const h = vi.hoisted(() => ({ searchPosts: vi.fn() }));

vi.mock('@/app/actions/search', () => ({
  searchPosts: h.searchPosts,
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import Searchbar from './Searchbar';

const roots: Root[] = [];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.useFakeTimers();
  h.searchPosts.mockReset();
});

afterEach(async () => {
  await act(async () => {
    for (const root of roots.splice(0)) root.unmount();
  });
  document.body.innerHTML = '';
  vi.useRealTimers();
});

function typeText(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;
  if (!setter) throw new Error('native value setter missing');
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('Searchbar request ordering', () => {
  it('ignores a stale older response that resolves last', async () => {
    const setPosts = vi.fn();
    const setRateLimited = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push(root);

    await act(async () => {
      root.render(
        createElement(Searchbar, {
          post_type: 'blog',
          SetPosts: setPosts,
          initialPosts: [],
          SetIsRateLimited: setRateLimited,
          locale: 'en',
        })
      );
    });

    const input = container.querySelector('input');
    if (!input) throw new Error('search input missing');

    const reqA = deferred<{ posts: unknown[] }>();
    const reqB = deferred<{ posts: unknown[] }>();
    h.searchPosts.mockImplementationOnce(() => reqA.promise);
    h.searchPosts.mockImplementationOnce(() => reqB.promise);

    // Type "rea", let the debounce fire request A.
    await act(async () => {
      typeText(input, 'rea');
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(h.searchPosts).toHaveBeenCalledTimes(1);

    // Type "react", let the debounce fire request B.
    await act(async () => {
      typeText(input, 'react');
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(h.searchPosts).toHaveBeenCalledTimes(2);

    // B (newest) resolves first, then A (stale) resolves last.
    await act(async () => {
      reqB.resolve({ posts: [{ id: 'B' }] });
      await Promise.resolve();
    });
    await act(async () => {
      reqA.resolve({ posts: [{ id: 'A' }] });
      await Promise.resolve();
    });

    const lastPosts =
      setPosts.mock.calls[setPosts.mock.calls.length - 1]?.[0];
    expect(lastPosts).toEqual([{ id: 'B' }]);
  });

  it('applies the newest response on in-order completion', async () => {
    const setPosts = vi.fn();
    const setRateLimited = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push(root);

    await act(async () => {
      root.render(
        createElement(Searchbar, {
          post_type: 'blog',
          SetPosts: setPosts,
          initialPosts: [],
          SetIsRateLimited: setRateLimited,
          locale: 'en',
        })
      );
    });

    const input = container.querySelector('input');
    if (!input) throw new Error('search input missing');

    h.searchPosts.mockResolvedValueOnce({ posts: [{ id: 'A' }] });
    await act(async () => {
      typeText(input, 'rea');
      await vi.advanceTimersByTimeAsync(300);
    });
    h.searchPosts.mockResolvedValueOnce({ posts: [{ id: 'B' }] });
    await act(async () => {
      typeText(input, 'react');
      await vi.advanceTimersByTimeAsync(300);
    });

    const lastPosts =
      setPosts.mock.calls[setPosts.mock.calls.length - 1]?.[0];
    expect(lastPosts).toEqual([{ id: 'B' }]);
    expect(setRateLimited).toHaveBeenLastCalledWith(false);
  });
});
