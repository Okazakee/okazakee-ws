import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', async () => {
  const React = await import('react');
  return {
    default: (props: Record<string, unknown>) =>
      React.createElement('img', props),
  };
});

import { InnerHtml } from './InnerHtml';
import { formatLabels } from '@/utils/formatLabels';
import {
  parseTypewriterRuns,
  typewriterHtml,
  typewriterLength,
} from '@/utils/heroDisplay';

const PAYLOAD =
  '<img src=x onerror="document.documentElement.dataset.xss=\'1\'">';

async function render(html: string): Promise<string> {
  const React = await import('react');
  return renderToStaticMarkup(
    React.createElement(InnerHtml, { html })
  );
}

describe('InnerHtml sink contract', () => {
  it('renders hero-name output with inert markup and live labels', async () => {
    const html = await render(formatLabels(`Hello ****${PAYLOAD}****`));

    expect(html).toContain('<label>&lt;img');
    expect(html).not.toMatch(/<[^>]*\sonerror=/);
  });

  it('renders role output with inert markup and live labels', async () => {
    const runs = parseTypewriterRuns(`Dev ****${PAYLOAD}****`);
    const html = await render(
      typewriterHtml(runs, typewriterLength(runs))
    );

    expect(html).toContain('<label>&lt;img');
    expect(html).not.toMatch(/<[^>]*\sonerror=/);
  });

  it('renders about-paragraph output with inert markup', async () => {
    const html = await render(formatLabels(`Building ${PAYLOAD} things`));

    expect(html).toContain('&lt;img');
    expect(html).not.toMatch(/<[^>]*\sonerror=/);
    expect(html).toContain('Building');
  });
});
