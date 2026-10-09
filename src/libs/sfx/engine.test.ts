import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { createSfxEngine } from './engine';
import type { SfxEngine, SfxEnvironment } from './engine';
import type { SfxLayer, SfxName, SoundDefinitions } from './model';
import { scheduleSound } from './synthesis';

vi.mock('./synthesis', () => ({ scheduleSound: vi.fn() }));

// Only the engine's lifecycle boundary is represented, not an audio graph.
class ContextStateStub extends EventTarget {
  state: AudioContextState | 'interrupted';
  private clock = 0;
  resume = vi.fn(() => Promise.resolve());
  close = vi.fn(() => {
    this.transition('closed');
    return Promise.resolve();
  });

  constructor(state: AudioContextState | 'interrupted' = 'running') {
    super();
    this.state = state;
  }

  get currentTime(): number {
    return this.clock;
  }

  set currentTime(value: number) {
    this.clock = value;
  }

  transition(state: AudioContextState | 'interrupted'): void {
    this.state = state;
    this.dispatchEvent(new Event('statechange'));
  }
}

function contextConstructor() {
  const construct = vi.fn();
  class Context extends ContextStateStub {
    constructor() {
      super();
      construct();
    }
  }
  return { Context, construct };
}

interface VoiceWitness {
  finish: () => void;
  stop: Mock<() => void>;
}

const layer: SfxLayer = {
  kind: 'oscillator',
  waveform: 'sine',
  frequency: { initial: 100 },
  envelope: { peak: 0.2, attack: 0.01, hold: 0, release: 0.09 },
};

function definitions(
  counts: Partial<Record<SfxName, number>> = {}
): SoundDefinitions {
  return {
    tap: Array.from({ length: counts.tap ?? 1 }, () => layer),
    hover: Array.from({ length: counts.hover ?? 1 }, () => layer),
    glitch: Array.from({ length: counts.glitch ?? 1 }, () => layer),
    matrix: Array.from({ length: counts.matrix ?? 1 }, () => layer),
  };
}

function deferredResume() {
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function voiceWitness(onEnded: () => void): VoiceWitness {
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    onEnded();
  };
  return { finish, stop: vi.fn(finish) };
}

let voices: VoiceWitness[];
let engines: SfxEngine[];

function engine(
  sounds: SoundDefinitions = definitions(),
  environment?: SfxEnvironment
): SfxEngine {
  const instance = createSfxEngine(sounds, environment);
  engines.push(instance);
  return instance;
}

function harness(
  sounds: SoundDefinitions = definitions(),
  context = new ContextStateStub()
) {
  let eligible = true;
  const createContext = vi.fn(() => context as unknown as AudioContext);
  const canUnlock = vi.fn(() => eligible);
  return {
    context,
    createContext,
    canUnlock,
    engine: engine(sounds, { createContext, canUnlock }),
    setEligible: (value: boolean) => {
      eligible = value;
    },
  };
}

beforeEach(() => {
  voices = [];
  engines = [];
  vi.mocked(scheduleSound).mockReset();
  vi.mocked(scheduleSound).mockImplementation(
    (_context, _sound, _at, onEnded) => {
      const voice = voiceWitness(onEnded);
      voices.push(voice);
      return voice;
    }
  );
});

