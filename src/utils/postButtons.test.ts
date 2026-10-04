import { describe, expect, it } from 'vitest';
import { postButtonLabel } from '@/i18n/postButtons';
import type { PortfolioPost } from '@/types/fetchedData.types';
import {
  type PostButton,
  postButtonUrl,
  parsePostButtons,
  resolvePostButtons,
} from './postButtons';

function portfolio(overrides: Partial<PortfolioPost> = {}): PortfolioPost {
  return {
    id: 1,
    created_at: '2026-01-02T00:00:00.000Z',
    title_en: 'Project',
    title_it: 'Progetto',
    image: 'https://example.com/p.webp',
    source_link: '',
    demo_link: '',
    description_en: 'A project',
    description_it: 'Un progetto',
    body_en: '',
    body_it: '',
    blurhashURL: '',
    post_tags: '"nextjs"',
    store_link: '',
    fdroid_link: null,
    website: null,
    ios_store_link: null,
    buttons: null,
    views: 0,
    hidden: false,
    ...overrides,
  };
}

const legacyRow = portfolio({
  website: 'https://example.com',
  source_link: 'https://github.com/okazakee/pearlift',
  demo_link: 'https://demo.example.com',
  store_link: 'https://play.google.com/store/apps/details?id=x',
  fdroid_link: 'https://f-droid.org/packages/x',
  ios_store_link: 'https://apps.apple.com/app/x',
});

describe('resolvePostButtons legacy fallback', () => {
  it('renders the six legacy columns in the historical visual order', () => {
    expect(resolvePostButtons(legacyRow)).toEqual([
      { kind: 'website', url: 'https://example.com' },
      { kind: 'source', url: 'https://github.com/okazakee/pearlift' },
      { kind: 'demo', url: 'https://demo.example.com' },
      { kind: 'store', url: 'https://play.google.com/store/apps/details?id=x' },
      { kind: 'fdroid', url: 'https://f-droid.org/packages/x' },
      { kind: 'ios', url: 'https://apps.apple.com/app/x' },
    ]);
  });

  it('falls back when buttons is null or an empty array', () => {
    expect(resolvePostButtons({ ...legacyRow, buttons: [] })).toHaveLength(6);
    expect(
      resolvePostButtons({ ...legacyRow, buttons: [{ kind: 'source' }] })
    ).toHaveLength(6);
  });

  it('skips empty legacy strings and nulls, as the old truthy checks did', () => {
    expect(
      resolvePostButtons(
        portfolio({ source_link: '', fdroid_link: '', website: null })
      )
    ).toEqual([]);
  });
});

describe('resolvePostButtons stored list', () => {
  it('renders the stored order and ignores the legacy columns', () => {
    const buttons: PostButton[] = [
      { kind: 'demo', url: 'https://demo.example.com' },
      { kind: 'source', url: 'https://github.com/okazakee/pearlift' },
    ];
    expect(resolvePostButtons({ ...legacyRow, buttons })).toEqual(buttons);
  });

  it('keeps custom labels and drops labels stored on presets', () => {
    expect(
      resolvePostButtons({
        ...legacyRow,
        buttons: [
          {
            kind: 'custom',
            url: 'https://changelog.example.com',
            label: 'Changelog',
          },
          {
            kind: 'source',
            url: 'https://github.com/okazakee/pearlift',
            label: 'Ignored',
          } as PostButton,
        ],
      })
    ).toEqual([
      {
        kind: 'custom',
        url: 'https://changelog.example.com',
        label: 'Changelog',
      },
      { kind: 'source', url: 'https://github.com/okazakee/pearlift' },
    ]);
  });
});

describe('parsePostButtons validation', () => {
  it('rejects entries whose url is not an absolute http(s) URL', () => {
    expect(
      parsePostButtons([
        { kind: 'source', url: 'github.com/okazakee' },
        { kind: 'demo', url: 'javascript:alert(1)' },
        { kind: 'store', url: '' },
        { kind: 'fdroid', url: 'https://f-droid.org/packages/x' },
      ])
    ).toEqual([{ kind: 'fdroid', url: 'https://f-droid.org/packages/x' }]);
  });

  it('rejects unknown kinds and custom buttons without a label', () => {
    expect(
      parsePostButtons([
        { kind: 'playstation', url: 'https://store.example.com' },
        { kind: 'custom', url: 'https://example.com' },
        { kind: 'custom', url: 'https://example.com', label: '   ' },
        { kind: 'custom', url: 'https://example.com', label: 'Docs' },
      ])
    ).toEqual([{ kind: 'custom', url: 'https://example.com', label: 'Docs' }]);
  });

  it('returns an empty list for anything that is not an array', () => {
    expect(parsePostButtons(null)).toEqual([]);
    expect(parsePostButtons({ kind: 'source' })).toEqual([]);
  });
});

describe('postButtonUrl', () => {
  it('returns the first url of a kind and null when absent', () => {
    const buttons = resolvePostButtons(legacyRow);
    expect(postButtonUrl(buttons, 'ios')).toBe('https://apps.apple.com/app/x');
    expect(postButtonUrl(buttons, 'custom')).toBeNull();
  });
});

describe('postButtonLabel', () => {
  it('gives the website button no text, as it always had', () => {
    expect(postButtonLabel('website', 'en')).toBeNull();
    expect(postButtonLabel('website', 'it')).toBeNull();
  });

  it('localizes every other preset and falls back to English', () => {
    expect(postButtonLabel('source', 'en')).toBe('Source');
    expect(postButtonLabel('source', 'it')).toBe('Codice');
    expect(postButtonLabel('store', 'it')).toBe('Google Play');
    expect(postButtonLabel('fdroid', 'en')).toBe('F-Droid');
    expect(postButtonLabel('ios', 'en')).toBe('App Store');
    expect(postButtonLabel('demo', 'en')).toBe('Demo');
    expect(postButtonLabel('source', 'fr')).toBe('Source');
  });
});
