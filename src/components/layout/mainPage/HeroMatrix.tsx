'use client';

import { useEffect, useRef } from 'react';

const CELL = 14;
const POINTER_CELLS = 6;
const GLYPHS = '>_/\\{}[]();:+*#$%&01';

// Ambient speckle: sparse steady pixels across the whole field, plus the
// blinking cursor square that rides at the bottom of each rain trail.
// Tune density / blink rate here.
const SPECKLE_DENSITY = 0.014;
const CURSOR_BLINK_HZ = 1.1;

// Focus/exclusion fields: soft ellipses measured from the live DOM — the
// identity row (portrait + name + role) and the about block (heading +
// card), each padded and feathered. Tune padding/feather/floors below.
const ZONE_PAD_X = 24;
const ZONE_PAD_Y = 28;
const ABOUT_PAD_X = 40;
const ABOUT_PAD_Y = 40;
// Softness of the zone edges: larger = wider feather, no visible boundary.
const FOCUS_FEATHER = 0.55;
// Strongest-point floors: opacity, brightness, and tail keep fraction
// (0.5 keep ≈ 50% fewer drops at the core). Speed is never touched.
const FOCUS_OPACITY = 0.28;
const FOCUS_BRIGHT = 0.55;
const FOCUS_DENSITY = 0.5;

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
  dim: '#d9cdf9',
  mid: '#a582f5',
  lit: '#7c3aed',
  hover: '#6d28d9',
  crest: '#5b21b6',
};

interface RainColumn {
  y: number;
  speed: number;
  len: number;
  seed: number;
  lead: number;
  born: number;
  cursor: boolean;
  cursorFrozen: boolean;
}

interface Ping {
  x: number;
  y: number;
  born: number;
  life: number;
}

/**
 * Matrix-rain ground for the hero (docs/DESIGN.md §6): a transparent canvas
 * behind the untouched hero/about content. Symbol drops fall with a short
 * pixel lead, the pointer repels cells (magnet, 6 cells), clicks stamp a
 * disc ping, and the field resolves center-out on mount. Transparent so the
 * section band and both themes show through; static frame under
 * prefers-reduced-motion; idle when off-screen.
 */
