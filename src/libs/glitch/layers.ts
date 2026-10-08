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
/** The two ported presets. */
export type GlitchPreset = 'hover' | 'click';

/** What a host plays: one preset, or both (hover on enter, click on click). */
export type GlitchMode = GlitchPreset | 'both';

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
    /**
     * How far a slice travels, in percent of the element's width.
     * PowerGlitch hardcodes 30.
     */
    shift: number;
    minHeight: number;
    maxHeight: number;
    /**
     * How far a slice's hue may rotate either way, in degrees, or `false` to
     * leave the colour alone. PowerGlitch hardcodes ±360; a narrower range keeps
     * the tint in the palette's family instead of landing on any hue.
     */
    hueRange: number | false;
    /**
     * Fixed `filter` for every slice step. Setting it wins over `hueRange`.
     */
    cssFilters: string;
  };
};

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

    const shift = glitchRandom(options, stepPct) * options.slice.shift;
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
    } else if (options.slice.hueRange) {
      const hue = Math.floor(
        glitchRandom(options, stepPct) * options.slice.hueRange
      );
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
 * Displacement caps, in px, applied to whatever preset is about to play
 * (`clampGlitchToBox`). PowerGlitch expresses travel and shake as percentages
 * of the element's own box, which only works while the boxes are similar: the
 * recipe that tears a 285px tile by 34px tears a 976px card by 117px and
 * shudders it 39px sideways, which reads as the page glitching rather than the
 * card. The caps are set just above what a skill tile needs, so a tile is
 * generated exactly as it was and anything larger is pulled back to it.
 */
export const glitchCaps = { travel: 36, shakeX: 12, shakeY: 6 };

/**
 * The same options with its travels expressed against a real box: a percentage
 * is only kept while it stays inside the cap.
 */
export function clampGlitchToBox(
  options: GlitchOptions,
  box: { width: number; height: number }
): GlitchOptions {
  if (box.width <= 0 || box.height <= 0) return options;

  const share = (px: number, extent: number) => (px / extent) * 100;

  return {
    ...options,
    shake: options.shake
      ? {
          ...options.shake,
          amplitudeX: Math.min(
            options.shake.amplitudeX,
            share(glitchCaps.shakeX, box.width)
          ),
          amplitudeY: Math.min(
            options.shake.amplitudeY,
            share(glitchCaps.shakeY, box.height)
          ),
        }
      : false,
    slice: {
      ...options.slice,
      shift: Math.min(options.slice.shift, share(glitchCaps.travel, box.width)),
    },
  };
}

/**
 * The two behaviours ported from react-powerglitch, as the site plays them.
 * Both are fast (a sixth of a second) and both are small: this decoration sits
 * on content a reader is trying to use, so it accents the element rather than
 * taking it over.
 *
 * `hover` is the canon — the one the tiles were tuned against — and every
 * surface that glitches uses exactly it: four slice layers, each a 2–10% band
 * of the element torn sideways by up to 12%, a 4% shake, the intensity ramped
 * in and out across the loop (`glitchTimeSpan` 0.1 → 0.9).
 *
 * `click` is the same speed and a different effect, not a louder one. Nothing
 * travels: the three slice layers stay where they are and are broadly clipped
 * (12–30% tall) with their hue rotated within ±90°, so a click reads as colour
 * bands flickering across the element while it takes a short vertical nudge
 * (the shake is mostly on Y). Its window is the whole loop, so every step
 * glitches instead of easing in.
 */
export const glitchPresets: Record<GlitchPreset, GlitchOptions> = {
  hover: {
    timing: { duration: 150, iterations: 1 },
    glitchTimeSpan: { start: 0.1, end: 0.9 },
    shake: { velocity: 35, amplitudeX: 0.04, amplitudeY: 0.04 },
    slice: {
      count: 4,
      velocity: 35,
      shift: 12,
      minHeight: 0.02,
      maxHeight: 0.1,
      hueRange: 360,
      cssFilters: '',
    },
  },
  click: {
    timing: { duration: 150, iterations: 1 },
    glitchTimeSpan: { start: 0, end: 1 },
    shake: { velocity: 35, amplitudeX: 0.01, amplitudeY: 0.035 },
    slice: {
      count: 3,
      velocity: 35,
      shift: 0,
      minHeight: 0.12,
      maxHeight: 0.3,
      hueRange: 90,
      cssFilters: '',
    },
  },
};
