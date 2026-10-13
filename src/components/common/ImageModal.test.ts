// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

vi.mock('next/image', async () => {
  const React = await import('react');
  return {
    default: (props: Record<string, unknown>) =>
      React.createElement('img', props),
  };
});

import { ImageModal } from './ImageModal';

const roots: Root[] = [];
const keydownAdds: string[] = [];
const keydownRemoves: string[] = [];
const wheelRegistrations: Array<{ passive: boolean | undefined }> = [];

let addSpy: ReturnType<typeof vi.spyOn> | null = null;
let removeSpy: ReturnType<typeof vi.spyOn> | null = null;
let elementAddSpy: ReturnType<typeof vi.spyOn> | null = null;
let elementRemoveSpy: ReturnType<typeof vi.spyOn> | null = null;

function wheelEvent(deltaY: number): Event {
  try {
    return new WheelEvent('wheel', {
      deltaY,
      bubbles: true,
      cancelable: true,
    });
  } catch {
    const event = new Event('wheel', { bubbles: true, cancelable: true });
    (event as Event & { deltaY?: number }).deltaY = deltaY;
    return event;
  }
}

function renderModal() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  return { container, root };
}

async function showModal(root: Root, onClose: () => void, alt = 'photo') {
  await act(async () => {
    root.render(
      createElement(ImageModal, {
        src: 'https://example.com/x.webp',
        alt,
        onClose,
      })
    );
  });
}

function modalPresent(): boolean {
  return document.body.querySelector('[aria-label="Close modal"]') !== null;
}

beforeEach(() => {
  keydownAdds.length = 0;
  keydownRemoves.length = 0;
  wheelRegistrations.length = 0;
  document.body.style.overflow = '';
  const originalAdd = window.addEventListener.bind(window);
  const originalRemove = window.removeEventListener.bind(window);
  addSpy = vi
    .spyOn(window, 'addEventListener')
    .mockImplementation(((type: string, listener: unknown, options?: unknown) => {
      if (type === 'keydown') keydownAdds.push(type);
      return (originalAdd as (...args: unknown[]) => void)(
        type,
        listener,
        options
      );
    }) as typeof window.addEventListener);
  removeSpy = vi
    .spyOn(window, 'removeEventListener')
    .mockImplementation(((type: string, listener: unknown, options?: unknown) => {
      if (type === 'keydown') keydownRemoves.push(type);
      return (originalRemove as (...args: unknown[]) => void)(
        type,
        listener,
        options
      );
    }) as typeof window.removeEventListener);
  const originalElementAdd = Element.prototype.addEventListener;
  const originalElementRemove = Element.prototype.removeEventListener;
  elementAddSpy = vi
    .spyOn(Element.prototype, 'addEventListener')
    .mockImplementation(function (
      this: Element,
      type: string,
      listener: unknown,
      options?: unknown
    ) {
      if (type === 'wheel') {
        wheelRegistrations.push({
          passive:
            typeof options === 'object' && options !== null
              ? (options as AddEventListenerOptions).passive
              : undefined,
        });
      }
      return originalElementAdd.call(
        this,
        type,
        listener as EventListener,
        options as AddEventListenerOptions
      );
    } as typeof Element.prototype.addEventListener);
  elementRemoveSpy = vi
    .spyOn(Element.prototype, 'removeEventListener')
    .mockImplementation(function (
      this: Element,
      type: string,
      listener: unknown,
      options?: unknown
    ) {
      return originalElementRemove.call(
        this,
        type,
        listener as EventListener,
        options as EventListenerOptions
      );
    } as typeof Element.prototype.removeEventListener);
});

afterEach(async () => {
  await act(async () => {
    for (const root of roots.splice(0)) root.unmount();
  });
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  addSpy?.mockRestore();
  removeSpy?.mockRestore();
  elementAddSpy?.mockRestore();
  elementRemoveSpy?.mockRestore();
});

describe('ImageModal scroll lock and effects', () => {
  it('does not re-run modal effects when re-rendered with a stable close callback', async () => {
    const handleClose = () => {};
    const { root } = renderModal();
    await showModal(root, handleClose);
    expect(modalPresent()).toBe(true);
    expect(keydownAdds.length).toBe(1);

    // Parent rerender with the same callback identity.
    await showModal(root, handleClose);
    expect(modalPresent()).toBe(true);
    expect(keydownAdds.length).toBe(1);
    expect(keydownRemoves.length).toBe(0);
  });

  it('keeps one keydown subscription when NextImage rerenders with the modal open', async () => {
    const { default: NextImageComponent } = await import(
      '../layout/NextImage'
    );
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push(root);
    const renderFigure = (alt: string) =>
      act(async () => {
        root.render(
          createElement(NextImageComponent, {
            src: 'https://example.com/x.webp',
            alt,
            blurhash: '',
          })
        );
      });
    await renderFigure('first');
    const img = container.querySelector('img');
    if (!img) throw new Error('figure image missing');
    await act(async () => {
      img.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(modalPresent()).toBe(true);
    expect(keydownAdds.length).toBe(1);

    // Caption change rerenders the figure while the modal stays open.
    await renderFigure('second');
    expect(modalPresent()).toBe(true);
    expect(keydownAdds.length).toBe(1);
    expect(keydownRemoves.length).toBe(0);
  });

  it('restores a pre-existing body overflow value on close', async () => {
    document.body.style.overflow = 'hidden';
    const { root } = renderModal();
    await showModal(root, () => {});
    expect(document.body.style.overflow).toBe('hidden');

    await act(async () => {
      root.render(createElement('span'));
    });
    expect(modalPresent()).toBe(false);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores the prior value on unmount while open', async () => {
    document.body.style.overflow = 'hidden';
    const { root } = renderModal();
    await showModal(root, () => {});
    expect(modalPresent()).toBe(true);

    await act(async () => {
      root.unmount();
      roots.splice(roots.indexOf(root), 1);
    });
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('still closes on Escape', async () => {
    let closed = false;
    const { root } = renderModal();
    await showModal(root, () => {
      closed = true;
    });

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(closed).toBe(true);
  });

  it('registers wheel zoom explicitly non-passive', async () => {
    const { root } = renderModal();
    await showModal(root, () => {});
    expect(modalPresent()).toBe(true);

    // React's own delegated root listeners register wheel with a capture
    // boolean; the modal's own registration carries explicit options.
    expect(wheelRegistrations).toContainEqual({ passive: false });
  });

  it('zooms the image on wheel input and cleans up the listener', async () => {
    const { root } = renderModal();
    await showModal(root, () => {});
    const zoom = document.body.querySelector(
      '.overflow-hidden'
    ) as HTMLElement | null;
    if (!zoom) throw new Error('zoom container missing');

    await act(async () => {
      zoom.dispatchEvent(wheelEvent(-100));
    });
    const zoomed = zoom.children[1] as HTMLElement | null;
    expect(zoomed?.style.transform).toContain('scale(2)');

    const removeCalls = (
      elementRemoveSpy?.mock.calls ?? []
    ) as Array<unknown[]>;
    await act(async () => {
      root.render(createElement('span'));
    });
    expect(
      removeCalls.some((call) => call[0] === 'wheel')
    ).toBe(true);
  });
});
