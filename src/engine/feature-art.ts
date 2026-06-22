import { createNoiseGenerators } from "./noise";

/**
 * Article / hobby feature-image art — abstract generative patterns.
 *
 * Each image is a full-bleed abstract pattern in ONE of the site's two visual
 * languages, in the site's own nature palette (Hokusai sea-indigo, cream foam,
 * warm sun, sandy earth, teal):
 *   - "seigaiha": Japanese fish-scale waves — uniform / perspective-swell /
 *     flowing-current sub-variants
 *   - "dots": Aboriginal-inspired dot work — concentric rings, arcs/U-shapes,
 *     ovals, and connecting journey lines on a stippled field
 * The seed (from the slug) drives style, palette, scale, and layout so two
 * pieces look clearly different yet share one design family.
 *
 * Shared by the in-browser preview page and the Node file generator, so what we
 * tune in preview is what ships.
 */

/** Ship resolution — landscape (1.91:1), doubles as the OG/social card. */
export const FEATURE_ART_WIDTH = 1200;
export const FEATURE_ART_HEIGHT = 630;

type RNG = () => number;
type Noise2D = (x: number, y: number) => number;

// ─── Colour helpers ──────────────────────────────────────────────

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hh = (((h % 360) + 360) % 360) / 360;
  const ss = Math.max(0, Math.min(1, s / 100));
  const ll = Math.max(0, Math.min(1, l / 100));
  if (ss === 0) {
    const v = Math.round(ll * 255);
    return [v, v, v];
  }
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;
  const hue = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [
    Math.round(hue(hh + 1 / 3) * 255),
    Math.round(hue(hh) * 255),
    Math.round(hue(hh - 1 / 3) * 255),
  ];
}

function col(h: number, s: number, l: number, a = 1): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return `rgba(${r},${g},${b},${a})`;
}

