/**
 * Glitch-art tentacles: the tentacle shape is never drawn directly.
 * Instead, the PNG silhouette is used as an alpha mask that drives
 * per-pixel distortion effects applied to the rendered scene beneath.
 *
 * The read region spans the full canvas width (for bleed tears) and
 * extends above the mask into the sky (for sky static). All coordinates
 * passed to getImageData/putImageData are in physical pixels (scaled by
 * DPR). The mask is stored at logical resolution; helpers map physical
 * pixel coords -> mask coords by dividing by DPR and subtracting offsets.
 *
 * A temporal burst system drives intensity: calm periods punctuated by
 * violent spikes every few seconds. All effect intensities are controlled
 * by GlitchParams on the state object, exposed via the control sidebar.
 */

import { getCanvas2DContext } from "./canvas";
import {
  GlitchParams,
  TentacleGlitchState,
  createDefaultGlitchParams,
} from "./types";

type Noise2D = (x: number, y: number) => number;

// ---------------------------------------------------------------------------
// Image loading
// ---------------------------------------------------------------------------

export function loadTentaclesImage(
  src = "/images/tentacles.png",
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Minimum on-screen width (logical px) for the sea creature. It never renders
 *  smaller than this at any viewport; it only grows on very large desktops
 *  where 63% of the viewport already exceeds it. Keeps the creature dominant on
 *  phones and consistent across breakpoints (no size dip at the 640px line). */
export const MIN_CREATURE_WIDTH = 843;

export function getTentaclesRenderSize(
  canvasWidth: number,
  canvasHeight: number,
): { width: number; height: number } {
  const targetWidth = Math.max(MIN_CREATURE_WIDTH, canvasWidth * 0.63);
  const aspectRatio = 1024 / 1536;
  const targetHeight = targetWidth * aspectRatio;
  return { width: Math.round(targetWidth), height: Math.round(targetHeight) };
}

function getTentaclePlacement(
  canvasWidth: number,
  canvasHeight: number,
  horizonBaseY: number,
): { width: number; height: number; x: number; y: number } {
  const size = getTentaclesRenderSize(canvasWidth, canvasHeight);
  // Anchor the right edge ~5% in from the viewport's right. When the creature
  // fits, it's fully visible (the desktop composition); when it's wider than
  // the viewport (phones, where it's oversized), the right side bleeds off
  // while the left edge stays pinned on-screen via max(0, …). Keeping x >= 0
  // keeps the glitch renderer's `maskPx = max(0, x*dpr)` clamp aligned.
  const x = Math.max(0, canvasWidth - size.width - canvasWidth * 0.05);

  const seaHeight = canvasHeight - horizonBaseY;
  const ROW_COUNT = 12;
  let totalRaw = 0;
  const cumulative: number[] = [];
  for (let i = 0; i < ROW_COUNT; i++) {
    const t = i / Math.max(ROW_COUNT - 1, 1);
    const s = 0.4 + t * t * t * 3.6;
    cumulative.push(totalRaw);
    totalRaw += s;
  }
  const spacingScale = (seaHeight * 1.05) / totalRaw;
  const row7Y = horizonBaseY + cumulative[7] * spacingScale;
  const y = row7Y - size.height * 0.7;

  return {
    width: size.width,
    height: size.height,
    x: Math.round(x),
    y: Math.round(y),
  };
}

// ---------------------------------------------------------------------------
// Mask extraction
// ---------------------------------------------------------------------------

export function createTentacleMask(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
): Uint8Array {
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = getCanvas2DContext(canvas);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const src = imageData.data;
  const mask = new Uint8Array(targetWidth * targetHeight);

  for (let i = 0; i < mask.length; i++) {
    const r = src[i * 4];
    const g = src[i * 4 + 1];
    const b = src[i * 4 + 2];
    const a = src[i * 4 + 3];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const darkness = (1 - lum / 255) * (a / 255);
    mask[i] = Math.round(darkness * 255);
  }

  return mask;
}

export function createGlitchState(
  img: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  horizonBaseY: number,
): TentacleGlitchState {
  const placement = getTentaclePlacement(
    canvasWidth,
    canvasHeight,
    horizonBaseY,
  );
  const mask = createTentacleMask(img, placement.width, placement.height);

  return {
    mask,
    maskWidth: placement.width,
    maskHeight: placement.height,
    x: placement.x,
    y: placement.y,
    blockSeed: 0,
    lastBlockUpdate: 0,
    params: createDefaultGlitchParams(),
  };
}

// ---------------------------------------------------------------------------
// Temporal burst system
// ---------------------------------------------------------------------------

function computeBurstIntensity(
  time: number,
  noise2D: Noise2D,
  p: GlitchParams,
): number {
  const n1 = noise2D(42.0, time * 0.3);
  const n2 = noise2D(99.0, time * 1.5);

  if (n1 < p.burstThreshold) return p.burstBase;

  const burstStrength = Math.min(
    1,
    (n1 - p.burstThreshold) / (1 - p.burstThreshold),
  );
  const flicker = 0.7 + 0.3 * Math.abs(n2);
  return (
    p.burstBase + (1 - p.burstBase) * burstStrength * burstStrength * flicker
  );
}

// ---------------------------------------------------------------------------
// Mask lookup helpers (with offset into wider read buffer)
// ---------------------------------------------------------------------------

function maskAt(
  mask: Uint8Array,
  mw: number,
  mh: number,
  px: number,
  py: number,
  dpr: number,
  offX: number,
  offY: number,
): number {
  const lx = Math.floor((px - offX) / dpr);
  const ly = Math.floor((py - offY) / dpr);
  if (lx < 0 || lx >= mw || ly < 0 || ly >= mh) return 0;
  return mask[ly * mw + lx] / 255;
}

function maskByteAt(
  mask: Uint8Array,
  mw: number,
  mh: number,
  px: number,
  py: number,
  dpr: number,
  offX: number,
  offY: number,
): number {
  const lx = Math.floor((px - offX) / dpr);
  const ly = Math.floor((py - offY) / dpr);
  if (lx < 0 || lx >= mw || ly < 0 || ly >= mh) return 0;
  return mask[ly * mw + lx];
}

function maxMaskOnRow(
  mask: Uint8Array,
  mw: number,
  mh: number,
  py: number,
  dpr: number,
  offY: number,
): number {
  const ly = Math.floor((py - offY) / dpr);
  if (ly < 0 || ly >= mh) return 0;
  let max = 0;
  for (let mx = 0; mx < mw; mx++) {
    const v = mask[ly * mw + mx];
    if (v > max) max = v;
  }
  return max;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

const BLOCK_UPDATE_INTERVAL = 0.25;

function hashInt(input: number): number {
  let value = input ^ 61 ^ (input >>> 16);
  value += value << 3;
  value ^= value >>> 4;
  value *= 0x27d4eb2d;
  value ^= value >>> 15;
  return value >>> 0;
}

const ALIEN_COLORS: [number, number, number][] = [
  [255, 20, 147], // hot pink
  [0, 255, 255], // electric cyan
  [57, 255, 20], // neon green
  [255, 0, 255], // magenta
];

// Reusable scratch buffer for passes that need a snapshot of the read region
// before mutating it (channel separation, block corruption). Grown on demand
// and reused across frames to avoid per-frame allocation / GC churn.
let scratchBuf: Uint8ClampedArray = new Uint8ClampedArray(0);

function snapshot(data: Uint8ClampedArray): Uint8ClampedArray {
  if (scratchBuf.length < data.length) {
    scratchBuf = new Uint8ClampedArray(data.length);
  }
  scratchBuf.set(data);
  return scratchBuf;
}

// ---------------------------------------------------------------------------
// Effect: Horizontal scanline displacement (mask-contained)
// ---------------------------------------------------------------------------

function applyHorizontalDisplacement(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  mask: Uint8Array,
  mw: number,
  mh: number,
  dpr: number,
  offX: number,
  offY: number,
  time: number,
  noise2D: Noise2D,
  burst: number,
  maxShift: number,
) {
  const MAX_SHIFT = Math.round(maxShift * dpr * burst);
  if (MAX_SHIFT === 0) return;
  const rowBuf = new Uint8ClampedArray(w * 4);

  for (let y = 0; y < h; y++) {
    const rowMax = maxMaskOnRow(mask, mw, mh, y, dpr, offY);
    if (rowMax < 10) continue;

    const intensity = rowMax / 255;
    const logicalY = y / dpr;
    const noiseVal = noise2D(logicalY * 0.04, time * 1.8);
    const localBurst =
      Math.abs(noise2D(logicalY * 0.15, time * 3.5)) > 0.6 ? 3.0 : 1.0;
    const shift = Math.round(noiseVal * MAX_SHIFT * intensity * localBurst);
    if (shift === 0) continue;

    const rowStart = y * w * 4;
    rowBuf.set(data.subarray(rowStart, rowStart + w * 4));

    for (let x = 0; x < w; x++) {
      const mv = maskAt(mask, mw, mh, x, y, dpr, offX, offY);
      if (mv < 0.04) continue;

      const sx = x - Math.round(shift * mv);
      if (sx < 0 || sx >= w) continue;

      const di = rowStart + x * 4;
      const si = sx * 4;
      data[di] = rowBuf[si];
      data[di + 1] = rowBuf[si + 1];
      data[di + 2] = rowBuf[si + 2];
    }
  }
}

// ---------------------------------------------------------------------------
// Effect: Chromatic aberration (mask-contained)
// ---------------------------------------------------------------------------

function applyChannelSeparation(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  mask: Uint8Array,
  mw: number,
  mh: number,
  dpr: number,
  offX: number,
  offY: number,
  time: number,
  burst: number,
  maxOffset: number,
) {
  const MAX_OFFSET = Math.round(maxOffset * dpr * burst);
  if (MAX_OFFSET === 0) return;
  const pulse = 0.6 + 0.4 * Math.sin(time * 2.2);
  const rOff = Math.round(-MAX_OFFSET * pulse);
  const bOff = Math.round(MAX_OFFSET * pulse);

  const copy = snapshot(data);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const mv = maskAt(mask, mw, mh, x, y, dpr, offX, offY);
      if (mv < 0.08) continue;

      const di = (y * w + x) * 4;
      const rx = Math.max(0, Math.min(w - 1, x + Math.round(rOff * mv)));
      data[di] = copy[(y * w + rx) * 4];

      const bx = Math.max(0, Math.min(w - 1, x + Math.round(bOff * mv)));
      data[di + 2] = copy[(y * w + bx) * 4 + 2];
    }
  }
}

