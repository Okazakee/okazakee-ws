import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { PostCardData } from '@/types/fetchedData.types';

const h = vi.hoisted(() => ({ getPostViewsBatch: vi.fn() }));

vi.mock('@/app/actions/getPostViewsBatch', () => ({
  getPostViewsBatch: h.getPostViewsBatch,
  postViewsMapKey: (postType: string, id: number) => `${postType}:${id}`,
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

import PostCard from './PostCard';

function card(overrides: Partial<PostCardData> = {}): PostCardData {
  return {
    id: 9,
    created_at: '2026-01-02T00:00:00.000Z',
    title_en: 'PearlLift',
    title_it: 'PearlLift',
    description_en: 'A workout tracker',
    description_it: 'Un tracker',
    image: 'https://example.com/p.webp',
    blurhashURL: '',
    post_tags: '"nextjs" "docker"',
    ...overrides,
  };
}

async function render(
  post: PostCardData,
  postType: 'blog' | 'portfolio',
  locale = 'en'
) {
  const React = await import('react');
  return renderToStaticMarkup(
    React.createElement(PostCard, { post, postType, locale })
  );
}

describe('PostCard with the reduced card projection', () => {
  it('renders a portfolio card from card-only fields', async () => {
    const html = await render(card(), 'portfolio');

    expect(html).toContain('PearlLift');
    expect(html).toContain('A workout tracker');
    expect(html).toContain('nextjs');
    expect(html).toContain('/en/portfolio/9/pearllift');
  });

  it('renders a blog card with the locale title', async () => {
    const html = await render(
      card({ title_it: 'Sollevatore' }),
      'blog',
      'it'
    );

    expect(html).toContain('Sollevatore');
    expect(html).toContain('/it/blog/9/sollevatore');
  });

  it('uses explicit postType instead of field probing', async () => {
    const portfolioAsBlog = await render(card(), 'blog');

    expect(portfolioAsBlog).toContain('/en/blog/9/pearllift');
  });

  it('shows the live-count placeholder without baked views', async () => {
    const html = await render(card(), 'blog');

    expect(html).toContain('—');
  });
});