function pick<T>(rng: RNG, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function range(rng: RNG, lo: number, hi: number): number {
  return lo + rng() * (hi - lo);
}

// ─── Palette — the site's nature tones, varied within the family ─

interface Palette {
  bgTop: string;
  bgBottom: string;
  fills: string[]; // dot-work colours
  line: string; // ring / separator colour
  toneLight: string; // seigaiha band A (high-contrast pair…)
  toneDark: string; // …with band B
  ground: string; // seigaiha valley fill (no gaps)
  foam: string; // spray accents
  dark: boolean;
}

type Family =
  | "hokusai"
  | "deep-sea"
  | "river"
  | "warm-sun"
  | "sand-earth"
  | "teal-sea";

function makePalette(rng: RNG): Palette {
  // Weighted toward the site's signature sea-blues; warm/earth appear less often.
  const family = pick<Family>(rng, [
    "hokusai",
    "hokusai",
    "deep-sea",
    "deep-sea",
    "river",
    "warm-sun",
    "sand-earth",
    "teal-sea",
  ]);
  const jl = (l: number) => l + (rng() - 0.5) * 5; // ±2.5 lightness
  const jh = (h: number) => h + (rng() - 0.5) * 7; // ±3.5 hue
  const cream = (l = 86) => col(jh(44), 42, jl(l));

  switch (family) {
    case "hokusai": {
      const indigo = col(jh(212), 49, jl(33));
      const light = cream(86);
      return {
        bgTop: cream(90),
        bgBottom: cream(83),
        fills: [indigo, light, col(jh(216), 52, jl(23))],
        line: col(217, 46, 17),
        toneLight: light,
        toneDark: indigo,
        ground: col(jh(216), 52, jl(22)),
        foam: cream(90),
        dark: false,
      };
    }
    case "deep-sea": {
      const foam = cream(85);
      const sea = col(jh(208), 46, jl(42));
      return {
        bgTop: col(jh(217), 50, jl(13)),
        bgBottom: col(jh(214), 52, jl(18)),
        fills: [foam, sea, col(jh(196), 44, jl(56))],
        line: foam,
        toneLight: foam,
        toneDark: col(jh(214), 52, jl(26)),
        ground: col(jh(217), 52, jl(14)),
        foam,
        dark: true,
      };
    }
    case "river": {
      const foam = cream(88);
      const river = col(jh(197), 46, jl(50));
      return {
        bgTop: col(jh(200), 30, jl(91)),
        bgBottom: col(jh(200), 26, jl(84)),
        fills: [river, foam, col(jh(199), 40, jl(40))],
        line: col(205, 52, 22),
        toneLight: foam,
        toneDark: river,
        ground: col(jh(199), 38, jl(43)),
        foam,
        dark: false,
      };
    }
    case "warm-sun": {
      const amber = col(jh(40), 80, jl(58));
      const rust = col(jh(20), 78, jl(40));
      return {
        bgTop: cream(90),
        bgBottom: cream(82),
        fills: [rust, amber, col(jh(33), 80, jl(48))],
        line: col(18, 70, 22),
        toneLight: amber,
        toneDark: rust,
        ground: col(jh(28), 60, jl(44)),
        foam: cream(92),
        dark: false,
      };
    }
    case "sand-earth": {
      const sand = col(jh(38), 36, jl(84));
      const terracotta = col(jh(18), 72, jl(42));
      return {
        bgTop: sand,
        bgBottom: col(jh(34), 32, jl(77)),
        fills: [terracotta, col(jh(34), 60, jl(52)), col(jh(222), 15, jl(15))],
        line: col(220, 16, 15),
        toneLight: sand,
        toneDark: terracotta,
        ground: col(jh(20), 55, jl(38)),
        foam: col(jh(40), 40, jl(90)),
        dark: false,
      };
    }
    default: {
      // teal-sea
      const foam = cream(88);
      const teal = col(jh(186), 42, jl(40));
      return {
        bgTop: col(jh(186), 24, jl(90)),
        bgBottom: col(jh(189), 22, jl(82)),
        fills: [teal, foam, col(jh(171), 32, jl(46))],
        line: col(190, 50, 20),
        toneLight: foam,
        toneDark: teal,
        ground: col(jh(188), 44, jl(34)),
        foam,
        dark: false,
      };
    }
  }
}

function paintBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pal: Palette,
): void {
  const g = ctx.createLinearGradient(0, 0, w * 0.3, h);
  g.addColorStop(0, pal.bgTop);
  g.addColorStop(1, pal.bgBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// ─── Style A: Seigaiha ───────────────────────────────────────────

type SeigaihaVariant = "uniform" | "perspective" | "flow";

function drawSeigaiha(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rng: RNG,
  noise2D: Noise2D,
  pal: Palette,
): void {
  const variant = pick<SeigaihaVariant>(rng, [
    "uniform",
    "uniform",
    "perspective",
    "flow",
  ]);

  const bands = Math.round(range(rng, 4, 6));

  // Top-half domes (crowns up) — the conventional seigaiha orientation. Drawing
  // top-to-bottom with a downward extension keeps later rows overlapping cleanly.
  const arc = (cx: number, cy: number, r: number) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
  };

  // One fan: a dome PLUS a downward extension so the valleys/cusps between
  // scales never show the ground — no gaps.
  const fan = (cx: number, cy: number, R: number) => {
    const ext = R * 1.15;
    ctx.globalAlpha = 1;
    ctx.fillStyle = bands % 2 === 0 ? pal.toneLight : pal.toneDark;
    ctx.beginPath();
    ctx.arc(cx, cy, R, Math.PI, 2 * Math.PI);
    ctx.lineTo(cx + R, cy + ext);
    ctx.lineTo(cx - R, cy + ext);
    ctx.closePath();
    ctx.fill();
    for (let b = bands - 1; b >= 1; b--) {
      ctx.fillStyle = b % 2 === 0 ? pal.toneLight : pal.toneDark;
      arc(cx, cy, (R * b) / bands);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = pal.line;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = Math.max(0.75, R * 0.01);
    for (let b = 1; b <= bands; b++) {
      arc(cx, cy, (R * b) / bands);
      ctx.stroke();
    }
  };

  // Ground fill so nothing shows the page/bg between scales.
  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, 0, w, h);

  if (variant === "perspective") {
    const rTop = w / pick(rng, [10, 12, 14]);
    const rBottom = w / pick(rng, [3.5, 4, 5]);
    const overlap = range(rng, 0.56, 0.64);
    let row = 0;
    for (let cy = -rTop; cy < h + rBottom; row++) {
      const t = Math.max(0, Math.min(1, cy / h));
      const R = rTop + (rBottom - rTop) * t * t;
      const xShift = row % 2 === 0 ? 0 : R / 2;
      for (let cx = -R + xShift; cx < w + R; cx += R) fan(cx, cy, R);
      cy += R * overlap;
    }
    ctx.globalAlpha = 1;
    return;
  }

  // uniform & flow
  const R = w / pick(rng, [3.5, 4, 5, 6, 8]);
  const pitchY = R * range(rng, 0.55, 0.64);
  const flow = variant === "flow";
  const amp = flow ? R * range(rng, 0.22, 0.36) : 0;
  let row = 0;
  for (let cy = -R; cy < h + R + amp; cy += pitchY, row++) {
    const xShift = row % 2 === 0 ? 0 : R / 2;
    for (let cx = -R + xShift; cx < w + R; cx += R) {
      const dy = flow ? noise2D(cx * 0.004, row * 0.35) * amp : 0;
      fan(cx, cy + dy, R);
    }
  }
  ctx.globalAlpha = 1;
}

// ─── Style B: Aboriginal-inspired dot work (varied shapes) ───────

// Jittered "hand-painted" dot along a ring/arc/oval path.
function dot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  rng: RNG,
): void {
  ctx.globalAlpha = 0.9 + rng() * 0.1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r * (0.85 + rng() * 0.3), 0, Math.PI * 2);
  ctx.fill();
}

