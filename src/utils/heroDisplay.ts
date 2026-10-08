import type { HeroShape } from '@/types/fetchedData.types';

/**
 * Hero presentation helpers: portrait presets, ordered role lists and label
 * runs. Stored presets are treated as untrusted and unknown shapes degrade
 * to the default portrait.
 */

export const heroShapes = ['pebble', 'square', 'rounded', 'squircle'] as const;

/**
 * Corner/clip geometry of one preset. The SAME class drives the accent plate
 * and the image mask, so the two outlines stay concentric and the ring between
 * them keeps a constant width.
 */
const heroShapeClasses: Record<HeroShape, string> = {
  pebble: 'clip-pebble',
  square: '',
  // A share of the portrait box, so the radius scales with it and stays
  // distinct from both `square` and `squircle`. A fixed `rounded-xl` (12px) is
  // 4.6% of a 260px portrait and reads as a square.
  rounded: 'rounded-[15%]',
  squircle: 'clip-squircle',
};

/**
 * Accent ring width, as a share of the portrait box (2.15% = 5.6px at the
 * 260px desktop size). The mask is inset by it inside the plate.
 */
const heroRingInset = 'inset-[2.15%]';

export function normalizeHeroShape(
  value: string | null | undefined
): HeroShape {
  return heroShapes.find((shape) => shape === value) ?? 'pebble';
}

/** Full class list of the element wrapping the portrait image. */
export function heroPortraitClass(shape: HeroShape): string {
  // `absolute` is load-bearing: the mask is positioned by its inset ring.
  return `absolute ${heroRingInset} overflow-hidden ${heroShapeClasses[shape]}`.trim();
}

/** Full class list of the accent plate behind the portrait. */
export function heroBackdropClass(shape: HeroShape): string {
  return `absolute inset-0 z-0 bg-accent-violet ${heroShapeClasses[shape]}`.trim();
}

export type TypewriterRun = { text: string; labeled: boolean };

const labelPattern = /\*\*\*\*([^*]+)\*\*\*\*/g;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFilledString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function toOrderedStrings(value: unknown): string[] {
  if (typeof value === 'string') return isFilledString(value) ? [value] : [];
  if (Array.isArray(value)) return value.filter(isFilledString);
  if (isPlainObject(value)) {
    return Object.keys(value)
      .filter((key) => /^(0|[1-9]\d*)$/.test(key))
      .sort((a, b) => Number(a) - Number(b))
      .map((key) => value[key])
      .filter(isFilledString);
  }
  return [];
}

/** Ordered localized roles; blank entries never enter the animation. */
export function resolveHeroRoles(stored: unknown): string[] {
  return toOrderedStrings(stored);
}

/** Splits `****text****` runs from plain ones, in document order. */
export function parseTypewriterRuns(text: string): TypewriterRun[] {
  const runs: TypewriterRun[] = [];
  let cursor = 0;

  for (const match of text.matchAll(labelPattern)) {
    const start = match.index;
    if (start > cursor) {
      runs.push({ text: text.slice(cursor, start), labeled: false });
    }
    runs.push({ text: match[1] as string, labeled: true });
    cursor = start + match[0].length;
  }

  if (cursor < text.length) {
    runs.push({ text: text.slice(cursor), labeled: false });
  }

  return runs;
}

export function typewriterLength(runs: TypewriterRun[]): number {
  let total = 0;
  for (const run of runs) total += run.text.length;
  return total;
}
/** Character positions of words repeated across two or more role lines. */
export function sharedTypewriterWords(roles: string[]): number[][] {
  const lines = roles.map((role) =>
    parseTypewriterRuns(role)
      .map((run) => run.text)
      .join('')
  );
  const wordCounts: Record<string, number> = {};
  for (const text of lines) {
    const words = new Set(
      [...text.matchAll(/[\p{L}\p{N}_]+/gu)].map((match) =>
        match[0].toLowerCase()
      )
    );
    for (const word of words) wordCounts[word] = (wordCounts[word] ?? 0) + 1;
  }
  return lines.map((text) => {
    const positions: number[] = [];
    for (const match of text.matchAll(/[\p{L}\p{N}_]+/gu)) {
      if ((wordCounts[match[0].toLowerCase()] ?? 0) > 1) {
        if (match.index > 0 && /\s/.test(text[match.index - 1])) {
          positions.push(match.index - 1);
        }
        for (
          let index = match.index;
          index < match.index + match[0].length;
          index += 1
        ) {
          positions.push(index);
        }
      }
    }
    return positions;
  });
}

export function typewriterStep(
  position: number,
  direction: 1 | -1,
  length: number,
  sharedPositions: number[]
): number {
  let next = position + direction;
  while (
    next >= 0 &&
    next < length &&
    sharedPositions.includes(next)
  ) {
    next += direction;
  }
  return Math.max(0, Math.min(length, next));
}

/**
 * Markup for the revealed prefix plus shared words. The cursor stays at the
 * animation boundary instead of after always-visible text.
 */
export function typewriterHtml(
  runs: TypewriterRun[],
  revealed: number,
  cursorClass?: string,
  sharedPositions: number[] = []
): string {
  let position = 0;
  let html = '';
  const cursor = cursorClass
    ? `<span class="${cursorClass}" aria-hidden="true"></span>`
    : '';
  for (const run of runs) {
    let content = '';
    for (const char of run.text) {
      if (position === revealed) content += cursor;
      if (position < revealed || sharedPositions.includes(position)) {
        content += char;
      }
      position += 1;
    }
    if (content) html += run.labeled ? `<label>${content}</label>` : content;
  }
  if (position === revealed) html += cursor;
  return html;
}

// Superellipse (|x|^4 + |y|^4 = 1) sampled as an objectBoundingBox path, so
// the CSS `clip-squircle` utility scales with the portrait exactly like
// `clip-pebble` scales with the clipPath defined inline by the Hero.
const squircleExponent = 4;
const squircleQuadrantSamples = 24;

let squircleClipPathCache: string | null = null;

export function squircleClipPath(): string {
  if (squircleClipPathCache) return squircleClipPathCache;

  const points: string[] = [];
  const total = squircleQuadrantSamples * 4;

  for (let index = 0; index < total; index++) {
    // Sampled from the top centre so the path starts where a reader expects.
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const x = Math.sign(cosine) * Math.abs(cosine) ** (2 / squircleExponent);
    const y = Math.sign(sine) * Math.abs(sine) ** (2 / squircleExponent);
    points.push(`${((x + 1) / 2).toFixed(3)},${((y + 1) / 2).toFixed(3)}`);
  }

  squircleClipPathCache = `M ${points.join(' L ')} Z`;
  return squircleClipPathCache;
}