// ---------------------------------------------------------------------------
// Effect: Alien color injection (mask-contained)
// ---------------------------------------------------------------------------

function applyAlienColors(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  mask: Uint8Array,
  mw: number,
  mh: number,
  dpr: number,
  offX: number,
  offY: number,
  time: number,
  burst: number,
  density: number,
) {
  if (density <= 0) return;
  const scale = density * 2;
  const baseProbability =
    (0.03 + 0.17 * Math.max(0, (burst - 0.3) / 0.7)) * scale;
  const minMask = burst > 0.6 ? 0.15 : 0.3;
  const quantizedTime = Math.floor(time * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const mv = maskAt(mask, mw, mh, x, y, dpr, offX, offY);
      if (mv < minMask) continue;

      const hash = hashInt(x * 17 + y * 1013 + quantizedTime * 7919);
      if ((hash % 1000) / 1000 > baseProbability * mv) continue;

      const colorIdx = hash % ALIEN_COLORS.length;
      const [cr, cg, cb] = ALIEN_COLORS[colorIdx];
      const blend = mv * (0.5 + 0.5 * burst);

      const di = (y * w + x) * 4;
      data[di] = Math.round(data[di] * (1 - blend) + cr * blend);
      data[di + 1] = Math.round(data[di + 1] * (1 - blend) + cg * blend);
      data[di + 2] = Math.round(data[di + 2] * (1 - blend) + cb * blend);
    }
  }
}