// Concentric rings of dots over an angular sweep (full circle, arc, or U).
function drawDotRings(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  maxR: number,
  dotR: number,
  rng: RNG,
  cols: string[],
  a0 = 0,
  a1 = Math.PI * 2,
  ry = 1, // y-radius multiplier → ovals when ≠ 1
): void {
  const ringSpacing = dotR * range(rng, 2.0, 2.5);
  const rings = Math.max(2, Math.floor(maxR / ringSpacing));
  if (a1 - a0 >= Math.PI * 2) dot(ctx, cx, cy, dotR * 1.2, cols[0], rng);
  for (let ring = 1; ring <= rings; ring++) {
    const rad = ring * ringSpacing;
    const arcLen = (a1 - a0) * rad;
    const count = Math.max(2, Math.floor(arcLen / (dotR * 2 * 1.2)) + 1);
    const ringColor = cols[ring % cols.length];
    const phase = (a1 - a0 >= Math.PI * 2 ? rng() * 0.5 : 0) + ring * 0.12;
    for (let i = 0; i < count; i++) {
      const theta = a0 + ((a1 - a0) * i) / (count - 1 || 1) + phase * 0.1;
      const rj = (rng() - 0.5) * ringSpacing * 0.3;
      const x = cx + Math.cos(theta) * (rad + rj);
      const y = cy + Math.sin(theta) * (rad + rj) * ry;
      dot(ctx, x, y, dotR, ringColor, rng);
    }
  }
  ctx.globalAlpha = 1;
}

// A meandering dotted "journey" line between two points.
function drawDotLine(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  dotR: number,
  color: string,
  rng: RNG,
  noise2D: Noise2D,
): void {
  const steps = Math.max(
    6,
    Math.round(Math.hypot(x1 - x0, y1 - y0) / (dotR * 2.2)),
  );
  const nx = -(y1 - y0);
  const ny = x1 - x0;
  const nlen = Math.hypot(nx, ny) || 1;
  const amp = range(rng, 0.04, 0.12) * Math.hypot(x1 - x0, y1 - y0);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const wob = noise2D(t * 3 + x0 * 0.001, y0 * 0.001) * amp;
    const x = x0 + (x1 - x0) * t + (nx / nlen) * wob;
    const y = y0 + (y1 - y0) * t + (ny / nlen) * wob;
    dot(ctx, x, y, dotR, color, rng);
  }
  ctx.globalAlpha = 1;
}

const DOT_ANCHORS: [number, number][] = [
  [0.28, 0.22],
  [0.7, 0.3],
  [0.4, 0.5],
  [0.72, 0.62],
  [0.26, 0.7],
  [0.5, 0.84],
  [0.5, 0.12],
  [0.2, 0.46],
];

