// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const h = vi.hoisted(() => ({
  getPostViewsBatch: vi.fn(),
}));

vi.mock('@/app/actions/getPostViewsBatch', () => ({
  getPostViewsBatch: h.getPostViewsBatch,
  postViewsMapKey: (postType: string, id: number) => `${postType}:${id}`,
}));

import type { PostViewsKey } from '@/utils/postViews';
import { PostViewsBadge, PostViewsProvider } from './PostViews';

const roots: Root[] = [];

async function renderBadges(viewKeys: PostViewsKey[]) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  const badges = viewKeys.map((key) =>
    createElement(PostViewsBadge, {
      key: `${key.postType}:${key.id}`,
      postType: key.postType,
      postId: key.id,
    })
  );
  await act(async () => {
    root.render(
      // biome-ignore lint/correctness/noChildrenProp: children-as-prop keeps TS props inference in .ts tests.
      createElement(PostViewsProvider, { viewKeys, children: badges })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return { container, root };
}

afterEach(async () => {
  await act(async () => {
    for (const root of roots.splice(0)) root.unmount();
  });
  document.body.innerHTML = '';
});

beforeEach(() => {
  h.getPostViewsBatch.mockReset();
  h.getPostViewsBatch.mockResolvedValue({
    success: true,
    views: { 'blog:1': 10, 'blog:2': 0, 'portfolio:9': 3 },
  });
});

const threeKeys: PostViewsKey[] = [
  { postType: 'blog', id: 1 },
  { postType: 'blog', id: 2 },
  { postType: 'portfolio', id: 9 },
];

describe('PostViews batch hydration', () => {
  it('requests all visible ids in one batch, never per card', async () => {
    const badges = [...threeKeys, { postType: 'blog' as const, id: 1 }];
    await renderBadges([
      ...badges,
      { postType: 'blog', id: 3 },
      { postType: 'portfolio', id: 4 },
    ]);

    expect(h.getPostViewsBatch).toHaveBeenCalledTimes(1);
    expect(h.getPostViewsBatch).toHaveBeenCalledWith([
      { postType: 'blog', id: 1 },
      { postType: 'blog', id: 2 },
      { postType: 'blog', id: 3 },
      { postType: 'portfolio', id: 4 },
      { postType: 'portfolio', id: 9 },
    ]);
  });

  it('shows live values once loaded, including zero', async () => {
    const { container } = await renderBadges(threeKeys);

    expect(container.textContent).toContain('10');
    expect(container.textContent).toContain('3');
    expect(container.textContent).not.toContain('—');
  });

  it('keeps the placeholder for unknown ids', async () => {
    const { container } = await renderBadges([
      { postType: 'blog', id: 999 },
    ]);

    expect(container.textContent).toContain('—');
  });

  it('degrades safely when the batch request fails', async () => {
    h.getPostViewsBatch.mockResolvedValue({
      success: false,
      error: 'unavailable',
    });

    const { container } = await renderBadges(threeKeys);

    expect(container.textContent).toContain('—');
  });

  it('requests the new id set when the visible list changes', async () => {
    const { root } = await renderBadges(threeKeys);
    expect(h.getPostViewsBatch).toHaveBeenCalledTimes(1);

    const next: PostViewsKey[] = [{ postType: 'blog', id: 5 }];
    h.getPostViewsBatch.mockResolvedValue({
      success: true,
      views: { 'blog:5': 7 },
    });
    await act(async () => {
      root.render(
        createElement(PostViewsProvider, {
          viewKeys: next,
          // biome-ignore lint/correctness/noChildrenProp: children-as-prop keeps TS props inference in .ts tests.
          children: createElement(PostViewsBadge, {
            postType: 'blog',
            postId: 5,
          }),
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(h.getPostViewsBatch).toHaveBeenCalledTimes(2);
    expect(h.getPostViewsBatch).toHaveBeenLastCalledWith(next);
    expect(document.body.textContent).toContain('7');
  });

  it('resolves EN and IT lists for the same post to one metric identity', async () => {
    const enKeys: PostViewsKey[] = [{ postType: 'blog', id: 5 }];
    const itKeys: PostViewsKey[] = [{ postType: 'blog', id: 5 }];
    h.getPostViewsBatch.mockResolvedValue({
      success: true,
      views: { 'blog:5': 12 },
    });

    const first = await renderBadges(enKeys);
    const second = await renderBadges(itKeys);

    expect(h.getPostViewsBatch).toHaveBeenNthCalledWith(1, enKeys);
    expect(h.getPostViewsBatch).toHaveBeenNthCalledWith(2, itKeys);
    expect(first.container.textContent).toContain('12');
    expect(second.container.textContent).toContain('12');
  });
});
