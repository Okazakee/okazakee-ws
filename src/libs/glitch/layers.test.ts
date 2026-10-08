import { describe, expect, it } from 'vitest';
import type { GlitchOptions } from './layers';
import { generateGlitchLayers, glitchPresets } from './layers';

const shift = /^translate3d\((-?[\d.]+)%,0,0\)$/;
const shake = /^translate3d\((-?[\d.]+)%,(-?[\d.]+)%,0\)$/;
const band = /^polygon\(100% (-?\d+)%,100% (-?\d+)%,0% (-?\d+)%,0% (-?\d+)%\)$/;

/** The band a slice step clips: its top and its height, both in percent. */
function clippedBand(step: Keyframe): { top: number; height: number } | null {
  const match = band.exec(String(step.clipPath));
  if (!match) return null;
  const [, top, bottom] = match;
  return { top: Number(top), height: Number(bottom) - Number(top) };
}

/** The shake settings of a preset, narrowed — every preset here shakes. */
function shakeOf(preset: GlitchOptions) {
  if (!preset.shake) throw new Error('expected a shaking preset');
  return preset.shake;
}

describe('generateGlitchLayers', () => {
  it('plays one shake layer first, then one layer per slice', () => {
    for (const preset of [glitchPresets.hover, glitchPresets.click]) {
      const layers = generateGlitchLayers(preset);
      expect(layers).toHaveLength(preset.slice.count + 1);
      // The base layer is the only one that shakes; slices stay on one axis.
      expect(
        layers[0].steps.every((step) => shake.test(String(step.transform)))
      ).toBe(true);
      expect(
        layers
          .slice(1)
          .every((layer) =>
            layer.steps.every((step) =>
              step.transform === undefined || step.transform === 'none'
                ? true
                : shift.test(String(step.transform))
            )
          )
      ).toBe(true);
    }
  });

  it('steps each layer at its own velocity, inside the preset timing', () => {
    const preset = glitchPresets.click;
    const layers = generateGlitchLayers(preset);
    const slices = Math.floor(
      (preset.slice.velocity * preset.timing.duration) / 1000
    );
    const shakes = Math.floor(
      (shakeOf(preset).velocity * preset.timing.duration) / 1000
    );

    expect(layers[0].steps).toHaveLength(shakes + 1);
    expect(layers[0].timing).toMatchObject({
      duration: preset.timing.duration,
      iterations: 1,
      easing: `steps(${shakes + 1}, jump-start)`,
    });
    for (const layer of layers.slice(1)) {
      expect(layer.steps).toHaveLength(slices + 1);
      expect(layer.timing).toMatchObject({
        duration: preset.timing.duration,
        iterations: 1,
        easing: `steps(${slices + 1}, jump-start)`,
      });
    }
  });

  it('hides a slice outside the glitch window and clips a band inside it', () => {
    // The hover preset glitches between 10% and 90% of the loop, so its first
    // step is off and the rest are bands.
    const layer = generateGlitchLayers(glitchPresets.hover)[1];

    expect(layer.steps[0]).toEqual({
      opacity: '0',
      transform: 'none',
      clipPath: 'unset',
    });
    for (const step of layer.steps.slice(1)) {
      expect(step.opacity).toBe('1');
      expect(shift.test(String(step.transform))).toBe(true);
    }

    // With no window every step glitches.
    const uniform = generateGlitchLayers({
      ...glitchPresets.hover,
      glitchTimeSpan: false,
    })[1];
    expect(uniform.steps.every((step) => step.opacity === '1')).toBe(true);
  });

  it('keeps every band inside its height range and the element box', () => {
    const preset = glitchPresets.click;
    const { minHeight, maxHeight } = preset.slice;

    for (const layer of generateGlitchLayers(preset).slice(1)) {
      for (const step of layer.steps) {
        // Steps outside the glitch window clip nothing; the rest clip bands.
        if (step.clipPath === 'unset') continue;

        const clipped = clippedBand(step);
        expect(clipped).not.toBeNull();
        if (!clipped) continue;

        expect(clipped.height).toBeGreaterThanOrEqual(minHeight * 100);
        expect(clipped.height).toBeLessThanOrEqual(maxHeight * 100);
        expect(clipped.top).toBeGreaterThanOrEqual(0);
        expect(clipped.top).toBeLessThanOrEqual(100 - clipped.height);
      }
    }
  });

  it('keeps the shake inside its amplitude', () => {
    const preset = glitchPresets.hover;
    const { amplitudeX, amplitudeY } = shakeOf(preset);

    for (const step of generateGlitchLayers(preset)[0].steps) {
      const match = shake.exec(String(step.transform));
      expect(match).not.toBeNull();
      if (!match) continue;

      expect(Math.abs(Number(match[1]))).toBeLessThanOrEqual(amplitudeX * 100);
      expect(Math.abs(Number(match[2]))).toBeLessThanOrEqual(amplitudeY * 100);
    }
  });

  it('tints the bands by hue rotation, or by the filters it is given', () => {
    const rotated = generateGlitchLayers(glitchPresets.hover)[1].steps[1];
    expect(String(rotated.filter)).toMatch(/^hue-rotate\(-?\d+deg\)$/);

    const preset = glitchPresets.hover;
    const filtered = generateGlitchLayers({
      ...preset,
      slice: { ...preset.slice, cssFilters: 'saturate(2)' },
    })[1].steps[1];
    expect(filtered.filter).toBe('saturate(2)');
  });

  it('leaves the element still when the shake is off', () => {
    const preset = glitchPresets.hover;
    const [base] = generateGlitchLayers({ ...preset, shake: false });

    expect(base.steps).toHaveLength(0);
    expect(base.timing.easing).toBeUndefined();
    // The slices still play: only the shake is pinned.
    expect(
      generateGlitchLayers({ ...preset, shake: false })[1].steps.length
    ).toBeGreaterThan(0);
  });
});
