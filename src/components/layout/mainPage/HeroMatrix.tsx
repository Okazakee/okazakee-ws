'use client';

import { useLayoutEffect, useRef } from 'react';
import {
  createHeroMatrixState,
  HERO_SEED,
  heroMatrixState,
  type Ping,
  type RainColumn,
} from './heroAnimationState';
import { createMatrixCanvasRenderer } from './matrixCanvasRenderer';

const CELL = 14;
const POINTER_CELLS = 6;
const GLYPHS = '>_/\\{}[]();:+*#$%&01';

// Ambient speckle: sparse steady pixels across the whole field, plus the
// blinking cursor square that rides at the bottom of each rain trail.
// Tune density / blink rate here.
const SPECKLE_DENSITY = 0.014;
const CURSOR_BLINK_HZ = 1.1;
// Center band: extra speckle hugging the calm without entering it — same
// steady pixels, gated by the focus ring band, not the core.
const SPECKLE_CENTER_DENSITY = 0.05;
const SPECKLE_CENTER_LO = 0.25;
const SPECKLE_CENTER_HI = 0.65;

// Focus/exclusion fields: soft ellipses measured from the live DOM — the
// identity row (portrait + name + role) and the about block (heading +
// card), each padded and feathered. Tune padding/feather/floors below.
const ZONE_PAD_X = 24;
const ZONE_PAD_Y = 28;
const ABOUT_PAD_X = 40;
const ABOUT_PAD_Y = 40;
// Softness of the zone edges: larger = wider feather, no visible boundary.
const FOCUS_FEATHER = 0.55;
// Leave three live rain lanes per side on mobile, outside the focus feather.
const MOBILE_RAIN_GUTTER = CELL * 3;
// Strongest-point floors: opacity and brightness. Speed is never touched.
const FOCUS_OPACITY = 0.28;
const FOCUS_BRIGHT = 0.55;

// These bounds are below a quarter ULP of the dimmest luminosity and
// every heat/stamp cutoff: skipped tails cannot change a draw command.
const invisibleLum = (Number.EPSILON * (0.14 * FOCUS_OPACITY)) / 8;
const pingTailDistance =
  Math.sqrt(-2 * 24 * 24 * Math.log(invisibleLum / 2.2)) + 1;
const entranceTailTime = -140 * Math.log(invisibleLum / 0.3) + 140;
const BAYER = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36,
  14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23,
  61, 29, 53, 21,
];

interface Ramp {
  dim: string;
  mid: string;
  lit: string;
  hover: string;
  crest: string;
}

const DARK: Ramp = {
  dim: '#2e2a4a',
  mid: '#6f5cc0',
  lit: '#9451ff',
  hover: '#cdaffd',
  crest: '#e2d9fb',
};

const LIGHT: Ramp = {
  // `dim` carries the steady speckle squares (0.55 alpha) and the ambient bed
  // glyphs (0.8). Against the light band (#dfe2e9) the old pale lavender
  // (#d9cdf9) composited to a −2.9 L* step — invisible — while dark's #2e2a4a
  // steps +8.2 L* / +12.6 chroma off its own band. This value matches both
  // steps on the light band (−8.3 L* / +12.6 chroma, measured from the canvas
  // ink), so the field reads the same in either theme.
  dim: '#c4afe0',
  mid: '#a582f5',
  lit: '#7c3aed',
  hover: '#6d28d9',
  crest: '#5b21b6',
};

/**
 * Matrix-rain ground for the hero (docs/DESIGN.md §6): a transparent canvas
 * behind the untouched hero/about content. Symbol drops fall with a short
 * pixel lead, the pointer repels cells (magnet, 6 cells), clicks stamp a
 * disc ping, and the field resolves center-out on mount. Transparent so the
 * section band and both themes show through; static frame under
 * prefers-reduced-motion; idle when off-screen. `interactive={false}` drops
 * the pointer magnet and click pings — the error screens use it as a plain
 * ambient background behind their card.
 */
