import { describe, expect, it } from 'vitest';
import type {
  FrequencyAutomation,
  GainEnvelope,
  SfxLayer,
  SoundDefinition,
} from './model';
import { prepareSound } from './model';

const envelope: GainEnvelope = {
  peak: 1,
  attack: 0.125,
  hold: 0.25,
  release: 0.125,
};

const oscillator = {
  kind: 'oscillator',
  waveform: 'sine',
  frequency: { initial: 100 },
  envelope,
} satisfies SfxLayer;

const invalidNonnegative = [-1, NaN, Infinity, -Infinity];

function frequencyLayers(frequency: FrequencyAutomation): SfxLayer[] {
  return [
    { ...oscillator, delay: 1, frequency },
    {
      kind: 'noise',
      delay: 1,
      envelope,
      filter: { type: 'bandpass', frequency },
    },
  ];
}

describe('prepareSound', () => {
  it('prepares an empty definition as intentional silence', () => {
    expect(prepareSound([])).toEqual({ layers: [], duration: 0 });
  });

  it('combines envelope segments and delays without summing layer lifetimes', () => {
    const definition: SoundDefinition = [
      {
        ...oscillator,
        envelope: { peak: 1, attack: 0.25, hold: 0.5, release: 0.25 },
      },
      {
        kind: 'noise',
        delay: 0.125,
        envelope: { peak: 0, attack: 0, hold: 0.25, release: 0.125 },
        filter: {
          type: 'bandpass',
          q: 3,
          frequency: {
            initial: 500,
            ramps: [
              { at: 0, value: 750, curve: 'linear' },
              { at: 0.375, value: 1250, curve: 'exponential' },
            ],
          },
        },
      },
      { ...oscillator, waveform: 'triangle', delay: 1.5 },
    ];

    const sound = prepareSound(definition);
    expect(
      sound.layers.map((layer) => ({
        delay: layer.delay,
        duration: layer.duration,
      }))
    ).toEqual([
      { delay: 0, duration: 1 },
      { delay: 0.125, duration: 0.375 },
      { delay: 1.5, duration: 0.5 },
    ]);
    expect(sound.duration).toBe(2);
  });

  it('allows zero gain and zero segments when some lifetime remains', () => {
    for (const segment of ['attack', 'hold', 'release'] as const) {
      const sound = prepareSound([
        {
          ...oscillator,
          envelope: {
            peak: 0,
            attack: 0,
            hold: 0,
            release: 0,
            [segment]: 0.25,
          },
        },
      ]);
      expect(sound.layers[0].duration).toBe(0.25);
      expect(sound.duration).toBe(0.25);
    }
  });

  it('rejects a zero total lifetime even for a delayed silent layer', () => {
    expect(() =>
      prepareSound([
        {
          ...oscillator,
          delay: 1,
          envelope: { peak: 0, attack: 0, hold: 0, release: 0 },
        },
      ])
    ).toThrow(RangeError);
  });

  it('rejects negative and nonfinite gain or envelope segments', () => {
    for (const field of ['peak', 'attack', 'hold', 'release'] as const) {
      for (const value of invalidNonnegative) {
        expect(() =>
          prepareSound([
            { ...oscillator, envelope: { ...envelope, [field]: value } },
          ])
        ).toThrow(RangeError);
      }
    }
  });

  it('rejects negative and nonfinite layer delays', () => {
    for (const delay of invalidNonnegative) {
      expect(() => prepareSound([{ ...oscillator, delay }])).toThrow(
        RangeError
      );
    }
  });

  it('rejects overflow in summed envelope or delayed lifetimes', () => {
    expect(() =>
      prepareSound([
        {
          ...oscillator,
          envelope: {
            peak: 1,
            attack: Number.MAX_VALUE,
            hold: Number.MAX_VALUE,
            release: 0,
          },
        },
      ])
    ).toThrow(RangeError);
    expect(() =>
      prepareSound([
        {
          ...oscillator,
          delay: Number.MAX_VALUE,
          envelope: {
            peak: 1,
            attack: Number.MAX_VALUE,
            hold: 0,
            release: 0,
          },
        },
      ])
    ).toThrow(RangeError);
  });

  it('accepts ordered points at start and end of the relative lifetime', () => {
    const frequency: FrequencyAutomation = {
      initial: 100,
      ramps: [
        { at: 0, value: 200, curve: 'linear' },
        { at: 0.25, value: 400, curve: 'exponential' },
        { at: 0.5, value: 0, curve: 'linear' },
      ],
    };
    for (const layer of frequencyLayers(frequency)) {
      expect(prepareSound([layer]).duration).toBe(1.5);
    }
  });

  it('rejects negative or nonfinite oscillator and filter frequencies', () => {
    for (const value of invalidNonnegative) {
      const frequencies: FrequencyAutomation[] = [
        { initial: value },
        {
          initial: 100,
          ramps: [{ at: 0.25, value, curve: 'linear' }],
        },
      ];
      for (const frequency of frequencies) {
        for (const layer of frequencyLayers(frequency)) {
          expect(() => prepareSound([layer])).toThrow(RangeError);
        }
      }
    }
  });

  it('rejects invalid relative ramp times regardless of layer delay', () => {
    for (const at of [...invalidNonnegative, 0.5001]) {
      for (const layer of frequencyLayers({
        initial: 100,
        ramps: [{ at, value: 200, curve: 'linear' }],
      })) {
        expect(() => prepareSound([layer])).toThrow(RangeError);
      }
    }
  });

  it('rejects equal or decreasing point times rather than sorting them', () => {
    for (const times of [
      [0, 0],
      [0.25, 0.25],
      [0.25, 0.125],
    ]) {
      for (const layer of frequencyLayers({
        initial: 100,
        ramps: times.map((at) => ({
          at,
          value: 200,
          curve: 'linear' as const,
        })),
      })) {
        expect(() => prepareSound([layer])).toThrow(RangeError);
      }
    }
  });

  it('allows linear ramps from and to zero', () => {
    for (const layer of frequencyLayers({
      initial: 0,
      ramps: [
        { at: 0, value: 0, curve: 'linear' },
        { at: 0.25, value: 100, curve: 'linear' },
        { at: 0.5, value: 0, curve: 'linear' },
      ],
    })) {
      expect(prepareSound([layer]).layers[0].duration).toBe(0.5);
    }
  });

  it('rejects exponential ramps from zero, to zero, or after linear zero', () => {
    const frequencies: FrequencyAutomation[] = [
      {
        initial: 0,
        ramps: [{ at: 0, value: 100, curve: 'exponential' }],
      },
      {
        initial: 100,
        ramps: [{ at: 0.5, value: 0, curve: 'exponential' }],
      },
      {
        initial: 100,
        ramps: [
          { at: 0.25, value: 0, curve: 'linear' },
          { at: 0.5, value: 200, curve: 'exponential' },
        ],
      },
    ];
    for (const frequency of frequencies) {
      for (const layer of frequencyLayers(frequency)) {
        expect(() => prepareSound([layer])).toThrow(RangeError);
      }
    }
  });

  it('accepts exponential ramps after a linear ramp restores positivity', () => {
    for (const layer of frequencyLayers({
      initial: 0,
      ramps: [
        { at: 0, value: 100, curve: 'linear' },
        { at: 0.5, value: 200, curve: 'exponential' },
      ],
    })) {
      expect(prepareSound([layer]).duration).toBe(1.5);
    }
  });

  it('rejects nonfinite filter Q without imposing other Q limits', () => {
    for (const q of [NaN, Infinity, -Infinity]) {
      expect(() =>
        prepareSound([
          {
            kind: 'noise',
            envelope,
            filter: { type: 'lowpass', frequency: { initial: 100 }, q },
          },
        ])
      ).toThrow(RangeError);
    }
    for (const q of [-Number.MAX_VALUE, 0, Number.MAX_VALUE]) {
      expect(
        prepareSound([
          {
            ...oscillator,
            filter: { type: 'highpass', frequency: { initial: 0 }, q },
          },
        ]).duration
      ).toBe(0.5);
    }
  });

  it('does not impose recipe gain or frequency upper bounds', () => {
    for (const layer of frequencyLayers({ initial: Number.MAX_VALUE })) {
      expect(
        prepareSound([
          { ...layer, envelope: { ...envelope, peak: Number.MAX_VALUE } },
        ]).duration
      ).toBe(1.5);
    }
  });

  it('preserves references and prepares deeply frozen definitions', () => {
    const frequency = Object.freeze({
      initial: 100,
      ramps: Object.freeze([
        Object.freeze({ at: 0, value: 200, curve: 'linear' as const }),
        Object.freeze({ at: 0.5, value: 400, curve: 'exponential' as const }),
      ]),
    });
    const definition = Object.freeze([
      Object.freeze({
        ...oscillator,
        delay: 0.25,
        envelope: Object.freeze({ ...envelope }),
        frequency,
        filter: Object.freeze({ type: 'allpass' as const, frequency }),
      }),
      Object.freeze({
        kind: 'noise' as const,
        envelope: Object.freeze({ ...envelope }),
      }),
    ]);
    const sound = prepareSound(definition);
    expect(sound.duration).toBe(0.75);
    expect(sound.layers[0].definition).toBe(definition[0]);
    expect(sound.layers[1].definition).toBe(definition[1]);
  });
});
