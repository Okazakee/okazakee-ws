/**
 * Keystroke pacing for the hero typewriter (docs/DESIGN.md §3).
 *
 * A constant interval reads as a machine. Typing has a rhythm: a floor and
 * jitter per key, a beat after a space or a piece of punctuation, short bursts
 * when a run of keys comes easily, and the odd pause while the next word is
 * decided. Backspacing has its own, quicker rhythm, with a beat on the first
 * key while the hand moves over to it.
 *
 * Delays come from a seeded LCG — the generator the hero matrix already uses —
 * rather than Math.random: the animation then has one authored rhythm instead
 * of a different one per visitor, and tests advance timers on exact
 * boundaries without stubbing randomness.
 */

/** Seed for the shared keystroke rhythm (the value the hero matrix opens with). */
export const keystrokeSeed = 0x9451ff;

/** Wait before the first keystroke of a freshly mounted line. */
export const typewriterStartMs = 420;

/** A finished role stays on screen this long before it is erased. */
export const typewriterHoldMs = 4000;

const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;
const UNIT = 1 / 4294967296;

/** Floor and jitter of an ordinary key. */
const keyStroke = { min: 52, max: 118 };
/** A short run of keys that come easily. */
const burst = { keys: 2, chance: 0.22, min: 30, max: 46 };
/** Beat after a space (the hand leaves one word for the next). */
const afterSpace = { min: 55, max: 150 };
/** Beat after punctuation. */
const afterPunctuation = { min: 90, max: 260 };
/** Small beat inside a compound word (`full-stack`, `don't`). */
const afterWordBreak = { min: 18, max: 60 };
/** Occasional pause while the next words are decided. */
const hesitation = { chance: 0.05, min: 180, max: 420 };
/** Backspacing: quicker than typing. */
const backspace = { min: 26, max: 52 };
/** The first backspace, while the hand reaches for the key. */
const backspaceReach = { min: 120, max: 240 };
/** Gap between an erased role and the next one's first keystroke. */
const nextRole = { min: 320, max: 560 };

const punctuation = /[.,;:!?]/;
const wordBreak = /['’-]/;

export interface KeystrokePacer {
  /** Delay after revealing `char`, before the next character appears. */
  typingDelay(char: string): number;
  /** The first backspace of a role: the hand reaches over to the key. */
  backspaceReachDelay(): number;
  /** Every backspace after that one. */
  backspaceDelay(): number;
  /** Delay after a role is fully erased, before the next one starts. */
  nextRoleDelay(): number;
}

export function createKeystrokePacer(seed: number = keystrokeSeed): KeystrokePacer {
  let state = seed >>> 0;
  let burstLeft = 0;

  const unit = () => {
    state = (state * LCG_MULTIPLIER + LCG_INCREMENT) >>> 0;
    return state * UNIT;
  };
  const between = ({ min, max }: { min: number; max: number }) =>
    min + Math.round(unit() * (max - min));

  return {
    typingDelay(char) {
      const wordGap = char === ' ';
      const ordinary = !wordGap && !punctuation.test(char) && !wordBreak.test(char);

      // A burst only ever shortens an ordinary key: a word gap or a piece of
      // punctuation still gets its beat, exactly as a hand would.
      if (ordinary && burstLeft > 0) {
        burstLeft -= 1;
        return between(burst);
      }

      let delay = between(keyStroke);
      if (wordGap) {
        delay += between(afterSpace);
      } else if (punctuation.test(char)) {
        delay += between(afterPunctuation);
      } else if (wordBreak.test(char)) {
        delay += between(afterWordBreak);
      }
      if (unit() < hesitation.chance) {
        delay += between(hesitation);
      }
      if (ordinary && unit() < burst.chance) {
        burstLeft = burst.keys;
      }

      return delay;
    },

    backspaceReachDelay() {
      return between(backspaceReach);
    },

    backspaceDelay() {
      return between(backspace);
    },

    nextRoleDelay() {
      return between(nextRole);
    },
  };
}