export function HeroMatrix({ interactive = true }: { interactive?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Layout effect: the first frame is drawn before the browser paints the
  // swapped tree, so a locale switch never shows a blank canvas.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.parentElement;
    if (!canvas || !hero) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const renderer = createMatrixCanvasRenderer(ctx, CELL, GLYPHS);
    // Tracks the renderer's buffer allocation, which is independent of the
    // canvas bitmap size (see measure).
    let rendererSized = false;

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    let palette: Ramp = document.documentElement.classList.contains('dark')
      ? DARK
      : LIGHT;
    const syncPalette = () => {
      palette = document.documentElement.classList.contains('dark')
        ? DARK
        : LIGHT;
    };

    // Document-scoped session (heroAnimationState.ts): a locale switch
    // remounts this component, and adopting the running state keeps the
    // rain and the entrance wave uninterrupted. `interactive={false}`
    // instances (error screens) keep a private state and never publish.
    const state = interactive ? heroMatrixState() : createHeroMatrixState();
    // Respawn randomness continues from the session cursor; the jitter table
    // uses its own stream so a remount cannot advance that cursor.
    const rnd = () => {
      state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
      return state.seed / 4294967296;
    };
    const jitter = new Float32Array(64 * 64);
    let jitterSeed = HERO_SEED;
    for (let i = 0; i < jitter.length; i++) {
      jitterSeed = (jitterSeed * 1664525 + 1013904223) >>> 0;
      jitter[i] = jitterSeed / 4294967296;
    }

    let W = 0;
    let H = 0;
    let cols = 0;
    let rows = 0;
    let entranceRow = 0;
    let matCols: RainColumn[] = state.matCols;
    const entranceT0 = state.entranceT0;
    const pointer = { x: -1e4, y: -1e4 };
    let strength = 0;
    let target = 0;
    const pings: Ping[] = state.pings;
    let fieldSize = 0;
    let fieldFocus: Float64Array;
    let fieldDim: Float64Array;
    let fieldThreshold: Float64Array;
    let fieldDelay: Float64Array;
    let fieldFlags: Uint8Array;
    let frozenHeads: Float64Array;

    const seedFrozenHeads = () => {
      frozenHeads = new Float64Array(cols);
      for (let c = 0; c < cols; c++) {
        frozenHeads[c] = matCols[c].seed % Math.max(1, rows + 20);
      }
    };

    const initMatrix = () => {
      const columns: RainColumn[] = [];
      const now = performance.now();
      for (let c = 0; c < cols; c++) {
        // Fresh columns start above the fold and fall in staggered, so the
        // field is alive on mount instead of flashing fully formed. Tall
        // drops are rarer: long vertical bars stay texture, not columns.
        const warmup = c % 2 === 0;
        const long = rnd() < 0.12;
        // Idle gaps between drops: ~1 in 7 columns starts empty so the
        // field breathes instead of filling every lane.
        const idle = !warmup && rnd() < 0.3;
        columns.push({
          y: idle
            ? -20 - rnd() * rows
            : warmup
              ? rnd() * (rows + 20) - 10
              : -4 - rnd() * 8,
          speed: 5 + rnd() * 7,
          len: long ? 9 + Math.floor(rnd() * 5) : 4 + Math.floor(rnd() * 5),
          seed: Math.floor(rnd() * 97),
          lead: 2 + Math.floor(rnd() * 3),
          born: warmup ? 0 : now,
        });
      }
      state.matCols = matCols = columns;
      seedFrozenHeads();
    };

    // Ellipse zones from the rendered content boxes, in canvas px. Identity
    // and about are tagged with data-hero-zone; padded, feathered, and
    // re-measured on resize so they track layout instead of hardcoding.
    let zones: Array<[number, number, number, number]> = [];
    // 0 outside the zones, up to 1 at the strongest overlap. Elliptical
    // distance with a smoothstep feather: no visible boundary by design.
    const focusAt = (px: number, py: number) => {
      let focus = 0;
      for (const [cx, cy, rx, ry] of zones) {
        const ex = (px - cx) / Math.max(1, rx);
        const ey = (py - cy) / Math.max(1, ry);
        const d = Math.sqrt(ex * ex + ey * ey);
        const edge = 1 + FOCUS_FEATHER;
        const t = Math.min(1, Math.max(0, (edge - d) / FOCUS_FEATHER));
        const s = t * t * (3 - 2 * t);
        if (s > focus) focus = s;
      }
      return focus;
    };

    const cachePingDistances = (ping: Ping) => {
      const count = rows * cols;
      if (ping.distances.length !== count) {
        ping.distances = new Float64Array(count);
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dx = c * CELL + CELL / 2 - ping.x;
          const dy = r * CELL + CELL / 2 - ping.y;
          ping.distances[r * cols + c] = Math.sqrt(dx * dx + dy * dy);
        }
      }
    };

    const cacheField = () => {
      const count = rows * cols;
      if (fieldSize !== count) {
        fieldSize = count;
        fieldFocus = new Float64Array(count);
        fieldDim = new Float64Array(count);
        fieldThreshold = new Float64Array(count);
        fieldDelay = new Float64Array(count);
        fieldFlags = new Uint8Array(count);
      }
      const cc = W / (2 * CELL);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const index = r * cols + c;
          const focus = focusAt(c * CELL + CELL / 2, r * CELL + CELL / 2);
          const noise = jitter[(r & 63) * 64 + (c & 63)];
          const dx = c - cc;
          const dy = r - entranceRow;
          fieldFocus[index] = focus;
          fieldDim[index] = 1 - focus * (1 - FOCUS_OPACITY);
          fieldThreshold[index] =
            0.78 * ((BAYER[(r & 7) * 8 + (c & 7)] + 0.5) / 64) + 0.22 * noise;
          fieldDelay[index] = Math.sqrt(dx * dx + dy * dy) * 26 + noise * 320;
          fieldFlags[index] =
            (focus > 0.3 ? 1 : 0) |
            (jitter[(r * 73 + c * 37) & 4095] < SPECKLE_DENSITY ? 2 : 0) |
            (focus > SPECKLE_CENTER_LO &&
            focus < SPECKLE_CENTER_HI &&
            jitter[(r * 131 + c * 57) & 4095] < SPECKLE_CENTER_DENSITY
              ? 4
              : 0);
        }
      }
      for (let i = 0; i < pings.length; i++) cachePingDistances(pings[i]);
    };
    const measureZones = () => {
      const heroBox = hero.getBoundingClientRect();
      const maxRadiusX =
        W < 768
          ? Math.max(CELL, (W / 2 - MOBILE_RAIN_GUTTER) / (1 + FOCUS_FEATHER))
          : null;
      const zone = (name: string, padX: number, padY: number) => {
        const el = hero.querySelector(`[data-hero-zone="${name}"]`);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        if (b.width < 1 || b.height < 1) return null;
        const cx = b.left - heroBox.left + b.width / 2;
        const cy = b.top - heroBox.top + b.height / 2;
        const radiusX = b.width / 2 + padX;
        return [
          cx,
          cy,
          maxRadiusX === null ? radiusX : Math.min(radiusX, maxRadiusX),
          b.height / 2 + padY,
        ] as [number, number, number, number];
      };
      zones = [
        zone('identity', ZONE_PAD_X, ZONE_PAD_Y),
        zone('about', ABOUT_PAD_X, ABOUT_PAD_Y),
      ].filter((z): z is [number, number, number, number] => z !== null);
      cacheField();
    };

    const measure = () => {
      const box = hero.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(box.width));
      H = Math.max(1, Math.round(box.height));
      cols = Math.ceil(W / CELL) + 2;
      rows = Math.ceil(H / CELL) + 2;
      const bitmapW = Math.round(W * dpr);
      const bitmapH = Math.round(H * dpr);
      // Assigning width/height clears the bitmap; resize only on an actual
      // change so a same-size re-measure keeps the painted frame.
      if (canvas.width !== bitmapW || canvas.height !== bitmapH) {
        canvas.width = bitmapW;
        canvas.height = bitmapH;
        rendererSized = false;
      }
      // `renderer.resize` allocates the renderer's cell buffers and must run
      // once per renderer before any frame — including when the bitmap was
      // already sized by a previous effect run over the same canvas node.
      if (!rendererSized) {
        renderer.resize(W, H, dpr, cols, rows);
        rendererSized = true;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${CELL - 2}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // On tall mobile heroes, start the reveal inside the visible viewport.
      const visibleTop = Math.max(0, -box.top);
      const visibleBottom = Math.max(
        visibleTop,
        Math.min(H, window.innerHeight - box.top)
      );
      entranceRow = (visibleTop + visibleBottom) / (2 * CELL);
      // Field continuity: a locale switch remounts with the same grid, and
      // the adopted columns keep falling from their positions. Only a real
      // grid change (first mount, resize, zoom) re-seeds them.
      if (state.cols !== cols || state.rows !== rows) {
        state.cols = cols;
        state.rows = rows;
        initMatrix();
      } else {
        seedFrozenHeads();
      }
      measureZones();
    };
    measure();

    const onMove = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      pointer.x = event.clientX - box.left;
      pointer.y = event.clientY - box.top;
      target = 1;
    };
    const onLeave = () => {
      target = 0;
    };
    const onDown = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const ping = (pings.length === 5 ? pings.shift() : null) ?? {
        x: 0,
        y: 0,
        born: 0,
        life: 0.9,
        distances: new Float64Array(rows * cols),
        radius: CELL,
        fade: 1,
      };
      ping.x = event.clientX - box.left;
      ping.y = event.clientY - box.top;
      ping.born = performance.now();
      cachePingDistances(ping);
      pings.push(ping);
    };

    const paint = (now: number, t: number) => {
      renderer.beginFrame();

      const reach = POINTER_CELLS * CELL;
      const step = reduced ? 0 : Math.floor(t * 7);
      const elapsed = now - entranceT0;
      for (let i = 0; i < pings.length; i++) {
        const ping = pings[i];
        const age = (now - ping.born) / 1000 / ping.life;
        ping.radius = CELL * (1 + age * 9);
        ping.fade = (1 - age) * (1 - age);
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const index = r * cols + c;
          const delay = fieldDelay[index];
          if (!reduced && elapsed < delay) continue;
          const x = c * CELL;
          const y = r * CELL;
          const px = x + CELL / 2;
          const py = y + CELL / 2;
          const focus = fieldFocus[index];
          const flags = fieldFlags[index];
          const speck = (flags & 2) !== 0;
          const speckCenter = (flags & 4) !== 0;
          const frozen = (flags & 1) !== 0;
          const fstep = frozen ? 0 : step;

          // Matrix rain: symbol tail above the head, pixel lead below it.
          let lum = 0;
          let heat = 0;
          let char: string | null = null;
          let cursor = false;
          {
            const mc = matCols[c];
            // Drops freeze their fall inside the calm: the head position
            // snaps from the drop's own phase instead of the live clock, so
            // trails cannot crawl across the portrait, name, or card.
            const headY = frozen ? frozenHeads[c] : mc.y;
            const behind = headY - r;
            const ahead = r - headY;
            const dim = fieldDim[index];
            lum = 0.14 * dim;
            if (mc && behind >= 0 && behind < mc.len) {
              const inten = (1 - behind / mc.len) * dim;
              lum += inten ** 1.4 * 1.25;
              heat = Math.max(heat, inten * (1 - focus * (1 - FOCUS_BRIGHT)));
              char =
                GLYPHS[(c * 31 + r * 17 + fstep * 7 + mc.seed) % GLYPHS.length];
            } else if (!frozen && mc && ahead > 0 && ahead <= mc.lead) {
              const k = 1 - ahead / (mc.lead + 1);
              const amp = k * k * 0.55 * dim;
              lum += amp;
              heat = Math.max(heat, amp * (1 - focus * (1 - FOCUS_BRIGHT)));
              char =
                GLYPHS[(c * 29 + r * 13 + fstep * 5 + mc.seed) % GLYPHS.length];
            }
            // Trail cursor: one square riding just below the drop head.
            // Same cell lattice, so it reads as the trail tip.
            const cursorRow = Math.floor(mc.y) + 1;
            if (!frozen && r === cursorRow && mc.y > -2 && !reduced) {
              const blink =
                0.5 +
                0.5 * Math.sin(t * CURSOR_BLINK_HZ * Math.PI * 2 + mc.seed);
              const on = blink > 0.45 ? 1 : 0.12;
              const clamp = 1 - focus * 0.5;
              lum = Math.max(lum, (0.35 + 0.6 * on) * dim);
              heat = Math.max(heat, (0.2 + 0.55 * on) * clamp);
              char = null;
              cursor = true;
            }
          }
          let ox = 0;
          let oy = 0;
          let pushed = false;
          if (strength > 0.01) {
            const dx = px - pointer.x;
            const dy = py - pointer.y;
            if (Math.abs(dx) < reach && Math.abs(dy) < reach) {
              const d = Math.sqrt(dx * dx + dy * dy);
              if (d < reach && d > 0.01) {
                const f = 1 - d / reach;
                const push = f * f * 12 * strength;
                ox = (dx / d) * push;
                oy = (dy / d) * push;
                lum += f * f * strength * 0.5;
                heat = Math.max(heat, f * f * strength);
                pushed = true;
              }
            }
          }

          // User-triggered effects stay live even over the calm ambient bed.
          let stamped = false;
          for (let i = 0; i < pings.length; i++) {
            const p = pings[i];
            const pd = p.distances[index];
            const rad = p.radius;
            if (p.fade <= 2 && Math.abs(pd - rad) > pingTailDistance) {
              continue;
            }
            const amp =
              p.fade * Math.exp(-((pd - rad) * (pd - rad)) / (2 * 24 * 24));
            if (amp > 0.15) stamped = true;
            lum += amp * 1.1;
            heat = Math.max(heat, amp);
          }

          const revealAge = elapsed - delay;
          const reveal =
            reduced || revealAge > entranceTailTime
              ? 0
              : Math.exp(-revealAge / 140);
          lum += reveal * 0.3;
          heat = Math.max(heat, reveal);

          const threshold = fieldThreshold[index];
          // The entrance flash has its own brightness, independent of the
          // idle focus dimming that covers most of the mobile layout.
          const revealed = reveal > threshold;
          // Steady speckle bypasses the dither gate: it must read
          // everywhere, including the calm where lum never climbs.
          if (
            !revealed &&
            (speck || speckCenter) &&
            lum <= threshold &&
            !char
          ) {
            renderer.draw(
              index,
              '',
              palette.dim,
              (1 - focus * 0.72) * 0.55,
              ox,
              oy,
              true
            );
            continue;
          }
          if (!revealed && lum <= threshold && !char) continue;

          if (cursor && !revealed) {
            // Ambient trail tips blink only outside the frozen focus zones.
            const alpha = pushed || stamped ? 1 : 1 - focus * 0.5;
            const color =
              pushed || stamped || heat > 0.6
                ? palette.crest
                : heat > 0.3
                  ? palette.hover
                  : palette.mid;
            renderer.draw(index, '', color, alpha, ox, oy, true);
          } else if (
            revealed ||
            ((char || pushed || stamped) && lum > threshold)
          ) {
            // Magnet-pushed glyphs and the click ring pop to crest white;
            // whites elsewhere still take the hardest focus cut.
            const tier =
              pushed || stamped
                ? palette.crest
                : revealed
                  ? palette.lit
                  : heat > 0.6
                    ? focus > 0.3
                      ? palette.hover
                      : palette.crest
                    : heat > 0.3
                      ? focus > 0.3
                        ? palette.lit
                        : palette.hover
                      : heat > 0.12
                        ? palette.lit
                        : palette.mid;
            const alpha =
              pushed || stamped
                ? 1
                : revealed
                  ? reveal
                  : 1 - focus * (heat > 0.6 ? 0.9 : 0.72);
            renderer.draw(
              index,
              char ?? GLYPHS[(c * 17 + r * 41) % GLYPHS.length],
              tier,
              alpha,
              ox,
              oy,
              false
            );
          } else if (lum > threshold) {
            // Steady speckle (base or center ring): sparse dim pixels,
            // same focus fade as the bed glyphs. Never bright, never
            // blinking — both flags are pure functions of the cell.
            if (speck || speckCenter) {
              renderer.draw(
                index,
                '',
                palette.dim,
                (1 - focus * 0.72) * 0.55,
                ox,
                oy,
                true
              );
            } else {
              // Ambient bed or boosted empty cell: dim glyph, never a square,
              // so trails read as text throughout. Stable per-cell char keeps
              // the bed calm while rain tails cycle.
              renderer.draw(
                index,
                GLYPHS[(c * 17 + r * 41) % GLYPHS.length],
                heat > 0.25 ? palette.mid : palette.dim,
                (1 - focus * 0.72) * 0.8,
                ox,
                oy,
                false
              );
            }
          } else if (char) {
            // Dim tail/lead cells keep their glyph instead of collapsing to
            // a square, so trails read as text throughout. Same focus fade
            // as lit glyphs, dimmest tier.
            renderer.draw(
              index,
              char,
              palette.dim,
              (1 - focus * 0.72) * 0.8,
              ox,
              oy,
              false
            );
          }
        }
      }
      renderer.endFrame();
    };

    if (reduced) {
      paint(performance.now(), 0);
      const ro = new ResizeObserver(() => {
        measure();
        paint(performance.now(), 0);
      });
      ro.observe(hero);
      return () => ro.disconnect();
    }

    let raf = 0;
    let last = 0;
    let visible = true;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) {
        last = now;
        return;
      }
      if (now - last < 33) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.033);
      last = now;

      strength += (target - strength) * 0.18;
      let livePings = 0;
      for (let i = 0; i < pings.length; i++) {
        const ping = pings[i];
        if ((now - ping.born) / 1000 < ping.life) {
          pings[livePings++] = ping;
        }
      }
      pings.length = livePings;

      for (let c = 0; c < cols; c++) {
        const mc = matCols[c];
        const grow = Math.min(1, (now - mc.born) / 1200);
        mc.y += mc.speed * grow * dt;
        if (mc.y - mc.len > rows + 2) {
          const rest = rnd() < 0.3;
          mc.y = rest ? -20 - rnd() * rows : -4 - rnd() * 8;
          mc.speed = 5 + rnd() * 7;
          const again = rnd() < 0.12;
          mc.len = again
            ? 9 + Math.floor(rnd() * 5)
            : 4 + Math.floor(rnd() * 5);
          mc.lead = 2 + Math.floor(rnd() * 3);
          mc.born = now;
        }
      }

      paint(now, now / 1000);
    };
    raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(measure);
    ro.observe(hero);
    // Layout shifts after webfonts/images settle; re-measure once idle.
    let idleCallback: number | null = null;
    let idleTimeout: number | null = null;
    if (typeof requestIdleCallback === 'function') {
      idleCallback = requestIdleCallback(() => measureZones());
    } else {
      idleTimeout = window.setTimeout(() => measureZones(), 1500);
    }
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 }
    );
    io.observe(hero);
    const mo = new MutationObserver(() => {
      syncPalette();
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    if (interactive) {
      hero.addEventListener('pointermove', onMove);
      hero.addEventListener('pointerleave', onLeave);
      hero.addEventListener('pointerdown', onDown);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (idleCallback !== null) cancelIdleCallback(idleCallback);
      if (idleTimeout !== null) window.clearTimeout(idleTimeout);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      if (interactive) {
        hero.removeEventListener('pointermove', onMove);
        hero.removeEventListener('pointerleave', onLeave);
        hero.removeEventListener('pointerdown', onDown);
      }
    };
  }, [interactive]);

  return (
    <canvas
      className="pointer-events-none absolute inset-0 h-full w-full"
      ref={canvasRef}
    />
  );
}
