import { describe, expect, it } from 'vitest';
import { formatLabels } from '@/utils/formatLabels';
import {
  heroBackdropClass,
  heroPortraitClass,
  heroShapes,
  normalizeHeroShape,
  parseTypewriterRuns,
  resolveHeroRoles,
  sharedTypewriterWords,
  squircleClipPath,
  typewriterHtml,
  typewriterLength,
} from '@/utils/heroDisplay';

/** Geometry each preset must apply to BOTH the accent plate and the mask. */
const presetGeometry = {
  pebble: 'clip-pebble',
  square: '',
  rounded: 'rounded-[15%]',
  squircle: 'clip-squircle',
} as const;

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

  it('insets every preset by the same ring, inside a plate that fills the box', () => {
    const ringInset = 'inset-[2.15%]';

    for (const shape of heroShapes) {
      const mask = heroPortraitClass(shape);
      const plate = heroBackdropClass(shape);

      // The mask sits inside the plate by exactly the ring width…
      expect(mask).toContain('absolute');
      expect(mask).toContain(ringInset);
      expect(plate).toContain('inset-0');
      expect(plate).toContain('bg-accent-violet');
      // …clips its own overflow, so a corner radius actually applies…
      expect(mask).toContain('overflow-hidden');

      // …and both outlines share ONE geometry class, which is what keeps the
      // ring a constant width instead of drifting at the corners.
      const geometry = presetGeometry[shape];
      if (geometry) {
        expect(mask).toContain(geometry);
        expect(plate).toContain(geometry);
      }
    }
  });

  it('scales the rounded preset radius with the portrait', () => {
    // A fixed radius (`rounded-xl`, 12px) is 4.6% of a 260px portrait and
    // reads as a square, so this preset states its radius as a share.
    expect(heroPortraitClass('rounded')).toMatch(/rounded-\[\d+%\]/);
    expect(heroBackdropClass('rounded')).toMatch(/rounded-\[\d+%\]/);
  });

  it('leaves the square preset with no corner geometry at all', () => {
    for (const cls of [
      heroPortraitClass('square'),
      heroBackdropClass('square'),
    ]) {
      expect(cls).not.toMatch(/rounded|clip-/);
    }
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
  it('renders nothing for an absent or empty list', () => {
    expect(resolveHeroRoles(undefined)).toEqual([]);
    expect(resolveHeroRoles(null)).toEqual([]);
    expect(resolveHeroRoles([])).toEqual([]);
    expect(resolveHeroRoles({ 0: '' })).toEqual([]);
  });

  it('orders the stored list by index, whatever the key order', () => {
    expect(resolveHeroRoles({ 1: 'Second', 0: 'First' })).toEqual([
      'First',
      'Second',
    ]);
    expect(resolveHeroRoles(['First', 'Second'])).toEqual(['First', 'Second']);
  });

  it('drops holes left by a removed entry instead of rendering blanks', () => {
    expect(resolveHeroRoles(['First', null, ' ', 'Second'])).toEqual([
      'First',
      'Second',
    ]);
  });

  it('does not resurrect a role after the last entry is removed', () => {
    expect(resolveHeroRoles({})).toEqual([]);
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

describe('typewriter cursor boundary', () => {
  const cursorClass = 'typewriter-cursor';
  const cursor = `<span class="${cursorClass}" aria-hidden="true"></span>`;
  const italianRoles = [
    'Sviluppatore ****Full-stack****',
    'Sviluppatore ****Mobile****',
  ];
  const englishRoles = [
    'Full-stack ****Developer****',
    'Mobile ****Developer****',
  ];

  it('keeps the Italian shared prefix before the empty or resumed cursor', () => {
    const shared = sharedTypewriterWords(italianRoles);

    for (const [index, role] of italianRoles.entries()) {
      const runs = parseTypewriterRuns(role);
      for (const revealed of [0, 1, 6, 11, 12]) {
        expect(typewriterHtml(runs, revealed, cursorClass, shared[index])).toBe(
          `Sviluppatore${cursor}`
        );
      }
    }
  });

  it('follows the changing labelled Italian word while typing and erasing', () => {
    const shared = sharedTypewriterWords(italianRoles);

    for (const [index, role] of italianRoles.entries()) {
      const runs = parseTypewriterRuns(role);
      const changingWord = index === 0 ? 'Full-stack' : 'Mobile';
      const length = typewriterLength(runs);

      expect(typewriterHtml(runs, 13, cursorClass, shared[index])).toBe(
        `Sviluppatore <label>${cursor}</label>`
      );
      expect(typewriterHtml(runs, 14, cursorClass, shared[index])).toBe(
        `Sviluppatore <label>${changingWord[0]}${cursor}</label>`
      );
      expect(typewriterHtml(runs, length - 1, cursorClass, shared[index])).toBe(
        `Sviluppatore <label>${changingWord.slice(0, -1)}${cursor}</label>`
      );
      expect(typewriterHtml(runs, length, cursorClass, shared[index])).toBe(
        `Sviluppatore <label>${changingWord}</label>${cursor}`
      );
    }
  });

  it('keeps the English cursor before the stationary labelled suffix', () => {
    const shared = sharedTypewriterWords(englishRoles);

    for (const [index, role] of englishRoles.entries()) {
      const runs = parseTypewriterRuns(role);
      const changingWord = index === 0 ? 'Full-stack' : 'Mobile';

      expect(typewriterHtml(runs, 0, cursorClass, shared[index])).toBe(
        `${cursor} <label>Developer</label>`
      );
      expect(typewriterHtml(runs, 1, cursorClass, shared[index])).toBe(
        `${changingWord[0]}${cursor} <label>Developer</label>`
      );
      expect(
        typewriterHtml(runs, changingWord.length, cursorClass, shared[index])
      ).toBe(`${changingWord}${cursor} <label>Developer</label>`);
      expect(
        typewriterHtml(
          runs,
          changingWord.length + 1,
          cursorClass,
          shared[index]
        )
      ).toBe(`${changingWord} <label>${cursor}Developer</label>`);
      expect(
        typewriterHtml(runs, typewriterLength(runs), cursorClass, shared[index])
      ).toBe(`${changingWord} <label>Developer</label>${cursor}`);
    }
  });

  it('normalizes adjacent shared prefix segments across label boundaries', () => {
    const roles = [
      '****Senior**** Sviluppatore ****Full-stack****',
      '****Senior**** Sviluppatore ****Mobile****',
    ];
    const shared = sharedTypewriterWords(roles);
    const runs = parseTypewriterRuns(roles[0]);

    for (const revealed of [0, 3, 6, 9, 19]) {
      expect(typewriterHtml(runs, revealed, cursorClass, shared[0])).toBe(
        `<label>Senior</label> Sviluppatore${cursor}`
      );
    }
  });

  it('renders one trailing cursor when the entire line is stationary', () => {
    const roles = ['****Senior**** Developer', '****Senior**** Developer'];
    const shared = sharedTypewriterWords(roles);
    const runs = parseTypewriterRuns(roles[0]);
    const length = typewriterLength(runs);

    for (const revealed of [0, 3, 6, length - 1, length]) {
      expect(typewriterHtml(runs, revealed, cursorClass, shared[0])).toBe(
        `<label>Senior</label> Developer${cursor}`
      );
    }
  });

  it('preserves ordinary reveal boundaries without shared words', () => {
    const runs = parseTypewriterRuns('Hi ****there****');

    expect(typewriterHtml(runs, 0, cursorClass)).toBe(cursor);
    expect(typewriterHtml(runs, 2, cursorClass)).toBe(`Hi${cursor}`);
    expect(typewriterHtml(runs, 3, cursorClass)).toBe(
      `Hi <label>${cursor}</label>`
    );
    expect(typewriterHtml(runs, 7, cursorClass)).toBe(
      `Hi <label>ther${cursor}</label>`
    );
    expect(typewriterHtml(runs, typewriterLength(runs), cursorClass)).toBe(
      `Hi <label>there</label>${cursor}`
    );
    expect(typewriterHtml([], 0, cursorClass)).toBe(cursor);
  });
});
