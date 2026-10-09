import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SfxLayer, SoundDefinitions } from './model';

// Dynamic imports exercise fresh loading after browser globals are replaced;
// static imports would bypass the SSR/module-initialization boundary.
beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('public SFX entrypoint', () => {
  it('imports and calls every silent method without reading browser globals', async () => {
    const names = [
      'window',
      'navigator',
      'AudioContext',
      'webkitAudioContext',
    ] as const;
    const descriptors = names.map((name) =>
      Object.getOwnPropertyDescriptor(globalThis, name)
    );
    const lookups: string[] = [];
    try {
      for (const name of names) {
        Object.defineProperty(globalThis, name, {
          configurable: true,
          get: () => {
            lookups.push(name);
            throw new Error(`Unexpected browser lookup: ${name}`);
          },
        });
      }
      const { sfx } = await import('./index');
      for (let index = 0; index < 10; index += 1) {
        sfx.tap();
        sfx.hover();
        sfx.glitch();
        sfx.matrix();
      }
      expect(lookups).toEqual([]);
    } finally {
      names.forEach((name, index) => {
        const descriptor = descriptors[index];
        if (descriptor) {
          Object.defineProperty(globalThis, name, descriptor);
        } else {
          Reflect.deleteProperty(globalThis, name);
        }
      });
    }
  });

  it('keeps the current four-method API silent even in an activated browser', async () => {
    const construct = vi.fn(
      class {
        constructor() {
          throw new Error('Silent definitions must not allocate a context');
        }
      }
    );
    const constructorLookup = vi.fn(() => construct);
    const activationLookup = vi.fn(() => true);
    vi.stubGlobal('window', {
      get AudioContext() {
        return constructorLookup();
      },
      navigator: {
        userActivation: {
          get isActive() {
            return activationLookup();
          },
        },
      },
    });
    const library = await import('./index');
    const synthesis = await import('./synthesis');
    const scheduled = vi.spyOn(synthesis, 'scheduleSound');
    for (let index = 0; index < 10; index += 1) {
      library.sfx.tap();
      library.sfx.hover();
      library.sfx.glitch();
      library.sfx.matrix();
    }
    expect(constructorLookup).not.toHaveBeenCalled();
    expect(activationLookup).not.toHaveBeenCalled();
    expect(construct).not.toHaveBeenCalled();
    expect(scheduled).not.toHaveBeenCalled();
  });

  it('does not construct or schedule a nonempty fixture when Web Audio is absent', async () => {
    const standardLookup = vi.fn(() => undefined);
    const legacyLookup = vi.fn(() => undefined);
    const unrelatedGlobalConstructor = vi.fn(
      class {
        constructor() {
          throw new Error('No supported window constructor exists');
        }
      }
    );
    vi.stubGlobal('AudioContext', unrelatedGlobalConstructor);
    vi.stubGlobal('window', {
      get AudioContext() {
        return standardLookup();
      },
      get webkitAudioContext() {
        return legacyLookup();
      },
      navigator: { userActivation: { isActive: true } },
    });
    const synthesis = await import('./synthesis');
    const scheduled = vi.spyOn(synthesis, 'scheduleSound');
    const { createSfxEngine } = await import('./engine');
    const diagnosticLayer: SfxLayer = {
      kind: 'oscillator',
      waveform: 'sine',
      frequency: { initial: 100 },
      envelope: { peak: 0.2, attack: 0.01, hold: 0, release: 0.09 },
    };
    const definitions: SoundDefinitions = {
      tap: [diagnosticLayer],
      hover: [diagnosticLayer],
      glitch: [diagnosticLayer],
      matrix: [diagnosticLayer],
    };
    const engine = createSfxEngine(definitions);
    try {
      engine.play('tap');
      engine.play('hover');
      engine.play('glitch');
      engine.play('matrix');
      expect(unrelatedGlobalConstructor).not.toHaveBeenCalled();
      expect(scheduled).not.toHaveBeenCalled();
    } finally {
      engine.dispose();
    }
  });
});
