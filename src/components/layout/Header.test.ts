import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@public/title-ws.png', () => ({
  default: { src: '/bundled-dark.png' },
}));
vi.mock('@public/title-ws-lightmode.png', () => ({
  default: { src: '/bundled-light.png' },
}));
// vi.mock factories are hoisted above the imports, so the React factory has to
// be pulled in inside the factory rather than at module scope.
vi.mock('next/image', async () => {
  const { createElement } = await import('react');
  return {
    default: (props: { src?: string; alt?: string; className?: string }) =>
      createElement('img', {
        alt: props.alt,
        className: props.className,
        src: props.src,
      }),
  };
});
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  return {
    default: (props: Record<string, unknown>) => createElement('a', props),
  };
});
vi.mock('./NavMenu', async () => {
  const { createElement } = await import('react');
  return {
    default: () => createElement('nav'),
  };
});

import Header from './Header';

const DARK_VARIANT =
  'hidden h-6 w-auto max-w-none shrink-0 object-contain dark:block';
const LIGHT_VARIANT =
  'block h-6 w-auto max-w-none shrink-0 object-contain dark:hidden';

function render(settings: {
  logoDark: string | null;
  logoLight: string | null;
}) {
  return renderToStaticMarkup(
    Header({
      locale: 'en',
      resumeLink: null,
      logoDark: settings.logoDark,
      logoLight: settings.logoLight,
    })
  );
}

/** The rendered logo source per theme, dark variant first. */
function logoSources(markup: string): { dark: string; light: string } {
  const sources = [...markup.matchAll(/<img[^>]*src="([^"]*)"/g)].map(
    (match) => match[1]
  );
  expect(sources).toHaveLength(2);
  return { dark: sources[0], light: sources[1] };
}

describe('Header logos', () => {
  it('falls back to the bundled assets when neither logo is stored', () => {
    const markup = render({ logoDark: null, logoLight: null });
    expect(logoSources(markup)).toEqual({
      dark: '/bundled-dark.png',
      light: '/bundled-light.png',
    });
    // The per-theme swap and the alt text survive untouched.
    expect(markup).toContain(DARK_VARIANT);
    expect(markup).toContain(LIGHT_VARIANT);
    expect(markup.match(/alt="logo"/g)).toHaveLength(2);
  });

  it('treats an empty stored URL as unconfigured', () => {
    expect(logoSources(render({ logoDark: '   ', logoLight: '' }))).toEqual({
      dark: '/bundled-dark.png',
      light: '/bundled-light.png',
    });
  });

  it('renders a stored dark logo and still falls back on the light theme', () => {
    expect(
      logoSources(
        render({
          logoDark: 'https://cdn.example.test/dark.webp',
          logoLight: null,
        })
      )
    ).toEqual({
      dark: 'https://cdn.example.test/dark.webp',
      light: '/bundled-light.png',
    });
  });

  it('renders a stored light logo and still falls back on the dark theme', () => {
    expect(
      logoSources(
        render({
          logoDark: null,
          logoLight: 'https://cdn.example.test/light.webp',
        })
      )
    ).toEqual({
      dark: '/bundled-dark.png',
      light: 'https://cdn.example.test/light.webp',
    });
  });
});