// ---------------------------------------------------------------------------
// Effect: CRT scan lines (mask-contained)
// ---------------------------------------------------------------------------

function applyScanLines(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  mask: Uint8Array,
  mw: number,
  mh: number,
  dpr: number,
  offX: number,
  offY: number,
  time: number,
  burst: number,
  intensity: number,
) {
  if (intensity <= 0) return;
  const SCAN_PERIOD = Math.max(2, Math.round(3 * dpr));
  const drift = Math.floor(time * 40) % SCAN_PERIOD;
  const darkFactor = intensity * burst;
  const brightFactor = intensity * 0.54 * burst;

  for (let y = 0; y < h; y++) {
    const scanPhase = (y + drift) % SCAN_PERIOD;
    const isDark = scanPhase === 0;
    const isBright = scanPhase === 1;
    if (!isDark && !isBright) continue;

    for (let x = 0; x < w; x++) {
      const mv = maskAt(mask, mw, mh, x, y, dpr, offX, offY);
      if (mv < 0.05) continue;

      const di = (y * w + x) * 4;
      const factor = isDark ? 1 - darkFactor * mv : 1 + brightFactor * mv;
      data[di] = Math.min(255, Math.round(data[di] * factor));
      data[di + 1] = Math.min(255, Math.round(data[di + 1] * factor));
      data[di + 2] = Math.min(255, Math.round(data[di + 2] * factor));
    }
  }
}

