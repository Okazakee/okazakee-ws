import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

// The footer chrome copy is frozen in the message files (src/i18n/siteCopy.ts),
// so these assertions run against the real strings instead of fixtures that
// could drift from what ships. `vi.mock` factories are hoisted above the
// imports, so a static import of the messages would be uninitialized here —
// the dynamic import is the only way to reach them from the factory (same
// reason Header.test.ts pulls React in the same place).
//
// Footer only reads the `footer` and `posts-section` namespaces, both of which
// are fully string-leaf, so the translation mock is scoped to those groups via
// a single structurally-sound namespace narrowing instead of re-asserting the
// whole document (which also owns the array-valued `header` namespace and would
// trigger TS2352 under a uniform `Record<string, string>` shape).
type FooterNamespaces = 'footer' | 'posts-section';
vi.mock('next-intl/server', async () => {
  const messages = await import('@/i18n/messages/site.en.json');
  return {
    getTranslations: async ({
      namespace,
    }: {
      namespace: FooterNamespaces;
    }) => {
      const group = (
        messages.default as Record<FooterNamespaces, Record<string, string>>
      )[namespace];
      return (key: string) => group[key];
    },
  };
});
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  return {
    default: (props: Record<string, unknown>) => createElement('a', props),
  };
});

import Footer from './Footer';

async function render(props: {
  name?: string | null;
  vatNumber?: string | null;
}) {
  return renderToStaticMarkup(await Footer({ locale: 'en', ...props }));
}

describe('Footer identity', () => {
  it('renders the shipped defaults for a row with no identity', async () => {
    const markup = await render({});

    expect(markup).toContain('>Okazakee</a>');
    expect(markup).toContain('VAT IT - 02863310815');
  });

  it('renders the stored identity, VAT zeroes intact', async () => {
    const markup = await render({
      name: 'Okazakee Studio',
      vatNumber: '01234567890',
    });

    expect(markup).toContain('>Okazakee Studio</a>');
    expect(markup).not.toContain('>Okazakee</a>');
    expect(markup).toContain('VAT IT - 01234567890');
    expect(markup).not.toContain('02863310815');
  });

  it('keeps the defaults for a null or blank identity', async () => {
    const markup = await render({ name: '   ', vatNumber: null });

    expect(markup).toContain('>Okazakee</a>');
    expect(markup).toContain('VAT IT - 02863310815');
  });

  it('keeps the GitHub links under a custom name', async () => {
    const markup = await render({ name: 'Okazakee Studio' });

    expect(markup).toContain('href="https://github.com/Okazakee"');
    expect(markup).toContain('href="https://github.com/Okazakee/okazakee-ws"');
  });
});
