import { describe, expect, it } from 'vitest';
import {
  createKeystrokePacer,
  type KeystrokePacer,
  keystrokeSeed,
  typewriterHoldMs,
  typewriterStartMs,
} from '@/utils/typewriterPacing';

const sample = 'Full-stack Developer, shipping things.';

const mean = (values: number[]) =>
  values.reduce((total, value) => total + value, 0) / values.length;

describe('keystroke pacing', () => {
  it('never types at a constant speed', () => {
    const pacer = createKeystrokePacer();
    const delays = [...sample].map((char) => pacer.typingDelay(char));

    expect(new Set(delays).size).toBeGreaterThan(delays.length * 0.6);
    expect(Math.max(...delays) - Math.min(...delays)).toBeGreaterThan(90);
  });

  it('keeps every keystroke inside the window it documents', () => {
    const pacer = createKeystrokePacer();

    for (const char of sample.repeat(8)) {
      const delay = pacer.typingDelay(char);
      expect(delay).toBeGreaterThanOrEqual(30);
      expect(delay).toBeLessThanOrEqual(800);
    }
  });

  it('gives a space and a punctuation mark their own beat', () => {
    const pacer = createKeystrokePacer();
    const gaps: number[] = [];
    const punctuationMarks: number[] = [];

    for (const char of sample.repeat(12)) {
      const delay = pacer.typingDelay(char);
      if (char === ' ') gaps.push(delay);
      if (/[.,;:!?]/.test(char)) punctuationMarks.push(delay);
    }

    // A burst never swallows the beat: the floor is the base key plus the beat.
    expect(gaps.length).toBeGreaterThan(30);
    expect(punctuationMarks.length).toBeGreaterThan(10);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(52 + 55);
    expect(Math.min(...punctuationMarks)).toBeGreaterThanOrEqual(52 + 90);
    expect(mean(punctuationMarks)).toBeGreaterThan(mean(gaps));
  });

  it('backspaces faster than it types, with a reach on the first key', () => {
    const pacer = createKeystrokePacer();
    const reach = Array.from({ length: 24 }, () => pacer.backspaceReachDelay());
    const backspaces = Array.from({ length: 24 }, () => pacer.backspaceDelay());
    const keystrokes = Array.from(
      { length: 60 },
      (_, index) => pacer.typingDelay('aeiou'[index % 5])
    );

    for (const delay of reach) expect(delay).toBeGreaterThanOrEqual(120);
    for (const delay of backspaces) expect(delay).toBeLessThanOrEqual(52);
    expect(mean(backspaces)).toBeLessThan(mean(keystrokes));
  });

  it('holds a finished role for four seconds and breathes before the next', () => {
    const pacer = createKeystrokePacer();

    expect(typewriterHoldMs).toBe(4000);
    expect(typewriterStartMs).toBeGreaterThan(0);
    for (let index = 0; index < 24; index += 1) {
      const gap = pacer.nextRoleDelay();
      expect(gap).toBeGreaterThanOrEqual(320);
      expect(gap).toBeLessThanOrEqual(560);
    }
  });

  it('authors one rhythm instead of a random one per visitor', () => {
    const first = createKeystrokePacer(keystrokeSeed);
    const second = createKeystrokePacer(keystrokeSeed);
    const other = createKeystrokePacer(keystrokeSeed + 1);

    const delays = (pacer: KeystrokePacer) =>
      [...sample].map((char) => pacer.typingDelay(char));

    expect(delays(second)).toEqual(delays(first));
    expect(delays(other)).not.toEqual(delays(first));
  });
});
