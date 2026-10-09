import type { FrequencyAutomation, GainEnvelope, PreparedSound } from './model';

export interface SoundVoice {
  stop: () => void;
}

interface LayerNodes {
  source: OscillatorNode | AudioBufferSourceNode | null;
  filter: BiquadFilterNode | null;
  gain: GainNode | null;
  started: boolean;
  finished: boolean;
}

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

function automateFrequency(
  param: AudioParam,
  automation: FrequencyAutomation,
  start: number
): void {
  param.setValueAtTime(automation.initial, start);
  const ramps = automation.ramps;
  if (!ramps) return;
  for (const ramp of ramps) {
    if (ramp.curve === 'exponential') {
      param.exponentialRampToValueAtTime(ramp.value, start + ramp.at);
    } else {
      param.linearRampToValueAtTime(ramp.value, start + ramp.at);
    }
  }
}

function automateGain(
  param: AudioParam,
  envelope: GainEnvelope,
  start: number,
  end: number
): void {
  const attackEnd = start + envelope.attack;
  const releaseStart = start + (envelope.attack + envelope.hold);

  param.setValueAtTime(0, start);
  if (envelope.attack === 0) {
    param.setValueAtTime(envelope.peak, start);
  } else {
    param.linearRampToValueAtTime(envelope.peak, attackEnd);
  }
  if (envelope.hold > 0) {
    param.setValueAtTime(envelope.peak, releaseStart);
  }
  // Steps avoid replacing equal-time ramps for zero-length segments.
  if (envelope.release === 0) {
    param.setValueAtTime(0, end);
  } else {
    param.linearRampToValueAtTime(0, end);
  }
}

function getNoiseBuffer(context: BaseAudioContext): AudioBuffer {
  const cached = noiseBuffers.get(context);
  if (cached) return cached;

  const buffer = context.createBuffer(
    1,
    context.sampleRate,
    context.sampleRate
  );
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = Math.random() * 2 - 1;
  }
  noiseBuffers.set(context, buffer);
  return buffer;
}

function disconnect(node: AudioNode | null): void {
  if (!node) return;
  try {
    node.disconnect();
  } catch {
    // One native cleanup failure must not leave the rest of the graph connected.
  }
}

function releaseLayer(layer: LayerNodes, stop: boolean): boolean {
  if (layer.finished) return false;
  layer.finished = true;

  const { source, filter, gain, started } = layer;
  layer.source = null;
  layer.filter = null;
  layer.gain = null;
  layer.started = false;

  if (source) {
    source.onended = null;
    if (stop && started) {
      try {
        // This replaces the lifetime stop and cancels even a future start.
        source.stop();
      } catch {
        // Disconnection still silences a source whose native stop fails.
      }
    }
  }
  disconnect(source);
  disconnect(filter);
  disconnect(gain);
  return true;
}

export function scheduleSound(
  context: BaseAudioContext,
  sound: PreparedSound,
  at: number,
  onEnded: () => void
): SoundVoice {
  if (!Number.isFinite(at) || at < 0) {
    throw new RangeError('Sound start time must be finite and nonnegative');
  }

  const layers: LayerNodes[] = [];
  let remaining = sound.layers.length;
  let completed = false;
  let completion: (() => void) | null = onEnded;

  const complete = (): void => {
    if (completed) return;
    completed = true;
    layers.length = 0;
    const callback = completion;
    completion = null;
    callback?.();
  };

  const stop = (): void => {
    if (completed) return;
    for (const layer of layers) {
      releaseLayer(layer, true);
    }
    complete();
  };

  if (remaining === 0) {
    complete();
    return { stop };
  }

  try {
    for (const prepared of sound.layers) {
      const layer: LayerNodes = {
        source: null,
        filter: null,
        gain: null,
        started: false,
        finished: false,
      };
      layers.push(layer);

      const definition = prepared.definition;
      const start = at + prepared.delay;
      const end = start + prepared.duration;
      let source: OscillatorNode | AudioBufferSourceNode;
      if (definition.kind === 'oscillator') {
        const oscillator = context.createOscillator();
        layer.source = oscillator;
        oscillator.type = definition.waveform;
        automateFrequency(oscillator.frequency, definition.frequency, start);
        source = oscillator;
      } else {
        const noise = context.createBufferSource();
        layer.source = noise;
        noise.buffer = getNoiseBuffer(context);
        noise.loop = true;
        source = noise;
      }

      if (definition.filter) {
        const filter = context.createBiquadFilter();
        layer.filter = filter;
        filter.type = definition.filter.type;
        automateFrequency(filter.frequency, definition.filter.frequency, start);
        if (definition.filter.q !== undefined) {
          filter.Q.setValueAtTime(definition.filter.q, start);
        }
      }

      const gain = context.createGain();
      layer.gain = gain;
      automateGain(gain.gain, definition.envelope, start, end);
      if (layer.filter) {
        source.connect(layer.filter);
        layer.filter.connect(gain);
      } else {
        source.connect(gain);
      }
      gain.connect(context.destination);

      source.onended = () => {
        if (!releaseLayer(layer, false)) return;
        remaining -= 1;
        if (remaining === 0) complete();
      };
      source.start(start);
      layer.started = true;
      source.stop(end);
    }
  } catch (error) {
    // A failed, never-returned voice leaves reservation release to the engine.
    completed = true;
    completion = null;
    for (const layer of layers) {
      releaseLayer(layer, true);
    }
    layers.length = 0;
    throw error;
  }

  return { stop };
}
