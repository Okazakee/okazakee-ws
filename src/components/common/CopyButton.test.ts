// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import CopyLinkButton from './CopyButton';

const roots: Root[] = [];

function mockClipboard() {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
}

async function renderCopy(value = 'vat-123') {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      createElement(CopyLinkButton, {
        copyValue: value,
        buttonTitle: 'copy',
        copiedLabel: 'copied!',
        className: 'x',
        // biome-ignore lint/correctness/noChildrenProp: children-as-prop keeps TS props inference in .ts tests.
        children: 'label',
      })
    );
  });
  const button = container.querySelector('button');
  if (!button) throw new Error('button missing');
  return { container, root, button };
}

async function click(button: HTMLButtonElement) {
  await act(async () => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(0);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  mockClipboard();
});

afterEach(async () => {
  await act(async () => {
    for (const root of roots.splice(0)) root.unmount();
  });
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('copy-confirmation timer lifecycle', () => {
  it('keeps the confirmation for the full duration after a second rapid copy', async () => {
    const { container, button } = await renderCopy();
    await click(button);
    expect(container.textContent).toContain('copied!');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    await click(button);

    // The first timer must not cut the second confirmation short: 1.5s
    // after the SECOND copy the confirmation is still visible.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(container.textContent).toContain('copied!');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(container.textContent).not.toContain('copied!');
  });

  it('clears a pending reset timer on unmount', async () => {
    const { root, button } = await renderCopy();
    await click(button);
    expect(document.body.textContent).toContain('copied!');

    await act(async () => {
      root.unmount();
      roots.splice(roots.indexOf(root), 1);
    });
    const pending = vi.getTimerCount();
    expect(pending).toBe(0);
  });
});
