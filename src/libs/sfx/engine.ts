import { createThrottle } from '@/libs/throttle';
import { prepareSound } from './model';
import type { SfxName, SoundDefinitions } from './model';
import { scheduleSound } from './synthesis';
import type { SoundVoice } from './synthesis';

export interface SfxEnvironment {
  createContext: () => AudioContext | null;
  canUnlock: (name: SfxName) => boolean;
}

export interface SfxEngine {
  play: (name: SfxName) => void;
  dispose: () => void;
}

type AudioContextWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const browserEnvironment: SfxEnvironment = {
  createContext: () => {
    try {
      if (typeof window === 'undefined') return null;
      const browserWindow = window as AudioContextWindow;
      const Context =
        browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
      return Context ? new Context() : null;
    } catch {
      return null;
    }
  },
  canUnlock: (name) => {
    try {
      if (typeof window === 'undefined') return false;
      const activation = window.navigator.userActivation;
      return activation
        ? activation.isActive
        : name === 'tap' || name === 'matrix';
    } catch {
      return false;
    }
  },
};

interface ContextOwner {
  readonly context: AudioContext;
  readonly onStateChange: () => void;
  resumePending: boolean;
}

interface ActiveVoice {
  readonly layerCount: number;
  voice: SoundVoice | null;
}

const maxActiveLayers = 32;

export function createSfxEngine(
  definitions: SoundDefinitions,
  environment: SfxEnvironment = browserEnvironment
): SfxEngine {
  const sounds = {
    tap: prepareSound(definitions.tap),
    hover: prepareSound(definitions.hover),
    glitch: prepareSound(definitions.glitch),
    matrix: prepareSound(definitions.matrix),
  };
  const throttle = createThrottle({ maxTokens: 1, refillIntervalMs: 40 }, 4);
  const voices = new Set<ActiveVoice>();
  let activeLayers = 0;
  let owner: ContextOwner | null = null;

  function releaseVoice(active: ActiveVoice): void {
    if (!voices.delete(active)) return;
    activeLayers -= active.layerCount;
    active.voice = null;
  }

  function stopVoice(voice: SoundVoice): void {
    try {
      voice.stop();
    } catch {
      // Admission must still recover if the audio device disappears.
    }
  }

  function resetAdmission(): void {
    for (const active of voices) {
      const voice = active.voice;
      releaseVoice(active);
      if (voice) stopVoice(voice);
    }
    throttle.reset();
  }

  function releaseContext(current: ContextOwner): void {
    if (owner !== current) return;
    owner = null;
    current.resumePending = false;
    current.context.removeEventListener('statechange', current.onStateChange);
    resetAdmission();
  }

  function ownContext(context: AudioContext): ContextOwner {
    const current: ContextOwner = {
      context,
      resumePending: false,
      onStateChange: () => {
        if (owner !== current || context.state === 'running') return;
        if (context.state === 'closed') {
          releaseContext(current);
        } else {
          resetAdmission();
        }
      },
    };
    owner = current;
    context.addEventListener('statechange', current.onStateChange);
    return current;
  }

  function resume(current: ContextOwner): void {
    if (current.resumePending) return;
    current.resumePending = true;
    const settled = () => {
      if (owner === current) current.resumePending = false;
    };
    try {
      void current.context.resume().then(settled, settled);
    } catch {
      settled();
    }
  }

  function play(name: SfxName): void {
    const sound = sounds[name];
    if (sound.layers.length === 0) return;

    let current = owner;
    if (current?.context.state === 'closed') {
      releaseContext(current);
      current = null;
    }

    let eligible = false;
    if (!current) {
      eligible = environment.canUnlock(name);
      if (!eligible) return;
      let context: AudioContext | null;
      try {
        context = environment.createContext();
      } catch {
        return;
      }
      if (!context) return;
      current = ownContext(context);
    }

    if (current.context.state !== 'running') {
      if (current.context.state === 'closed') {
        releaseContext(current);
        return;
      }
      resetAdmission();
      if (eligible || environment.canUnlock(name)) resume(current);
      // Unlock attempts never replay a sound after their promise settles.
      return;
    }

    if (activeLayers + sound.layers.length > maxActiveLayers) return;
    const at = current.context.currentTime;
    if (!throttle.allow(name, at * 1000)) return;
    // An admitted native failure keeps its cooldown to bound hardware retries.

    const active: ActiveVoice = {
      layerCount: sound.layers.length,
      voice: null,
    };
    voices.add(active);
    activeLayers += active.layerCount;
    try {
      const voice = scheduleSound(current.context, sound, at, () => {
        releaseVoice(active);
      });
      if (voices.has(active)) {
        active.voice = voice;
      } else {
        // A synchronous completion or interruption already released the slot.
        stopVoice(voice);
      }
    } catch {
      releaseVoice(active);
    }
  }

  function dispose(): void {
    const current = owner;
    if (!current) {
      resetAdmission();
      return;
    }
    releaseContext(current);
    try {
      if (current.context.state !== 'closed') {
        void current.context.close().catch(() => {});
      }
    } catch {
      // Closing a lost device must not prevent later lazy recreation.
    }
  }

  return { play, dispose };
}