function drawDotArt(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rng: RNG,
  noise2D: Noise2D,
  pal: Palette,
): void {
  const cols = pal.fills;

  // Background stipple.
  const stipple = pal.dark ? col(0, 0, 100, 0.08) : col(0, 0, 0, 0.06);
  const step = 18;
  ctx.fillStyle = stipple;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (noise2D(x * 0.011, y * 0.011) > -0.05) {
        ctx.beginPath();
        ctx.arc(
          x + (rng() - 0.5) * step,
          y + (rng() - 0.5) * step,
          2.3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  }

  const motifCount = Math.round(range(rng, 4, 7));
  const anchors = [...DOT_ANCHORS].sort(() => rng() - 0.5).slice(0, motifCount);
  const centers: [number, number][] = [];

  anchors.forEach(([ax, ay], m) => {
    const cx = (ax + (rng() - 0.5) * 0.12) * w;
    const cy = (ay + (rng() - 0.5) * 0.12) * h;
    centers.push([cx, cy]);
    const maxR = range(rng, 0.16, 0.32) * Math.min(w, h) * (m === 0 ? 1.4 : 1);
    const dotR = range(rng, 5, 9);
    const start = Math.floor(rng() * cols.length);
    const motifCols = cols.map((_, i) => cols[(i + start) % cols.length]);
    const shape = pick(rng, ["ring", "ring", "arc", "u", "oval"] as const);
    if (shape === "ring") {
      drawDotRings(ctx, cx, cy, maxR, dotR, rng, motifCols);
    } else if (shape === "oval") {
      drawDotRings(
        ctx,
        cx,
        cy,
        maxR,
        dotR,
        rng,
        motifCols,
        0,
        Math.PI * 2,
        range(rng, 0.55, 0.8),
      );
    } else if (shape === "arc") {
      const a0 = rng() * Math.PI * 2;
      drawDotRings(
        ctx,
        cx,
        cy,
        maxR,
        dotR,
        rng,
        motifCols,
        a0,
        a0 + Math.PI * range(rng, 0.7, 1.1),
      );
    } else {
      // U-shape: lower half-arc
      drawDotRings(ctx, cx, cy, maxR, dotR, rng, motifCols, 0, Math.PI);
    }
  });

  // A couple of connecting journey lines between motif centres.
  const lines = Math.round(range(rng, 1, 3));
  for (let i = 0; i < lines && centers.length >= 2; i++) {
    const a = centers[Math.floor(rng() * centers.length)];
    const b = centers[Math.floor(rng() * centers.length)];
    if (a === b) continue;
    drawDotLine(
      ctx,
      a[0],
      a[1],
      b[0],
      b[1],
      range(rng, 3.5, 5),
      pick(rng, cols),
      rng,
      noise2D,
    );
  }
  ctx.globalAlpha = 1;
}

// ─── Public API ──────────────────────────────────────────────────

export interface FeatureArtOptions {
  width: number;
  height: number;
  seed: number;
  /** Force a visual language (preview/tuning only). Default: chosen by seed. */
  forceStyle?: "seigaiha" | "dots";
}

export function renderFeatureArt(
  ctx: CanvasRenderingContext2D,
  { width, height, seed, forceStyle }: FeatureArtOptions,
): void {
  const { rng, noise2D } = createNoiseGenerators(seed);
  const pal = makePalette(rng);

  paintBackground(ctx, width, height, pal);

  const roll = rng();
  const seigaiha = forceStyle ? forceStyle === "seigaiha" : roll < 0.5;

  if (seigaiha) {
    drawSeigaiha(ctx, width, height, rng, noise2D, pal);
  } else {
    drawDotArt(ctx, width, height, rng, noise2D, pal);
  }
}

/**
 * Deterministic slug → 32-bit seed. Generalizes the polynomial rolling hash
 * (`hash * 31 + charCode`) previously used by DailyProfileOverlay's
 * `getArticlePattern`, returning a full unsigned 32-bit value.
 */
export function seedFromSlug(slug: string): number {
  let hash = 7;
  for (let i = 0; i < slug.length; i++) {
    hash = (Math.imul(hash, 31) + slug.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/**
 * Latest-Reads fallback tiles. Readwise items are unbounded and fetched at
 * request time, so we can't pre-render one per URL. Instead the build generates
 * a fixed pool of generative tiles and each read deterministically maps to one.
 */
export const READS_FALLBACK_POOL = 12;

/** Public path of the fallback tile for a read, keyed by its URL (or title). */
export function readsFallbackImage(basis: string): string {
  const i = seedFromSlug(basis) % READS_FALLBACK_POOL;
  return `/images/reads/fallback-${String(i).padStart(2, "0")}.webp`;
}