// ---------------------------------------------------------------------------
// Effect: Block corruption (mask-contained)
// ---------------------------------------------------------------------------

function applyBlockCorruption(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  mask: Uint8Array,
  mw: number,
  mh: number,
  dpr: number,
  offX: number,
  offY: number,
  blockSeed: number,
  burst: number,
  maxBlocks: number,
) {
  const BLOCK_COUNT = Math.round(maxBlocks * burst);
  if (BLOCK_COUNT === 0) return;
  const copy = snapshot(data);

  for (let i = 0; i < BLOCK_COUNT; i++) {
    const seed = blockSeed * 31 + i * 7919;
    const h0 = hashInt(seed);
    const h1 = hashInt(seed + 1);
    const h2 = hashInt(seed + 2);
    const h3 = hashInt(seed + 3);

    const bw = Math.round((25 + (h0 % 120)) * dpr);
    const bh = Math.round((3 + (h1 % 16)) * dpr);
    const bx = h2 % Math.max(1, w - bw);
    const by = h3 % Math.max(1, h - bh);

    const centerMv = maskByteAt(
      mask,
      mw,
      mh,
      bx + (bw >> 1),
      by + (bh >> 1),
      dpr,
      offX,
      offY,
    );
    if (centerMv < 30) continue;

    const effect = h0 % 3;
    const displaceX = Math.round(((h1 % 60) - 30) * dpr);
    const displaceY = Math.round(((h2 % 30) - 15) * dpr);

    for (let dy = 0; dy < bh && by + dy < h; dy++) {
      for (let dx = 0; dx < bw && bx + dx < w; dx++) {
        const px = bx + dx;
        const py = by + dy;
        const mv = maskAt(mask, mw, mh, px, py, dpr, offX, offY);
        if (mv < 0.1) continue;

        const di = (py * w + px) * 4;

        if (effect === 0) {
          const sx = Math.max(0, Math.min(w - 1, px + displaceX));
          const sy = Math.max(0, Math.min(h - 1, py + displaceY));
          const si = (sy * w + sx) * 4;
          data[di] = copy[si];
          data[di + 1] = copy[si + 1];
          data[di + 2] = copy[si + 2];
        } else if (effect === 1) {
          data[di] = Math.round(data[di] + (255 - 2 * data[di]) * mv);
          data[di + 1] = Math.round(
            data[di + 1] + (255 - 2 * data[di + 1]) * mv,
          );
          data[di + 2] = Math.round(
            data[di + 2] + (255 - 2 * data[di + 2]) * mv,
          );
        } else {
          const farX = Math.max(0, Math.min(w - 1, px + displaceX * 5));
          const farY = Math.max(0, Math.min(h - 1, py + displaceY * 3));
          const si = (farY * w + farX) * 4;
          data[di] = Math.round(data[di] * (1 - mv) + copy[si] * mv);
          data[di + 1] = Math.round(
            data[di + 1] * (1 - mv) + copy[si + 1] * mv,
          );
          data[di + 2] = Math.round(
            data[di + 2] * (1 - mv) + copy[si + 2] * mv,
          );
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Effect: Edge fringe (mask-contained)
// ---------------------------------------------------------------------------

function applyEdgeFringe(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  mask: Uint8Array,
  mw: number,
  mh: number,
  dpr: number,
  offX: number,
  offY: number,
  time: number,
  burst: number,
  intensity: number,
) {
  if (intensity <= 0) return;
  const EDGE_LO = 10;
  const EDGE_HI = 95;
  const darken = Math.round(100 * burst * intensity * 2);

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const v = maskByteAt(mask, mw, mh, x, y, dpr, offX, offY);
      if (v < EDGE_LO || v > EDGE_HI) continue;

      const vl = maskByteAt(mask, mw, mh, x - 1, y, dpr, offX, offY);
      const vr = maskByteAt(mask, mw, mh, x + 1, y, dpr, offX, offY);
      const vu = maskByteAt(mask, mw, mh, x, y - 1, dpr, offX, offY);
      const vd = maskByteAt(mask, mw, mh, x, y + 1, dpr, offX, offY);
      const gradient = Math.abs(vr - vl) + Math.abs(vd - vu);
      if (gradient < 12) continue;

      const di = (y * w + x) * 4;
      const flicker = (x + y + Math.floor(time * 60)) % 3 === 0 ? 1 : 0;
      if (flicker) {
        const boost = 180 + ((x * 7 + y * 13) % 75);
        data[di] = Math.min(255, boost);
        data[di + 1] = Math.min(255, boost - 40);
        data[di + 2] = Math.min(255, boost + 20);
      } else {
        data[di] = Math.max(0, data[di] - darken);
        data[di + 1] = Math.max(0, data[di + 1] - darken);
        data[di + 2] = Math.max(0, data[di + 2] - darken);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main glitch render pass
// ---------------------------------------------------------------------------

export function renderGlitchTentacles(
  ctx: CanvasRenderingContext2D,
  state: TentacleGlitchState,
  time: number,
  noise2D: Noise2D,
): void {
  const { mask, maskWidth, maskHeight, x, y, params: p } = state;
  const dpr = ctx.getTransform().a || 1;
  const physCanvasW = ctx.canvas.width;
  const physCanvasH = ctx.canvas.height;

  const maskPx = Math.max(0, Math.round(x * dpr));
  const maskPy = Math.max(0, Math.round(y * dpr));
  const maskPw = Math.min(Math.round(maskWidth * dpr), physCanvasW - maskPx);
  const maskPh = Math.min(Math.round(maskHeight * dpr), physCanvasH - maskPy);
  if (maskPw <= 0 || maskPh <= 0) return;

  const burst = computeBurstIntensity(time, noise2D, p);

  // The read region is the creature's bounding box plus a margin for the
  // displacement passes. No full-width or sky-extension reads — the glitch
  // stays confined to the creature's own footprint.
  const margin = Math.ceil(
    Math.max(p.displacement, p.chromaticOffset, 24) *
      dpr *
      Math.max(0.25, burst),
  );
  const readX = Math.max(0, maskPx - margin);
  const readRight = Math.min(physCanvasW, maskPx + maskPw + margin);
  const readY = maskPy;
  const readW = readRight - readX;
  const readH = Math.min(maskPh, physCanvasH - readY);
  if (readW <= 0 || readH <= 0) return;

  const offX = maskPx - readX;
  const offY = 0;

  if (time - state.lastBlockUpdate > BLOCK_UPDATE_INTERVAL) {
    state.blockSeed = Math.floor(time * 4);
    state.lastBlockUpdate = time;
  }

  const imageData = ctx.getImageData(readX, readY, readW, readH);
  const data = imageData.data;

  applyHorizontalDisplacement(
    data,
    readW,
    readH,
    mask,
    maskWidth,
    maskHeight,
    dpr,
    offX,
    offY,
    time,
    noise2D,
    burst,
    p.displacement,
  );
  applyChannelSeparation(
    data,
    readW,
    readH,
    mask,
    maskWidth,
    maskHeight,
    dpr,
    offX,
    offY,
    time,
    burst,
    p.chromaticOffset,
  );
  applyAlienColors(
    data,
    readW,
    readH,
    mask,
    maskWidth,
    maskHeight,
    dpr,
    offX,
    offY,
    time,
    burst,
    p.alienColors,
  );
  applyScanLines(
    data,
    readW,
    readH,
    mask,
    maskWidth,
    maskHeight,
    dpr,
    offX,
    offY,
    time,
    burst,
    p.scanLines,
  );
  applyBlockCorruption(
    data,
    readW,
    readH,
    mask,
    maskWidth,
    maskHeight,
    dpr,
    offX,
    offY,
    state.blockSeed,
    burst,
    p.blockCount,
  );
  applyEdgeFringe(
    data,
    readW,
    readH,
    mask,
    maskWidth,
    maskHeight,
    dpr,
    offX,
    offY,
    time,
    burst,
    p.edgeFringe,
  );

  ctx.putImageData(imageData, readX, readY);
}
