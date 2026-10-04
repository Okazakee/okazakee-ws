import { describe, expect, it } from 'vitest';
import { formatLabels } from '@/utils/formatLabels';
import {
  heroBackdropClass,
  heroPortraitClass,
  normalizeHeroShape,
  normalizeTypewriterTarget,
  parseTypewriterRuns,
  resolveHeroRoles,
  squircleClipPath,
  typewriterHtml,
  typewriterLength,
  typewritesRole,
} from '@/utils/heroDisplay';

describe('portrait shape presets', () => {
  it('keeps every stored preset', () => {
    for (const shape of ['pebble', 'square', 'rounded', 'squircle'] as const) {
      expect(normalizeHeroShape(shape)).toBe(shape);
    }
  });

  it('falls back to the pebble for absent, blank and unknown values', () => {
    expect(normalizeHeroShape(null)).toBe('pebble');
    expect(normalizeHeroShape(undefined)).toBe('pebble');
    expect(normalizeHeroShape('')).toBe('pebble');
    expect(normalizeHeroShape('hexagon')).toBe('pebble');
  });

  it('clips the pebble portrait exactly as before the presets existed', () => {
    expect(heroPortraitClass('pebble')).toBe(
      'clip-pebble relative h-full w-full'
    );
  });

  it('clips the other presets with the site clip-path idiom', () => {
    expect(heroPortraitClass('square')).toBe(
      'overflow-hidden relative h-full w-full'
    );
    expect(heroPortraitClass('rounded')).toBe(
      'overflow-hidden rounded-xl relative h-full w-full'
    );
    expect(heroPortraitClass('squircle')).toBe(
      'clip-squircle relative h-full w-full'
    );
    expect(heroBackdropClass('squircle')).toBe(
      'absolute -inset-3 z-0 clip-squircle'
    );
  });

  it('samples the squircle clip inside the object bounding box', () => {
    const path = squircleClipPath();
    expect(path.startsWith('M ')).toBe(true);
    expect(path.endsWith(' Z')).toBe(true);
    const points = path
      .slice(2, -2)
      .split(' L ')
      .map((pair) => pair.split(','));
    expect(points).toHaveLength(96);
    for (const [x, y] of points) {
      expect(Number(x)).toBeGreaterThanOrEqual(0);
      expect(Number(x)).toBeLessThanOrEqual(1);
      expect(Number(y)).toBeGreaterThanOrEqual(0);
      expect(Number(y)).toBeLessThanOrEqual(1);
    }
  });
});

describe('hero role list', () => {
  it('renders the singular role when no list was ever written', () => {
    expect(resolveHeroRoles(undefined, 'Fullstack Developer')).toEqual([
      'Fullstack Developer',
    ]);
    expect(resolveHeroRoles(null, 'Fullstack Developer')).toEqual([
      'Fullstack Developer',
    ]);
    expect(resolveHeroRoles([], 'Fullstack Developer')).toEqual([
      'Fullstack Developer',
    ]);
    expect(resolveHeroRoles({ 0: '' }, 'Fullstack Developer')).toEqual([
      'Fullstack Developer',
    ]);
  });

  it('orders the stored list by index, whatever the key order', () => {
    expect(resolveHeroRoles({ 1: 'Second', 0: 'First' }, 'Legacy')).toEqual([
      'First',
      'Second',
    ]);
    expect(resolveHeroRoles(['First', 'Second'], 'Legacy')).toEqual([
      'First',
      'Second',
    ]);
  });

  it('drops holes left by a removed entry instead of rendering blanks', () => {
    expect(resolveHeroRoles(['First', null, '', 'Second'], 'Legacy')).toEqual([
      'First',
      'Second',
    ]);
  });

  it('renders nothing when neither source holds copy', () => {
    expect(resolveHeroRoles(undefined, '')).toEqual([]);
    expect(resolveHeroRoles([], null)).toEqual([]);
  });
});

describe('typewriter targets', () => {
  it('falls back to the first role for an unknown target', () => {
    expect(normalizeTypewriterTarget(null)).toBe('role1');
    expect(normalizeTypewriterTarget('role9')).toBe('role1');
    expect(normalizeTypewriterTarget('role2')).toBe('role2');
    expect(normalizeTypewriterTarget('all')).toBe('all');
  });

  it('animates only the chosen line', () => {
    expect([0, 1, 2].map((index) => typewritesRole('role1', index))).toEqual([
      true,
      false,
      false,
    ]);
    expect([0, 1, 2].map((index) => typewritesRole('role2', index))).toEqual([
      false,
      true,
      false,
    ]);
    expect([0, 1, 2].map((index) => typewritesRole('all', index))).toEqual([
      true,
      true,
      true,
    ]);
  });
});

describe('typewriter label runs', () => {
  const samples = [
    'Fullstack Developer',
    '****Fullstack**** Developer',
    'Senior ****Fullstack Developer****',
    'a ****b**** c ****d**** e',
    '',
  ];

  it('reproduces formatLabels once every character is revealed', () => {
    for (const text of samples) {
      const runs = parseTypewriterRuns(text);
      expect(typewriterHtml(runs, typewriterLength(runs))).toBe(
        formatLabels(text)
      );
    }
  });

  it('reveals the labelled runs character by character', () => {
    const runs = parseTypewriterRuns('Hi ****there****');
    expect(typewriterHtml(runs, 0)).toBe('');
    expect(typewriterHtml(runs, 2)).toBe('Hi');
    expect(typewriterHtml(runs, 7)).toBe('Hi <label>ther</label>');
    expect(typewriterHtml(runs, 99)).toBe('Hi <label>there</label>');
  });

  it('never renders a negative reveal', () => {
    expect(typewriterHtml(parseTypewriterRuns('abc'), -4)).toBe('');
  });
});
