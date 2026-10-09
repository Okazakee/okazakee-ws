export type SfxName = 'tap' | 'hover' | 'glitch' | 'matrix';

export interface FrequencyRamp {
  readonly at: number; // Seconds relative to layer start.
  readonly value: number;
  readonly curve: 'linear' | 'exponential';
}

export interface FrequencyAutomation {
  readonly initial: number;
  readonly ramps?: readonly FrequencyRamp[];
}

export interface GainEnvelope {
  readonly peak: number;
  readonly attack: number;
  readonly hold: number;
  readonly release: number;
}

export interface FilterDefinition {
  readonly type: BiquadFilterType;
  readonly frequency: FrequencyAutomation;
  readonly q?: number;
}

interface LayerTiming {
  readonly delay?: number;
  readonly envelope: GainEnvelope;
  readonly filter?: FilterDefinition;
}

export type SfxLayer = LayerTiming &
  (
    | {
        readonly kind: 'oscillator';
        readonly waveform: Exclude<OscillatorType, 'custom'>;
        readonly frequency: FrequencyAutomation;
      }
    | { readonly kind: 'noise' }
  );

export type SoundDefinition = readonly SfxLayer[];
export type SoundDefinitions = Readonly<Record<SfxName, SoundDefinition>>;

export interface PreparedLayer {
  readonly definition: SfxLayer;
  readonly delay: number;
  readonly duration: number;
}

export interface PreparedSound {
  readonly layers: readonly PreparedLayer[];
  readonly duration: number; // Maximum delayed lifetime; zero for silence.
}

function validateNonnegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be finite and nonnegative`);
  }
}

function validateFrequency(
  frequency: FrequencyAutomation,
  duration: number,
  label: string
): void {
  validateNonnegative(frequency.initial, `${label} initial`);
  if (!frequency.ramps) return;

  let previousTime = -Infinity;
  let previousValue = frequency.initial;
  for (let index = 0; index < frequency.ramps.length; index += 1) {
    const ramp = frequency.ramps[index];
    const rampLabel = `${label} ramp ${index}`;
    validateNonnegative(ramp.at, `${rampLabel} at`);
    validateNonnegative(ramp.value, `${rampLabel} value`);
    if (ramp.at <= previousTime) {
      throw new RangeError(`${rampLabel} at must be strictly increasing`);
    }
    if (ramp.at > duration) {
      throw new RangeError(`${rampLabel} at must be within layer lifetime`);
    }
    if (
      ramp.curve === 'exponential' &&
      (previousValue <= 0 || ramp.value <= 0)
    ) {
      throw new RangeError(
        `${rampLabel} exponential endpoints must be strictly positive`
      );
    }
    previousTime = ramp.at;
    previousValue = ramp.value;
  }
}

export function prepareSound(definition: SoundDefinition): PreparedSound {
  const layers: PreparedLayer[] = [];
  let duration = 0;

  for (let index = 0; index < definition.length; index += 1) {
    const layer = definition[index];
    const label = `layer ${index}`;
    const delay = layer.delay ?? 0;
    validateNonnegative(delay, `${label} delay`);

    const envelope = layer.envelope;
    validateNonnegative(envelope.peak, `${label} envelope peak`);
    validateNonnegative(envelope.attack, `${label} envelope attack`);
    validateNonnegative(envelope.hold, `${label} envelope hold`);
    validateNonnegative(envelope.release, `${label} envelope release`);
    const layerDuration = envelope.attack + envelope.hold + envelope.release;
    if (!Number.isFinite(layerDuration) || layerDuration <= 0) {
      throw new RangeError(
        `${label} envelope lifetime must be finite and positive`
      );
    }

    const end = delay + layerDuration;
    if (!Number.isFinite(end)) {
      throw new RangeError(`${label} delayed lifetime must be finite`);
    }

    if (layer.kind === 'oscillator') {
      validateFrequency(layer.frequency, layerDuration, `${label} frequency`);
    }
    if (layer.filter) {
      validateFrequency(
        layer.filter.frequency,
        layerDuration,
        `${label} filter frequency`
      );
      if (layer.filter.q !== undefined && !Number.isFinite(layer.filter.q)) {
        throw new RangeError(`${label} filter q must be finite`);
      }
    }

    layers.push({ definition: layer, delay, duration: layerDuration });
    duration = Math.max(duration, end);
  }

  return { layers, duration };
}
