import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PostCardData } from '@/types/fetchedData.types';

const h = vi.hoisted(() => ({
  getPostViewsBatch: vi.fn(),
  searchPosts: vi.fn(),
}));

vi.mock('@/app/actions/getPostViewsBatch', () => ({
  getPostViewsBatch: h.getPostViewsBatch,
  postViewsMapKey: (postType: string, id: number) => `${postType}:${id}`,
}));
vi.mock('@/app/actions/search', () => ({
  searchPosts: h.searchPosts,
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('next/image', async () => {
  const React = await import('react');
  return {
    default: (props: Record<string, unknown>) =>
      React.createElement('img', props),
  };
});
vi.mock('next/link', async () => {
  const React = await import('react');
  return {
    default: (props: Record<string, unknown>) =>
      React.createElement('a', props),
  };
});

import PostList from './PostList';

function card(id: number, title: string): PostCardData {
  return {
    id,
    created_at: '2026-01-02T00:00:00.000Z',
    title_en: title,
    title_it: title,
    description_en: `${title} description`,
    description_it: `${title} description`,
    image: `https://example.com/${id}.webp`,
    blurhashURL: '',
    post_tags: '"nextjs"',
  };
}

async function render(posts: PostCardData[]) {
  const React = await import('react');
  return renderToStaticMarkup(
    React.createElement(PostList, {
      initialPosts: posts,
      post_type: 'blog',
      locale: 'en',
    })
  );
}

beforeEach(() => {
  h.getPostViewsBatch.mockReset();
  h.searchPosts.mockReset();
  h.getPostViewsBatch.mockResolvedValue({ success: true, views: {} });
});

describe('PostList with the reduced card projection', () => {
  it('renders search-shaped rows without bodies, views or links', async () => {
    const html = await render([card(1, 'First'), card(2, 'Second')]);

    expect(html).toContain('First');
    expect(html).toContain('Second');
    expect(html).toContain('/en/blog/1/first');
    expect(html).toContain('/en/blog/2/second');
  });

  it('shows live-count placeholders instead of baked numbers', async () => {
    const html = await render([card(1, 'First')]);

    expect(html).toContain('—');
  });
});
