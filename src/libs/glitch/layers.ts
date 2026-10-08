/**
 * Glitch layers, ported from PowerGlitch (MIT, github.com/7PH/powerglitch) for
 * the two behaviours the site plays (docs/DESIGN.md §3): a slice glitch on
 * hover, and the same burst on click.
 *
 * The animation model is PowerGlitch's, unchanged. One base layer shakes, and
 * `slice.count` slice layers each clip a random band of the element, shove it
 * sideways and hue-rotate it. Every layer becomes an animation whose easing is
 * `steps(n, jump-start)`, so positions jump between the computed offsets
 * instead of interpolating — that is what reads as digital rather than smooth.
 * `glitchTimeSpan` scales every offset by a factor that ramps up and back down
 * inside a window of the loop (and blanks the step outside it), which is the
 * difference between a hard on/off and an eased burst.
 *
 * Only what the site plays is ported: PowerGlitch's `html`, `createContainers`,
 * `optimizeSeo`, `pulse` and per-call `playMode` are deliberately absent — the
 * play mode is a prop of `Glitch`, and the boxes around it are its own.
 *
 * The generator is pure, so its numbers are covered by `layers.test.ts`
 * without a DOM.
 */
export type GlitchMode = 'hover' | 'click';

export type GlitchLayer = {
  steps: Keyframe[];
  timing: KeyframeAnimationOptions;
};

export type GlitchOptions = {
  /** Loop length in ms and how often it repeats. */
  timing: { duration: number; iterations: number };
  /**
   * Window of the loop the glitch happens in, as fractions of it, peaking in
   * the middle. `false` glitches uniformly.
   */
  glitchTimeSpan: false | { start: number; end: number };
  /** Base-layer shake, in percent of the element's own box. `false` pins it. */
  shake: false | { velocity: number; amplitudeX: number; amplitudeY: number };
  slice: {
    /** Slice layers to generate; one element copy plays each of them. */
    count: number;
    /** Steps computed per second of animation. */
    velocity: number;
    minHeight: number;
    maxHeight: number;
    /** Random hue rotation per step; ignored when `cssFilters` is set. */
    hueRotate: boolean;
    cssFilters: string;
  };
};

/** How far a slice travels, in percent of the element's width. */
const SLICE_SHIFT = 30;

/**
 * How much the glitch is felt at `stepPct` of the loop: 0 outside the window,
 * ramping to 1 at its middle.
 */
function glitchFactor(options: GlitchOptions, stepPct: number): number {
  if (!options.glitchTimeSpan) return 1;

  const { start, end } = options.glitchTimeSpan;
  if (stepPct < start || stepPct > end) return 0;

  const peak = start + (end - start) / 2;
  return stepPct < peak
    ? (stepPct - start) / (peak - start)
    : (end - stepPct) / (end - peak);
}

/**
 * Random value in [-1, 1], always pulled towards 0 where the glitch is not
 * felt — the one place that formula lives, because the shake (x and y) and the
 * slice shift and hue must ramp together or the burst falls apart.
 */
function glitchRandom(options: GlitchOptions, stepPct: number): number {
  return (Math.random() - 0.5) * 2 * glitchFactor(options, stepPct);
}

/**
 * A random full-width band as a `clip-path` polygon, `minHeight`..`maxHeight`
 * of the box tall and somewhere along it. The `+ 1` is PowerGlitch's inclusive
 * upper bound, kept so a band can still reach `maxHeight`.
 */
function randomClipPolygon(minHeight: number, maxHeight: number): string {
  const height =
    Math.floor(Math.random() * ((maxHeight - minHeight) * 100 + 1)) +
    minHeight * 100;
  const top = Math.floor(Math.random() * (100 - height));

  return `polygon(100% ${top}%,100% ${top + height}%,0% ${top + height}%,0% ${top}%)`;
}