afterEach(() => {
  for (const instance of engines) instance.dispose();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('SFX context lifecycle', () => {
  it('prepares silently and drops gestureless requests before context creation', () => {
    const h = harness();
    const addListener = vi.spyOn(h.context, 'addEventListener');
    h.setEligible(false);
    h.engine.play('hover');
    h.engine.play('glitch');
    expect(h.createContext).not.toHaveBeenCalled();
    expect(voices).toHaveLength(0);

    h.setEligible(true);
    h.engine.play('tap');
    expect(h.createContext).toHaveBeenCalledTimes(1);
    expect(voices).toHaveLength(1);
    expect(h.context.resume).not.toHaveBeenCalled();

    h.setEligible(false);
    h.engine.play('hover');
    h.engine.play('matrix');
    expect(h.createContext).toHaveBeenCalledTimes(1);
    expect(voices).toHaveLength(3);
    expect(addListener).toHaveBeenCalledTimes(1);
  });

  it('does not consult the environment or audio clock for empty definitions', () => {
    const h = harness(definitions({ tap: 0, hover: 0, glitch: 0, matrix: 0 }));
    const clock = vi.spyOn(h.context, 'currentTime', 'get');
    for (const name of ['tap', 'hover', 'glitch', 'matrix'] as const) {
      h.engine.play(name);
    }
    expect(h.canUnlock).not.toHaveBeenCalled();
    expect(h.createContext).not.toHaveBeenCalled();
    expect(h.context.resume).not.toHaveBeenCalled();
    expect(clock).not.toHaveBeenCalled();
    expect(voices).toHaveLength(0);
  });

  it('coalesces pending resumes and never replays dropped requests', async () => {
    const context = new ContextStateStub('suspended');
    const pending = deferredResume();
    context.resume.mockReturnValue(pending.promise);
    const h = harness(definitions(), context);
    h.engine.play('tap');
    h.engine.play('matrix');
    h.engine.play('hover');
    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(voices).toHaveLength(0);

    context.transition('running');
    pending.resolve();
    await pending.promise;
    expect(voices).toHaveLength(0);
    h.setEligible(false);
    h.engine.play('tap');
    expect(voices).toHaveLength(1);
    expect(h.createContext).toHaveBeenCalledTimes(1);
  });

  it('retries a rejected unlock only on a later eligible request', async () => {
    const context = new ContextStateStub('suspended');
    const pending = deferredResume();
    context.resume.mockReturnValueOnce(pending.promise);
    const h = harness(definitions(), context);
    h.engine.play('tap');
    pending.reject(new Error('device locked'));
    await Promise.resolve();
    expect(voices).toHaveLength(0);

    h.setEligible(false);
    h.engine.play('hover');
    expect(context.resume).toHaveBeenCalledTimes(1);
    h.setEligible(true);
    h.engine.play('matrix');
    expect(context.resume).toHaveBeenCalledTimes(2);
    expect(voices).toHaveLength(0);
    context.transition('running');
    h.engine.play('matrix');
    expect(voices).toHaveLength(1);
  });

  it('recovers after synchronous resume failure without scheduling the trigger', () => {
    const context = new ContextStateStub('suspended');
    context.resume.mockImplementationOnce(() => {
      throw new Error('audio device lost');
    });
    const h = harness(definitions(), context);
    h.engine.play('tap');
    h.engine.play('tap');
    expect(context.resume).toHaveBeenCalledTimes(2);
    expect(voices).toHaveLength(0);
    context.transition('running');
    h.engine.play('tap');
    expect(voices).toHaveLength(1);
  });

  it.each(['suspended', 'interrupted'] as const)(
    'cancels active and delayed voices on %s and resets admission',
    (state) => {
      const delayed = { ...layer, delay: 1 };
      const h = harness({
        tap: Array.from({ length: 32 }, () => delayed),
        hover: [layer],
        glitch: [layer],
        matrix: [layer],
      });
      h.engine.play('tap');
      h.context.transition(state);
      expect(voices[0].stop).toHaveBeenCalledTimes(1);
      h.setEligible(false);
      h.engine.play('tap');
      expect(h.context.resume).not.toHaveBeenCalled();
      expect(voices).toHaveLength(1);

      h.context.transition('running');
      h.engine.play('tap');
      expect(voices).toHaveLength(2);
      voices[0].finish();
      h.engine.play('hover');
      expect(voices).toHaveLength(2);
    }
  );

  it('replaces a closed context without leaking pending resume state', async () => {
    const first = new ContextStateStub('suspended');
    const second = new ContextStateStub('suspended');
    const firstResume = deferredResume();
    const secondResume = deferredResume();
    first.resume.mockReturnValue(firstResume.promise);
    second.resume.mockReturnValue(secondResume.promise);
    const removeFirstListener = vi.spyOn(first, 'removeEventListener');
    const createContext = vi
      .fn<() => AudioContext | null>()
      .mockReturnValueOnce(first as unknown as AudioContext)
      .mockReturnValueOnce(second as unknown as AudioContext);
    const instance = engine(definitions(), {
      createContext,
      canUnlock: () => true,
    });
    instance.play('tap');
    first.transition('closed');
    expect(removeFirstListener).toHaveBeenCalledTimes(1);
    instance.play('tap');
    expect(createContext).toHaveBeenCalledTimes(2);
    expect(second.resume).toHaveBeenCalledTimes(1);

    firstResume.resolve();
    await firstResume.promise;
    instance.play('matrix');
    expect(second.resume).toHaveBeenCalledTimes(1);
    expect(voices).toHaveLength(0);
    second.transition('running');
    secondResume.resolve();
    await secondResume.promise;
    expect(voices).toHaveLength(0);
    instance.play('tap');
    first.transition('interrupted');
    expect(voices).toHaveLength(1);
    expect(voices[0].stop).not.toHaveBeenCalled();
  });

  it('drops gestureless requests after a closed context instead of replacing it', () => {
    const h = harness();
    h.engine.play('tap');
    h.context.transition('closed');
    expect(voices[0].stop).toHaveBeenCalledTimes(1);
    h.setEligible(false);
    h.engine.play('hover');
    expect(h.createContext).toHaveBeenCalledTimes(1);
    expect(voices).toHaveLength(1);
  });

  it('detaches, stops and closes on dispose, then allows lazy reuse', async () => {
    const first = new ContextStateStub();
    const second = new ContextStateStub();
    const removeListener = vi.spyOn(first, 'removeEventListener');
    first.close.mockRejectedValueOnce(new Error('close unavailable'));
    const createContext = vi
      .fn<() => AudioContext | null>()
      .mockReturnValueOnce(first as unknown as AudioContext)
      .mockReturnValueOnce(second as unknown as AudioContext);
    const instance = engine(definitions({ tap: 32 }), {
      createContext,
      canUnlock: () => true,
    });
    instance.play('tap');
    instance.dispose();
    instance.dispose();
    await Promise.resolve();
    expect(voices[0].stop).toHaveBeenCalledTimes(1);
    expect(removeListener).toHaveBeenCalledTimes(1);
    expect(first.close).toHaveBeenCalledTimes(1);
    instance.play('tap');
    expect(createContext).toHaveBeenCalledTimes(2);
    expect(voices).toHaveLength(2);
    first.transition('suspended');
    expect(voices[1].stop).not.toHaveBeenCalled();
  });

  it('clears a disposed pending resume without touching a new context', async () => {
    const first = new ContextStateStub('suspended');
    const second = new ContextStateStub('suspended');
    const oldResume = deferredResume();
    const newResume = deferredResume();
    first.resume.mockReturnValue(oldResume.promise);
    second.resume.mockReturnValue(newResume.promise);
    const createContext = vi
      .fn<() => AudioContext | null>()
      .mockReturnValueOnce(first as unknown as AudioContext)
      .mockReturnValueOnce(second as unknown as AudioContext);
    const instance = engine(definitions(), {
      createContext,
      canUnlock: () => true,
    });
    instance.play('tap');
    instance.dispose();
    instance.play('tap');
    oldResume.reject(new Error('old context closed'));
    await Promise.resolve();
    instance.play('tap');
    expect(second.resume).toHaveBeenCalledTimes(1);
    expect(voices).toHaveLength(0);
    second.transition('running');
    newResume.resolve();
    await newResume.promise;
    instance.play('tap');
    expect(voices).toHaveLength(1);
  });
});

describe('SFX resource admission', () => {
  it('counts source layers, refuses overflow without stealing, and releases on end', () => {
    const h = harness(definitions({ tap: 16, hover: 16, glitch: 1 }));
    h.engine.play('tap');
    h.engine.play('hover');
    h.engine.play('glitch');
    expect(voices).toHaveLength(2);
    expect(voices.every((voice) => voice.stop.mock.calls.length === 0)).toBe(
      true
    );

    voices[0].finish();
    h.engine.play('glitch');
    expect(voices).toHaveLength(3);
    voices[0].finish();
    h.context.currentTime = 0.04;
    h.engine.play('tap');
    expect(voices).toHaveLength(3);
    voices[1].finish();
    h.engine.play('tap');
    expect(voices).toHaveLength(4);
  });

  it('drops oversized definitions without truncating or consuming another name', () => {
    const h = harness(definitions({ tap: 33, hover: 32 }));
    h.engine.play('tap');
    expect(voices).toHaveLength(0);
    h.engine.play('hover');
    expect(voices).toHaveLength(1);
    expect(voices[0].stop).not.toHaveBeenCalled();
  });

  it('enforces the 40ms audio-clock cooldown independently for all four names', () => {
    const h = harness();
    for (const name of ['tap', 'hover', 'glitch', 'matrix'] as const) {
      h.engine.play(name);
      h.engine.play(name);
    }
    expect(voices).toHaveLength(4);
    h.context.currentTime = 0.039;
    for (const name of ['tap', 'hover', 'glitch', 'matrix'] as const) {
      h.engine.play(name);
    }
    expect(voices).toHaveLength(4);
    h.context.currentTime = 0.04;
    for (const name of ['tap', 'hover', 'glitch', 'matrix'] as const) {
      h.engine.play(name);
    }
    expect(voices).toHaveLength(8);
  });

  it('bounds rapid triggering even when the audio clock advances', () => {
    const h = harness(definitions({ tap: 4 }));
    for (let index = 0; index < 100; index += 1) {
      h.context.currentTime = index;
      h.engine.play('tap');
    }
    expect(voices).toHaveLength(8);
    expect(voices.every((voice) => voice.stop.mock.calls.length === 0)).toBe(
      true
    );
    voices[0].finish();
    h.engine.play('tap');
    expect(voices).toHaveLength(9);
  });

  it('reclaims failed reservations without refunding any admitted cooldown', () => {
    const h = harness(definitions({ tap: 32 }));
    h.engine.play('hover');
    voices[0].finish();
    vi.mocked(scheduleSound).mockImplementationOnce(() => {
      throw new Error('native graph scheduling failed');
    });
    h.engine.play('tap');
    h.engine.play('tap');
    h.engine.play('hover');
    expect(scheduleSound).toHaveBeenCalledTimes(2);
    expect(voices).toHaveLength(1);

    h.engine.play('glitch');
    expect(voices).toHaveLength(2);
    voices[1].finish();
    h.context.currentTime = 0.04;
    h.engine.play('tap');
    expect(voices).toHaveLength(3);
    h.engine.play('hover');
    expect(voices).toHaveLength(3);
  });

  it('does not strand slots when synthesis completes synchronously', () => {
    const h = harness(definitions({ tap: 32, hover: 32 }));
    vi.mocked(scheduleSound).mockImplementationOnce(
      (_context, _sound, _at, onEnded) => {
        const voice = voiceWitness(onEnded);
        voices.push(voice);
        voice.finish();
        return voice;
      }
    );
    h.engine.play('tap');
    h.engine.play('hover');
    expect(voices).toHaveLength(2);
  });

  it('cleans a voice returned after synchronous interruption during scheduling', () => {
    const h = harness(definitions({ tap: 32 }));
    vi.mocked(scheduleSound).mockImplementationOnce(
      (_context, _sound, _at, onEnded) => {
        const voice = voiceWitness(onEnded);
        voices.push(voice);
        h.context.transition('interrupted');
        return voice;
      }
    );
    h.engine.play('tap');
    expect(voices[0].stop).toHaveBeenCalledTimes(1);
    h.context.transition('running');
    h.engine.play('tap');
    expect(voices).toHaveLength(2);
  });
});

describe('SFX runtime browser detection', () => {
  it('uses transient activation rather than sound-name fallback when available', () => {
    const activation = { isActive: false };
    const { Context, construct } = contextConstructor();
    vi.stubGlobal('window', {
      AudioContext: Context,
      navigator: { userActivation: activation },
    });
    const instance = engine();
    instance.play('tap');
    instance.play('matrix');
    expect(construct).not.toHaveBeenCalled();
    expect(voices).toHaveLength(0);
    activation.isActive = true;
    instance.play('hover');
    expect(construct).toHaveBeenCalledTimes(1);
    expect(voices).toHaveLength(1);
    activation.isActive = false;
    instance.play('glitch');
    expect(voices).toHaveLength(2);
  });

  it('falls back to tap and matrix without allocating for gestureless hover', () => {
    const { Context, construct } = contextConstructor();
    vi.stubGlobal('window', { AudioContext: Context, navigator: {} });
    const instance = engine();
    instance.play('hover');
    instance.play('glitch');
    expect(construct).not.toHaveBeenCalled();
    expect(voices).toHaveLength(0);
    instance.play('matrix');
    expect(construct).toHaveBeenCalledTimes(1);
    expect(voices).toHaveLength(1);
  });

  it('prefers the standard constructor without consulting the legacy fallback', () => {
    const { Context, construct: standard } = contextConstructor();
    const legacyLookup = vi.fn(() => {
      throw new Error('The supported standard constructor should win');
    });
    vi.stubGlobal('window', {
      AudioContext: Context,
      get webkitAudioContext() {
        return legacyLookup();
      },
      navigator: {},
    });
    const instance = engine();
    instance.play('tap');
    expect(standard).toHaveBeenCalledTimes(1);
    expect(legacyLookup).not.toHaveBeenCalled();
    expect(voices).toHaveLength(1);
  });

  it('uses the typed legacy constructor when the standard one is absent', () => {
    const { Context, construct } = contextConstructor();
    vi.stubGlobal('window', { webkitAudioContext: Context, navigator: {} });
    const instance = engine();
    instance.play('tap');
    expect(construct).toHaveBeenCalledTimes(1);
    expect(voices).toHaveLength(1);
  });

  it('drops unavailable contexts and allows a later eligible creation attempt', () => {
    const context = new ContextStateStub();
    const createContext = vi
      .fn<() => AudioContext | null>()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(context as unknown as AudioContext);
    const instance = engine(definitions(), {
      createContext,
      canUnlock: () => true,
    });
    instance.play('tap');
    expect(voices).toHaveLength(0);
    instance.play('tap');
    expect(createContext).toHaveBeenCalledTimes(2);
    expect(voices).toHaveLength(1);
  });

  it('contains hardware constructor failure and retries without scheduling', () => {
    const construct = vi.fn(
      class {
        constructor() {
          throw new Error('audio hardware unavailable');
        }
      }
    );
    vi.stubGlobal('window', { AudioContext: construct, navigator: {} });
    const instance = engine();
    instance.play('tap');
    instance.play('matrix');
    expect(construct).toHaveBeenCalledTimes(2);
    expect(scheduleSound).not.toHaveBeenCalled();
    expect(voices).toHaveLength(0);
  });

  it('does not schedule nonempty definitions on the server', () => {
    vi.stubGlobal('window', undefined);
    const instance = engine();
    for (const name of ['tap', 'hover', 'glitch', 'matrix'] as const) {
      instance.play(name);
    }
    expect(scheduleSound).not.toHaveBeenCalled();
    expect(voices).toHaveLength(0);
  });
});
