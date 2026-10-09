// @vitest-environment happy-dom
import { act, createElement, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Dropdown, { type DropdownOption } from '@/components/common/Dropdown';

const options: DropdownOption[] = [
  { value: 'website', label: 'Website' },
  { value: 'app', label: 'Mobile app' },
  { value: 'brand', label: 'Brand identity', disabled: true },
  { value: 'other', label: 'Something else' },
];

let container: HTMLDivElement;
let root: Root;
let picked: string[];

function element(
  overrides: {
    disabled?: boolean;
    options?: DropdownOption[];
    placeholder?: string;
    value?: string;
  } = {}
): ReactElement {
  return createElement(Dropdown, {
    id: 'control',
    label: 'Project type',
    onChange: (value: string) => picked.push(value),
    options,
    value: 'website',
    ...overrides,
  });
}

async function render(node: ReactElement) {
  await act(async () => root.render(node));
}

const trigger = () =>
  container.querySelector<HTMLButtonElement>('[role="combobox"]');

const listbox = () => document.querySelector('[role="listbox"]');

const labels = () =>
  [...document.querySelectorAll<HTMLElement>('[role="option"]')].map(
    (row) => row.textContent
  );

const rowByLabel = (label: string) =>
  [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(
    (row) => row.textContent === label
  );

const activeLabel = () => {
  const id = trigger()?.getAttribute('aria-activedescendant');
  return id ? (document.getElementById(id)?.textContent ?? null) : null;
};

async function press(key: string) {
  await act(async () => {
    trigger()?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key })
    );
  });
}

async function pointerDownOn(target: Element) {
  await act(async () => {
    target.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  });
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  picked = [];
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('Dropdown', () => {
  it('shows the selected label on a closed combobox', async () => {
    await render(element());

    expect(trigger()?.textContent).toBe('Website');
    expect(trigger()?.id).toBe('control');
    expect(trigger()?.getAttribute('role')).toBe('combobox');
    expect(trigger()?.getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger()?.getAttribute('aria-expanded')).toBe('false');
    expect(trigger()?.getAttribute('aria-label')).toBe('Project type');
    expect(trigger()?.getAttribute('aria-activedescendant')).toBeNull();
    expect(listbox()).toBeNull();
  });

  it('opens on the keyboard with the selected row active', async () => {
    await render(element());
    await press('ArrowDown');

    expect(trigger()?.getAttribute('aria-expanded')).toBe('true');
    expect(trigger()?.getAttribute('aria-controls')).toBe(listbox()?.id);
    expect(labels()).toEqual([
      'Website',
      'Mobile app',
      'Brand identity',
      'Something else',
    ]);
    expect(activeLabel()).toBe('Website');
    expect(listbox()?.parentElement).toBe(document.body);
  });

  it('walks the rows with the keyboard, skipping the disabled one', async () => {
    await render(element());
    await press('Enter');

    await press('ArrowDown');
    expect(activeLabel()).toBe('Mobile app');

    await press('ArrowDown');
    expect(activeLabel()).toBe('Something else');

    await press('ArrowDown');
    expect(activeLabel()).toBe('Something else');

    await press('ArrowUp');
    await press('ArrowUp');
    expect(activeLabel()).toBe('Website');

    await press('End');
    expect(activeLabel()).toBe('Something else');
    await press('Home');
    expect(activeLabel()).toBe('Website');
  });

  it('selects with Enter, then closes and refocuses the trigger', async () => {
    await render(element());
    await press('ArrowDown');
    await press('ArrowDown');
    await press('Enter');

    expect(picked).toEqual(['app']);
    expect(listbox()).toBeNull();
    expect(trigger()?.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger());
  });

  it('closes on Escape without selecting', async () => {
    await render(element());
    await press('ArrowDown');
    await press('ArrowDown');
    await press('Escape');

    expect(picked).toEqual([]);
    expect(listbox()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('closes when a pointer lands outside the control', async () => {
    await render(element());
    await press('ArrowDown');
    expect(listbox()).not.toBeNull();

    await pointerDownOn(document.body);

    expect(listbox()).toBeNull();
  });

  it('selects on pointerdown and leaves the menu closed', async () => {
    await render(element());
    await press('ArrowDown');

    const row = rowByLabel('Mobile app');
    if (!row) throw new Error('row missing');
    await pointerDownOn(row);

    expect(picked).toEqual(['app']);
    expect(listbox()).toBeNull();
  });

  it('refuses a disabled row', async () => {
    await render(element());
    await press('ArrowDown');

    const row = rowByLabel('Brand identity');
    if (!row) throw new Error('row missing');
    expect(row.getAttribute('aria-disabled')).toBe('true');

    await pointerDownOn(row);

    expect(picked).toEqual([]);
    expect(listbox()).not.toBeNull();
    expect(activeLabel()).toBe('Website');
  });

  it('jumps to a label with letter typeahead', async () => {
    await render(element());
    await press('ArrowDown');
    await press('m');

    expect(activeLabel()).toBe('Mobile app');
  });

  it('marks the selected row and falls back to the placeholder', async () => {
    await render(element());
    await press('ArrowDown');
    expect(rowByLabel('Website')?.getAttribute('aria-selected')).toBe('true');
    expect(rowByLabel('Mobile app')?.getAttribute('aria-selected')).toBe(
      'false'
    );

    await render(element({ placeholder: 'Select', value: '' }));
    expect(trigger()?.textContent).toBe('Select');
  });

  it('stays shut while disabled', async () => {
    await render(element({ disabled: true }));
    expect(trigger()?.disabled).toBe(true);

    await press('Enter');
    await act(async () => trigger()?.click());

    expect(listbox()).toBeNull();
  });
});
