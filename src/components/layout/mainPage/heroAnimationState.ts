/**
 * Document-scoped state for the hero signature animation.
 *
 * A language switch remounts the whole [locale] subtree, matrix and role
 * line included. This module — not component state — owns the running
 * animation, so a switch adopts the live session instead of restarting it:
 * rain columns keep falling from their positions, the LCG cursor continues
 * the respawn sequence, live pings survive, the entrance epoch keeps its
 * reveal wave traveling, and each role line resumes its reveal from the
 * current character. A reload is a new document and a new module instance,
 * so the entrance signature plays again from zero.
 *
 * Deliberately in-memory, not browser storage: `born` timestamps live on the
 * document timeline (performance.now), which a reload restarts, and a fresh
 * reload should play the entrance anyway.
 */

export interface RainColumn {
  y: number;
  speed: number;
  len: number;
  seed: number;
  lead: number;
  born: number;
}

export interface Ping {
  x: number;
  y: number;
  born: number;
  life: number;
  distances: Float64Array;
  radius: number;
  fade: number;
}

export interface HeroMatrixState {
  /** Timeline epoch the entrance reveal started from; survives remounts. */
  entranceT0: number;
  /** LCG cursor, so respawn randomness continues where it left off. */
  seed: number;
  /** Live columns and click pings; mutated in place by the render loop. */
  matCols: RainColumn[];
  pings: Ping[];
  /** Grid the columns were seeded for; a different grid re-seeds them. */
  cols: number;
  rows: number;
}

export interface TypewriterPhase {
  typed: number;
  erasing: boolean;
}

/** Shared LCG initial state for the matrix field and its jitter table. */
export const HERO_SEED = 0x9451ff;

/**
 * Reveal phase per role-line slot (the line's index in the hero role list).
 * Present means a remount continues from that character; absent plays from
 * the start.
 */
export const typewriterPhases = new Map<number, TypewriterPhase>();

let matrixState: HeroMatrixState | null = null;

/** Fresh document state: the entrance reveal starts now. */
export function createHeroMatrixState(): HeroMatrixState {
  return {
    entranceT0: performance.now(),
    seed: HERO_SEED,
    matCols: [],
    pings: [],
    cols: 0,
    rows: 0,
  };
}

/** The shared hero session for the current document. */
export function heroMatrixState(): HeroMatrixState {
  matrixState ??= createHeroMatrixState();
  return matrixState;
}