/** One slice layer: shift, clip and colour of a clipped band, per step. */
function sliceLayer(options: GlitchOptions): GlitchLayer {
  const stepCount =
    Math.floor((options.slice.velocity * options.timing.duration) / 1000) + 1;
  const steps: Keyframe[] = [];

  for (let index = 0; index < stepCount; index += 1) {
    const stepPct = index / stepCount;

    if (glitchFactor(options, stepPct) === 0) {
      steps.push({ opacity: '0', transform: 'none', clipPath: 'unset' });
      continue;
    }

    const shift = glitchRandom(options, stepPct) * SLICE_SHIFT;
    const step: Keyframe = {
      opacity: '1',
      transform: `translate3d(${shift}%,0,0)`,
      clipPath: randomClipPolygon(
        options.slice.minHeight,
        options.slice.maxHeight
      ),
    };

    if (options.slice.cssFilters) {
      step.filter = options.slice.cssFilters;
    } else if (options.slice.hueRotate) {
      const hue = Math.floor(glitchRandom(options, stepPct) * 360);
      step.filter = `hue-rotate(${hue}deg)`;
    }

    steps.push(step);
  }

  return {
    steps,
    timing: { ...options.timing, easing: `steps(${stepCount}, jump-start)` },
  };
}

/** The base layer: the element's own shake, never clipped. */
function baseLayer(options: GlitchOptions): GlitchLayer {
  const { shake } = options;
  if (!shake) return { steps: [], timing: { ...options.timing } };

  const stepCount =
    Math.floor((shake.velocity * options.timing.duration) / 1000) + 1;
  const steps: Keyframe[] = [];

  for (let index = 0; index < stepCount; index += 1) {
    const stepPct = index / stepCount;
    const x = glitchRandom(options, stepPct) * shake.amplitudeX * 100;
    const y = glitchRandom(options, stepPct) * shake.amplitudeY * 100;
    steps.push({ transform: `translate3d(${x}%,${y}%,0)` });
  }

  return {
    steps,
    timing: { ...options.timing, easing: `steps(${stepCount}, jump-start)` },
  };
}

/** The full layer list: the shake layer first, then one per slice. */
export function generateGlitchLayers(options: GlitchOptions): GlitchLayer[] {
  return [
    baseLayer(options),
    ...Array.from({ length: options.slice.count }, () => sliceLayer(options)),
  ];
}

/**
 * The two behaviours ported from react-powerglitch, as the site plays them.
 *
 * `hover` is the smooth character on quick timing: the slice window ramps in
 * and out (`glitchTimeSpan` 0.1 → 0.9), so the burst eases rather than
 * switching on, while the loop is short enough to be gone in a fifth of a
 * second. `click` is PowerGlitch's own click preset — more slices, faster
 * steps, one shot — for a button that fires on every click.
 *
 * Both velocities are deliberately higher than PowerGlitch's defaults: the
 * loop was shortened, and a shorter loop at the original velocity would simply
 * cut the number of jumps. Raising it keeps six or seven distinct positions
 * (the glitch) while spending less time on it (the speed).
 */
export const glitchPresets: Record<GlitchMode, GlitchOptions> = {
  hover: {
    timing: { duration: 200, iterations: 1 },
    glitchTimeSpan: { start: 0.1, end: 0.9 },
    shake: { velocity: 25, amplitudeX: 0.2, amplitudeY: 0.2 },
    slice: {
      count: 6,
      velocity: 25,
      minHeight: 0.02,
      maxHeight: 0.15,
      hueRotate: true,
      cssFilters: '',
    },
  },
  click: {
    timing: { duration: 170, iterations: 1 },
    glitchTimeSpan: { start: 0, end: 1 },
    shake: { velocity: 30, amplitudeX: 0.2, amplitudeY: 0.2 },
    slice: {
      count: 15,
      velocity: 35,
      minHeight: 0.02,
      maxHeight: 0.15,
      hueRotate: true,
      cssFilters: '',
    },
  },
};