export function HeroMatrix() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.parentElement;
    if (!canvas || !hero) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    let seed = 0x9451ff;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const jitter = new Float32Array(64 * 64);
    for (let i = 0; i < jitter.length; i++) jitter[i] = rnd();

    let W = 0;
    let H = 0;
    let cols = 0;
    let rows = 0;
    let matCols: RainColumn[] = [];
    const entranceT0 = performance.now();

    const initMatrix = () => {
      matCols = [];
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
        matCols.push({
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
          cursor: false,
          cursorFrozen: false,
        });
      }
    };

    // Ellipse zones from the rendered content boxes, in canvas px. Identity
    // and about are tagged with data-hero-zone; padded, feathered, and
    // re-measured on resize so they track layout instead of hardcoding.
    let zones: Array<[number, number, number, number]> = [];
    const measureZones = () => {
      const heroBox = hero.getBoundingClientRect();
      const zone = (name: string, padX: number, padY: number) => {
        const el = hero.querySelector(`[data-hero-zone="${name}"]`);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        if (b.width < 1 || b.height < 1) return null;
        const cx = b.left - heroBox.left + b.width / 2;
        const cy = b.top - heroBox.top + b.height / 2;
        return [cx, cy, b.width / 2 + padX, b.height / 2 + padY] as [
          number,
          number,
          number,
          number,
        ];
      };
      zones = [
        zone('identity', ZONE_PAD_X, ZONE_PAD_Y),
        zone('about', ABOUT_PAD_X, ABOUT_PAD_Y),
      ].filter((z): z is [number, number, number, number] => z !== null);
    };

    const measure = () => {
      const box = hero.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(box.width));
      H = Math.max(1, Math.round(box.height));
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / CELL) + 2;
      rows = Math.ceil(H / CELL) + 2;
      initMatrix();
      measureZones();
    };
    measure();

    const pointer = { x: -1e4, y: -1e4 };
    let strength = 0;
    let target = 0;
    let pings: Ping[] = [];

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
      pings = [
        ...pings.slice(-4),
        {
          x: event.clientX - box.left,
          y: event.clientY - box.top,
          born: performance.now(),
          life: 0.9,
        },
      ];
    };

    const gate = (c: number, r: number, now: number) => {
      if (reduced) return null;
      const elapsed = now - entranceT0;
      const cc = cols / 2;
      const cr = rows / 2;
      const delay =
        Math.sqrt((c - cc) * (c - cc) + (r - cr) * (r - cr)) * 26 +
        jitter[(r & 63) * 64 + (c & 63)] * 320;
      if (elapsed < delay) return { hidden: true, boost: 0 };
      return {
        hidden: false,
        boost: Math.exp(-(elapsed - delay) / 140) * 0.3,
      };
    };

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

    const paint = (now: number, t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.font = `${CELL - 2}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const reach = POINTER_CELLS * CELL;
      const step = reduced ? 0 : Math.floor(t * 7);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * CELL;
          const y = r * CELL;
          const px = x + CELL / 2;
          const py = y + CELL / 2;
          // Focus fields: the rain recedes around the identity and about
          // content. Opacity and brightness fall with focus; whites dim
          // hardest, saturated purples step down, density thins by spawn
          // skip. Speed and motion are untouched.
          const focus = focusAt(px, py);
          const calm = focus * (0.5 + 0.5 * jitter[(r & 63) * 64 + (c & 63)]);
          // Ambient speckle: pure function of the cell, no time term —
          // steady pixels, never blinking.
          const speck = jitter[(r * 73 + c * 37) & 4095] < SPECKLE_DENSITY;
          // Frozen cells render from a fixed clock: every time term below
          // (rain cycle, blink, entrance wavefront) reads this instead, so
          // the calm truly cannot shimmer.
          const frozen = focus > 0.3;
          const fstep = frozen ? 0 : step;
          const fnow = frozen ? entranceT0 + 100000 : now;

          // Matrix rain: symbol tail above the head, pixel lead below it.
          let lum = 0;
          let heat = 0;
          let char: string | null = null;
          {
            const mc = matCols[c];
            // Drops freeze their fall inside the calm: the head position
            // snaps from the drop's own phase instead of the live clock, so
            // trails cannot crawl across the portrait, name, or card.
            const headY = frozen ? mc.seed % Math.max(1, rows + 20) : mc.y;
            const behind = headY - r;
            const ahead = r - headY;
            const dim = 1 - focus * (1 - FOCUS_OPACITY);
            lum = 0.14 * dim;
            if (
              mc &&
              behind >= 0 &&
              behind < mc.len &&
              calm < FOCUS_DENSITY + focus * 0.6
            ) {
              const inten = (1 - behind / mc.len) * dim;
              lum += inten ** 1.4 * 1.25;
              heat = Math.max(heat, inten * (1 - focus * (1 - FOCUS_BRIGHT)));
              char =
                GLYPHS[(c * 31 + r * 17 + fstep * 7 + mc.seed) % GLYPHS.length];
            } else if (mc && ahead > 0 && ahead <= mc.lead) {
              const k = 1 - ahead / (mc.lead + 1);
              const amp = k * k * 0.55 * dim;
              // Lead cells inside the zones stay fully dark too: the
              // pixel-lead would otherwise shimmer where the tip was cut.
              if (frozen) {
                lum = Math.max(lum, 0);
                heat = Math.max(heat, 0);
                char = null;
              } else {
                lum += amp;
                heat = Math.max(heat, amp * (1 - focus * (1 - FOCUS_BRIGHT)));
                char =
                  GLYPHS[
                    (c * 29 + r * 13 + fstep * 5 + mc.seed) % GLYPHS.length
                  ];
              }
            }
            // Trail cursor: one square riding just below the drop head.
            // Same cell lattice, so it reads as the trail tip.
            const cursorRow = Math.floor(mc.y) + 1;
            if (frozen) {
              // Inside the zones the trail ends at its last glyph: no
              // square at all, so the tip can never shimmer on the calm.
              mc.cursor = false;
              mc.cursorFrozen = false;
            } else if (r === cursorRow && mc.y > -2 && !reduced) {
              const blink =
                0.5 +
                0.5 * Math.sin(t * CURSOR_BLINK_HZ * Math.PI * 2 + mc.seed);
              const on = blink > 0.45 ? 1 : 0.12;
              const clamp = 1 - focus * 0.5;
              lum = Math.max(lum, (0.35 + 0.6 * on) * dim);
              heat = Math.max(heat, (0.2 + 0.55 * on) * clamp);
              char = null;
              mc.cursor = true;
              mc.cursorFrozen = false;
            } else {
              mc.cursor = false;
              mc.cursorFrozen = false;
            }
          }
          let ox = 0;
          let oy = 0;
          const dx = px - pointer.x;
          const dy = py - pointer.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          let pushed = false;
          if (!frozen && strength > 0.01 && d < reach && d > 0.01) {
            const f = 1 - d / reach;
            const push = f * f * 12 * strength;
            ox = (dx / d) * push;
            oy = (dy / d) * push;
            lum += f * f * strength * 0.5;
            heat = Math.max(heat, f * f * strength);
            pushed = true;
          }

          // Disc ping stamps. Frozen cells read the fixed clock so a stale
          // ring can never throb behind the calm.
          let stamped = false;
          if (!frozen) {
            for (const p of pings) {
              const age = (now - p.born) / 1000 / p.life;
              const rad = CELL * (1 + age * 9);
              const pdx = px - p.x;
              const pdy = py - p.y;
              const pd = Math.sqrt(pdx * pdx + pdy * pdy);
              const amp =
                (1 - age) *
                (1 - age) *
                Math.exp(-((pd - rad) * (pd - rad)) / (2 * 24 * 24));
              if (amp > 0.15) stamped = true;
              lum += amp * 1.1;
              heat = Math.max(heat, amp);
            }
          }

          const g = gate(c, r, fnow);
          if (g?.hidden) continue;
          if (g?.boost) {
            lum += g.boost;
            heat = Math.max(heat, Math.min(1, g.boost));
          }

          const threshold =
            0.78 * ((BAYER[(r & 7) * 8 + (c & 7)] + 0.5) / 64) +
            0.22 * jitter[(r & 63) * 64 + (c & 63)];
          if (lum <= threshold && !char) continue;

          if (matCols[c]?.cursor) {
            // Trail tip: blinking square on the heat ramp. Frozen cells
            // never set cursor, so this branch always blinks by design.
            ctx.globalAlpha = 1 - focus * 0.5;
            ctx.fillStyle =
              heat > 0.6
                ? palette.crest
                : heat > 0.3
                  ? palette.hover
                  : palette.mid;
            ctx.fillRect(x + ox, y + oy, CELL, CELL);
            ctx.globalAlpha = 1;
          } else if (char && lum > threshold) {
            // Magnet-pushed glyphs and the click ring pop to crest white;
            // whites elsewhere still take the hardest focus cut.
            const tier =
              pushed || stamped
                ? palette.crest
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
            ctx.globalAlpha =
              pushed || stamped ? 1 : 1 - focus * (heat > 0.6 ? 0.9 : 0.72);
            ctx.fillStyle = tier;
            ctx.fillText(char, x + CELL / 2 + ox, y + CELL / 2 + 1 + oy);
            ctx.globalAlpha = 1;
          } else if (lum > threshold) {
            // Ambient speckle: sparse steady pixels, dim tier, same focus
            // fade as the bed glyphs. Never glyphs, never bright, never
            // blinking — `speck` is a pure function of the cell.
            if (speck) {
              ctx.globalAlpha = (1 - focus * 0.72) * 0.55;
              ctx.fillStyle = palette.dim;
              ctx.fillRect(x + ox, y + oy, CELL, CELL);
              ctx.globalAlpha = 1;
            } else {
              // Ambient bed or boosted empty cell: dim glyph, never a square,
              // so trails read as text throughout. Stable per-cell char keeps
              // the bed calm while rain tails cycle.
              ctx.globalAlpha = (1 - focus * 0.72) * 0.8;
              ctx.fillStyle = heat > 0.25 ? palette.mid : palette.dim;
              ctx.fillText(
                GLYPHS[(c * 17 + r * 41) % GLYPHS.length],
                x + CELL / 2 + ox,
                y + CELL / 2 + 1 + oy
              );
              ctx.globalAlpha = 1;
            }
          } else if (char) {
            // Dim tail/lead cells keep their glyph instead of collapsing to
            // a square, so trails read as text throughout. Same focus fade
            // as lit glyphs, dimmest tier.
            ctx.globalAlpha = (1 - focus * 0.72) * 0.8;
            ctx.fillStyle = palette.dim;
            ctx.fillText(char, x + CELL / 2 + ox, y + CELL / 2 + 1 + oy);
            ctx.globalAlpha = 1;
          }
        }
      }
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
      pings = pings.filter((p) => (now - p.born) / 1000 < p.life);

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
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => measureZones());
    } else {
      setTimeout(() => measureZones(), 1500);
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
    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', onLeave);
    hero.addEventListener('pointerdown', onDown);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      hero.removeEventListener('pointerdown', onDown);
    };
  }, []);

  return (
    <canvas
      className="pointer-events-none absolute inset-0 h-full w-full"
      ref={canvasRef}
    />
  );
}
