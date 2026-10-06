/**
 * One-shot hero entrance per document lifetime (docs/DESIGN.md §3, §6).
 *
 * Locale switches remount the hero subtree, so replaying the matrix reveal
 * and the typewriter on every mount reads as a hard refresh. The first
 * mount plays; every later mount in the same document renders settled.
 *
 * Deliberately module-scoped, not sessionStorage: a reload creates a fresh
 * document and fresh eyes, so the entrance SHOULD replay. Only SPA
 * navigations (same JS context: locale switches, back/forward) skip it.
 * Co-mounted hero parts both read false on the first commit because the
 * write defers to a microtask; every later mount reads true.
 */
let heroPlayed = false;

/**
 * True on first-visit mounts: the caller should play its entrance.
 * Every later mount in this document returns false and the caller
 * renders settled.
 */
export function claimHeroEntrance(): boolean {
  if (heroPlayed) return false;
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(() => {
      heroPlayed = true;
    });
  } else {
    setTimeout(() => {
      heroPlayed = true;
    }, 0);
  }
  return true;
}
