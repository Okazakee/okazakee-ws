// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

import MarkdownRenderer from './MarkdownRenderer';

const roots: Root[] = [];

async function renderMarkdown(markdown: string) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(createElement(MarkdownRenderer, { markdown }));
  });
  return container;
}

afterEach(async () => {
  await act(async () => {
    for (const root of roots.splice(0)) root.unmount();
  });
  document.body.innerHTML = '';
});

// PostFigure null-guard behavior (mirrors okazakee-cms
// `src/components/cms/shared/MarkdownPreview.tsx`: an image with no usable
// source renders nothing instead of crashing).
describe('PostFigure guards', () => {
  it('renders a committed CMS body image with its caption', async () => {
    const container = await renderMarkdown(
      '![My photo-data:image/png;base64,iVBOR](https://cdn.test/blog/1.webp)'
    );
    expect(container.querySelector('figure')).not.toBeNull();
    expect(container.querySelector('.fig-caption')?.textContent).toBe(
      'My photo'
    );
    expect(container.querySelector('img')?.getAttribute('alt')).toBe(
      'My photo'
    );
  });

  it('renders a legacy raw-hash image sharp with its caption', async () => {
    const container = await renderMarkdown(
      '![Caption-L6PZfSi_.AyE_3t7t7R**0o#DgR4](https://cdn.test/blog/2.webp)'
    );
    expect(container.querySelector('figure')).not.toBeNull();
    expect(container.querySelector('img')?.getAttribute('alt')).toBe(
      'Caption'
    );
  });

  it('renders nothing for an image with an empty source', async () => {
    const container = await renderMarkdown('![Cap]()');
    expect(container.querySelector('figure')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });
});
