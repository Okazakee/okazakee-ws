import type { HeroShape, TypewriterTarget } from '@/types/fetchedData.types';

/**
 * Hero presentation helpers (docs/DESIGN.md §3): the portrait shape presets,
 * the role line list and the typewriter label runs. Every stored value is
 * treated as untrusted — an absent or unknown one degrades to the historic
 * rendering instead of throwing or dropping the block.
 */

export const heroShapes = ['pebble', 'square', 'rounded', 'squircle'] as const;

export const typewriterTargets = ['role1', 'role2', 'all'] as const;

/** Wrapper classes for the clipped portrait, joined with the box utilities. */
const heroShapeClasses: Record<HeroShape, string> = {
  pebble: 'clip-pebble',
  square: 'overflow-hidden',
  rounded: 'overflow-hidden rounded-xl',
  squircle: 'clip-squircle',
};

/** Accent plate behind the portrait; the pebble draws its own svg path. */
const heroBackdropClasses: Record<HeroShape, string> = {
  pebble: '',
  square: '',
  rounded: 'rounded-3xl',
  squircle: 'clip-squircle',
};

export function normalizeHeroShape(
  value: string | null | undefined
): HeroShape {
  return heroShapes.find((shape) => shape === value) ?? 'pebble';
}

export function normalizeTypewriterTarget(
  value: string | null | undefined
): TypewriterTarget {
  return typewriterTargets.find((target) => target === value) ?? 'role1';
}

/** Full class list of the element wrapping the portrait image. */
export function heroPortraitClass(shape: HeroShape): string {
  return `${heroShapeClasses[shape]} relative h-full w-full`.trim();
}

/** Full class list of the accent plate behind the portrait. */
export function heroBackdropClass(shape: HeroShape): string {
  return `absolute -inset-3 z-0 ${heroBackdropClasses[shape]}`.trim();
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

/**
 * The role lines to render: `hero-section.top.roles` when the CMS list is
 * present, otherwise the singular `top.role` that predates it, so existing
 * content keeps rendering exactly as before.
 */
export function resolveHeroRoles(
  stored: unknown,
  singular: string | null | undefined
): string[] {
  const roles = toOrderedStrings(stored);
  if (roles.length > 0) return roles;
  return isFilledString(singular) ? [singular] : [];
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

/**
 * Markup for the first `revealed` characters. A full reveal is byte-identical
 * to `formatLabels(text)`, so a finished line renders exactly like the static
 * one.
 */
export function typewriterHtml(
  runs: TypewriterRun[],
  revealed: number
): string {
  let remaining = Math.max(0, revealed);
  let html = '';

  for (const run of runs) {
    if (remaining <= 0) break;
    const slice = run.text.slice(0, remaining);
    remaining -= slice.length;
    html += run.labeled ? `<label>${slice}</label>` : slice;
  }

  return html;
}

/** True when the role line at `index` is the configured typewriter target. */
export function typewritesRole(
  target: TypewriterTarget,
  index: number
): boolean {
  if (target === 'all') return true;
  return index === (target === 'role1' ? 0 : 1);
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
