import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', async () => {
  const React = await import('react');
  return {
    // Faithful shape: width/height land as HTML attributes (pre-load
    // reserve + optimizer hints), className/style pass through.
    default: (props: Record<string, unknown>) =>
      React.createElement('img', props),
  };
});
vi.mock('../common/ImageModal', () => ({
  ImageModal: () => null,
}));

import NextImage from './NextImage';

function figureRule(): string {
  const css = readFileSync(
    fileURLToPath(new URL('../../app/globals.css', import.meta.url)),
    { encoding: 'utf8' }
  );
  const match = /\.post \.post-figure img \{([^}]*)\}/.exec(css);
  if (!match?.[1]) throw new Error('post-figure img rule missing');
  return match[1];
}

function componentSource(): string {
  return readFileSync(fileURLToPath(new URL('./NextImage.tsx', import.meta.url)), {
    encoding: 'utf8',
  });
}

describe('NextImage sizing contract', () => {
  it('uses one orientation-independent markup for portrait, landscape and square', async () => {
    const React = await import('react');
    const html = renderToStaticMarkup(
      React.createElement(NextImage, {
        src: 'https://cdn.test/tall.webp',
        alt: 'A caption',
        blurhash: '',
      })
    );

    // No width caps, no orientation branches: the same classes govern
    // portrait, landscape and square assets.
    expect(html).not.toContain('w-full');
    expect(html).not.toContain('max-w-3xl');
    // Optimizer hints double as the pre-load space reserve.
    expect(html).toContain('width="1280"');
    expect(html).toContain('height="720"');
    // Never crop: no cover fit anywhere in the rendered output.
    expect(html).not.toContain('cover');
  });

  it('keeps caption and modal behavior unchanged', async () => {
    const React = await import('react');
    const captioned = renderToStaticMarkup(
      React.createElement(NextImage, {
        src: 'https://cdn.test/x.webp',
        alt: 'Caption',
        blurhash: '',
      })
    );
    expect(captioned).toContain('fig-caption');
    expect(captioned).toContain('Caption');

    const bare = renderToStaticMarkup(
      React.createElement(NextImage, {
        src: 'https://cdn.test/x.webp',
        alt: '',
        blurhash: '',
      })
    );
    expect(bare).not.toContain('fig-caption');
  });

  it('does no client-side orientation measurement', () => {
    const source = componentSource();
    expect(source).not.toContain('isVertical');
    expect(source).not.toContain('naturalHeight');
    expect(source).not.toContain('onLoad');
  });
});

describe('post-figure CSS sizing policy', () => {
  it('caps portraits by viewport height instead of width', () => {
    const rule = figureRule();
    expect(rule).toMatch(/max-height:\s*80vh/);
  });

  it('lets landscapes use the prose width at natural ratio', () => {
    const rule = figureRule();
    expect(rule).toMatch(/max-width:\s*100%/);
    expect(rule).toMatch(/height:\s*auto/);
    expect(rule).toMatch(/aspect-ratio:\s*auto/);
  });

  it('centers every orientation without forcing full width', () => {
    const rule = figureRule();
    expect(rule).toMatch(/margin:\s*0 auto/);
    expect(rule).not.toMatch(/(?<!max-)width:\s*100%/);
  });

  it('never crops the asset to fit', () => {
    const rule = figureRule();
    expect(rule).not.toMatch(/object-fit/);
  });
});
