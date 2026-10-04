import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PortfolioPost } from '@/types/fetchedData.types';

const h = vi.hoisted(() => ({ getPost: vi.fn() }));

vi.mock('@utils/getData', () => ({ getPost: h.getPost, getPosts: vi.fn() }));
// The page renders ViewDisplay, and both view actions build a Supabase client
// at module scope, which throws on import without the Supabase env. The
// quick-link row this file exercises never reads a view count, so the two
// server-action boundaries are stubbed like `@utils/getData` above.
vi.mock('@/app/actions/getCurrentViews', () => ({
  getCurrentViews: vi.fn(async () => ({ success: true, views: 0 })),
}));
vi.mock('@/app/actions/incrementViews', () => ({
  incrementViews: vi.fn(async () => ({ success: true })),
}));
// Children that read the next-intl context the page no longer needs for the
// preset labels; the quick-link row is what this test exercises.
vi.mock('@/components/common/ShareButton', () => ({
  default: () => null,
}));
vi.mock('@/components/layout/MarkdownRenderer', () => ({
  default: () => null,
}));
// `vi.mock` factories are hoisted above the imports, so `react` can only be
// reached through a dynamic import inside them (same as Skills.test.ts).
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

import PostPage from './page';

function portfolio(overrides: Partial<PortfolioPost> = {}): PortfolioPost {
  return {
    id: 9,
    created_at: '2026-01-02T00:00:00.000Z',
    title_en: 'PearlLift',
    title_it: 'PearlLift',
    image: 'https://example.com/p.webp',
    source_link: 'https://github.com/okazakee/pearlift',
    demo_link: 'https://demo.example.com',
    description_en: 'A workout tracker',
    description_it: 'Un tracker',
    body_en: 'Body',
    body_it: 'Corpo',
    blurhashURL: '',
    post_tags: '"nextjs"',
    store_link: 'https://play.google.com/store/apps/details?id=x',
    fdroid_link: 'https://f-droid.org/packages/x',
    website: 'https://pearlift.app',
    ios_store_link: 'https://apps.apple.com/app/x',
    buttons: null,
    views: 3,
    hidden: false,
    ...overrides,
  };
}

async function render(post: PortfolioPost, locale = 'en') {
  h.getPost.mockResolvedValue(post);
  const element = await PostPage({
    params: Promise.resolve({
      post_type: 'portfolio',
      id: String(post.id),
      title: 'pearllift',
      locale,
    }),
  });
  return renderToStaticMarkup(element);
}

// The meta row renders the quick links twice (desktop row, mobile grid), so
// collapse the repeats and keep the first occurrence order.
function quickLinks(html: string): { href: string; event: string }[] {
  const anchors = [...html.matchAll(/<a\s([^>]*)>/g)].map(([, attrs]) => {
    const href = /href="([^"]+)"/.exec(attrs)?.[1] ?? '';
    const event = /data-umami-event="([^"]+)"/.exec(attrs)?.[1] ?? '';
    return { href, event };
  });
  return anchors.filter(
    (link, index) =>
      anchors.findIndex((other) => other.href === link.href) === index
  );
}

beforeEach(() => {
  h.getPost.mockReset();
});

describe('post detail quick links', () => {
  it('renders a legacy row with no buttons exactly as before', async () => {
    const html = await render(portfolio());
    expect(quickLinks(html)).toEqual([
      { href: 'https://pearlift.app', event: 'Website button' },
      {
        href: 'https://github.com/okazakee/pearlift',
        event: 'View Source Code button',
      },
      { href: 'https://demo.example.com', event: 'View Demo button' },
      {
        href: 'https://play.google.com/store/apps/details?id=x',
        event: 'Play Store button',
      },
      { href: 'https://f-droid.org/packages/x', event: 'F-Droid button' },
      { href: 'https://apps.apple.com/app/x', event: 'iOS Store button' },
    ]);
    // The globe button carries no text, exactly as it always has.
    expect(html).toContain(
      '<a class="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-text-muted transition-colors hover:border-accent-violet/50 hover:text-text-white" data-umami-event="Website button" data-umami-event-post="pearllift" href="https://pearlift.app"'
    );
  });

  it('falls back to the legacy columns when buttons is an empty array', async () => {
    const html = await render(portfolio({ buttons: [] }));
    expect(quickLinks(html)).toHaveLength(6);
  });

  it('renders the stored order and ignores the legacy columns when buttons exist', async () => {
    const html = await render(
      portfolio({
        buttons: [
          { kind: 'demo', url: 'https://demo.example.com' },
          { kind: 'source', url: 'https://github.com/okazakee/pearlift' },
        ],
      })
    );
    expect(quickLinks(html)).toEqual([
      { href: 'https://demo.example.com', event: 'View Demo button' },
      {
        href: 'https://github.com/okazakee/pearlift',
        event: 'View Source Code button',
      },
    ]);
  });

  it('uses the site label for a preset and the editor label for custom', async () => {
    const html = await render(
      portfolio({
        buttons: [
          {
            kind: 'custom',
            url: 'https://changelog.example.com',
            label: 'Changelog',
          },
          { kind: 'source', url: 'https://github.com/okazakee/pearlift' },
        ],
      })
    );
    expect(html).toContain('Changelog');
    expect(html).toContain('Source');
    expect(quickLinks(html)[0].event).toBe('Custom link button');
  });

  it('localizes preset labels for Italian readers', async () => {
    const html = await render(portfolio(), 'it');
    expect(html).toContain('>Codice<');
    expect(html).not.toContain('>Source<');
  });

  it('keeps the JSON-LD links and the stars widget on the source button', async () => {
    const html = await render(
      portfolio({
        buttons: [
          { kind: 'source', url: 'https://github.com/okazakee/pearlift' },
        ],
      })
    );
    expect(html).toContain(
      '"codeRepository":"https://github.com/okazakee/pearlift"'
    );
  });

  it('drops a button whose url is not an absolute http(s) URL, falling back to the legacy columns', async () => {
    const html = await render(
      portfolio({
        buttons: [{ kind: 'demo', url: 'javascript:alert(1)' }],
      })
    );
    expect(quickLinks(html).map((link) => link.href)).not.toContain(
      'javascript:alert(1)'
    );
    expect(quickLinks(html)).toHaveLength(6);
  });
});
