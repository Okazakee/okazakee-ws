/**
 * Keystroke timing for the hero typewriter (docs/DESIGN.md §3).
 *
 * The reveal runs on fixed intervals owned by `RoleTypewriter` (80ms a
 * key, 40ms a backspace, 320ms before the next role); only the mount
 * lead-in and the hold live here so tests and the component share the
 * exact production values.
 */

/** Wait before the first keystroke of a freshly mounted line. */
export const typewriterStartMs = 420;

/** A finished role stays on screen this long before it is erased. */
export const typewriterHoldMs = 4000;
