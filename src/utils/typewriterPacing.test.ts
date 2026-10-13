import { describe, expect, it } from 'vitest';
import { typewriterHoldMs, typewriterStartMs } from '@/utils/typewriterPacing';

describe('typewriter pacing constants', () => {
  it('waits before the first keystroke of a freshly mounted line', () => {
    expect(typewriterStartMs).toBe(420);
  });

  it('holds a finished role for four seconds before it is erased', () => {
    expect(typewriterHoldMs).toBe(4000);
  });
});
