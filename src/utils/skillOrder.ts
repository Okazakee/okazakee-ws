/**
 * Canonical ordering of skills and categories.
 *
 * The CMS publishes dense, zero-based category positions and skill positions
 * within each category. Unpositioned rows sort last; id is the deterministic
 * tiebreaker for both equal and missing positions.
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
