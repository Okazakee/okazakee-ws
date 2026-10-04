/**
 * Canonical ordering of skills inside a category.
 *
 * The CMS publishes `skills.position` (dense, 0-based, per category). A NULL
 * position means "never ordered": such rows keep their insertion order and sort
 * after every positioned row, so the fresh column never reshuffles live
 * content. The id tiebreak makes the result total and therefore stable across
 * renders.
 *
 * Mirrored by the CMS preview
 * (`okazakee-cms/src/components/common/cms/previews/canonical/skillOrder.ts`);
 * keep both copies in sync so a draft never disagrees with the site.
 */
export function sortSkillsByPosition<
  T extends {
    id: number;
    position: number | null;
  },
>(skills: readonly T[]): T[] {
  return [...skills].sort((a, b) => {
    const left = a.position ?? null;
    const right = b.position ?? null;
    if (left !== null && right !== null && left !== right) return left - right;
    if (left !== null && right === null) return -1;
    if (left === null && right !== null) return 1;
    return a.id - b.id;
  });
}
