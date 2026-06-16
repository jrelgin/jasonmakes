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
    frameCount: 0,
    scratch: null,
    rowBuf: null,
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

/**
 * Exclusive upper loop bound guaranteed to include every physical pixel the
 * mask can cover, clamped to the read buffer. Mask-contained passes write
 * nothing outside [off, off + extent*dpr), so looping only up to here is
 * lossless — the per-pixel maskAt/maskByteAt bounds check still rejects pixels.
 *
 * The `+ 1` is a floating-point guard: at fractional DPR, Math.ceil(extent*dpr)
 * can land one short of the true edge column (e.g. dpr=1.07, where round-off
 * makes a valid right-edge mask column map just under the ceil). The extra
 * column/row is a harmless no-op (maskAt returns 0 there), so a superset is
 * always safe and never drops a silhouette edge.
 */
function maskLoopEnd(
  off: number,
  extent: number,
  dpr: number,
  limit: number,
): number {
  return Math.min(limit, off + Math.ceil(extent * dpr) + 1);
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

// ---------------------------------------------------------------------------
// Effect: Sky static (operates in extension zone above the mask)
// ---------------------------------------------------------------------------

function applySkyStatic(
  data: Uint8ClampedArray,
  w: number,
  skyRows: number,
  dpr: number,
  time: number,
  burst: number,
  intensity: number,
) {
  if (intensity <= 0 || burst < 0.4 || skyRows <= 0) return;

  const staticIntensity = ((burst - 0.4) / 0.6) * intensity * 2;
  const bandFrame = Math.floor(time * 4);
  const shiftFrame = Math.floor(time * 1.6);
  const staticFrame = Math.floor(time * 60);

  for (let y = 0; y < skyRows; y++) {
    const fade = 1 - y / skyRows;

    const bandSeed = hashInt(y * 131 + bandFrame * 7919);
    const isBand = bandSeed % 18 === 0;
    const bandShift = isBand
      ? Math.round(
          ((hashInt(y * 7 + shiftFrame * 149) % 80) - 40) *
            dpr *
            staticIntensity,
        )
      : 0;
    const segmentWidth = Math.max(
      24,
      Math.round((70 + (bandSeed % 130)) * dpr),
    );
    const segmentOffset = bandSeed % segmentWidth;

    for (let x = 0; x < w; x++) {
      const di = (y * w + x) * 4;
      const prob = fade * staticIntensity * 0.12;
      const hash = hashInt(x * 31 + y * 997 + staticFrame);

      if (bandShift !== 0) {
        const segment = Math.floor((x + segmentOffset) / segmentWidth);
        const segmentHash = hashInt(segment * 4099 + y * 113 + bandFrame * 271);
        if (segmentHash % 100 < 58) {
          const segmentJitter = ((segmentHash >>> 8) % 5) - 2;
          const sx = Math.max(
            0,
            Math.min(w - 1, x + bandShift + Math.round(segmentJitter * dpr)),
          );
          const si = (y * w + sx) * 4;
          data[di] = data[si];
          data[di + 1] = data[si + 1];
          data[di + 2] = data[si + 2];
        }
      }

      if ((hash % 1000) / 1000 < prob) {
        const bright = hash % 2 === 0;
        if (bright) {
          const v = 160 + (hash % 95);
          data[di] = v;
          data[di + 1] = v - 20;
          data[di + 2] = v + 10;
        } else {
          data[di] = Math.max(0, data[di] - 80);
          data[di + 1] = Math.max(0, data[di + 1] - 80);
          data[di + 2] = Math.max(0, data[di + 2] - 80);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Effect: Full-width bleed tears
// ---------------------------------------------------------------------------

function applyBleedTears(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  mask: Uint8Array,
  mw: number,
  mh: number,
  dpr: number,
  offY: number,
  time: number,
  noise2D: Noise2D,
  burst: number,
  intensity: number,
  rowBuf: Uint8ClampedArray,
) {
  if (intensity <= 0 || burst < 0.5) return;

  const tearIntensity = ((burst - 0.5) / 0.5) * intensity * 2;
  const MAX_TEAR_SHIFT = Math.round(100 * dpr);

  for (let y = 0; y < h; y++) {
    const rowMax = maxMaskOnRow(mask, mw, mh, y, dpr, offY);
    if (rowMax < 60) continue;

    const logicalY = y / dpr;
    const selectNoise = noise2D(logicalY * 0.12, time * 2.5);
    if (Math.abs(selectNoise) < 0.65) continue;

    const shiftNoise = noise2D(logicalY * 0.08, time * 3.0 + 100);
    const shift = Math.round(
      shiftNoise * MAX_TEAR_SHIFT * tearIntensity * (rowMax / 255),
    );
    if (shift === 0) continue;

    const rowStart = y * w * 4;
    rowBuf.set(data.subarray(rowStart, rowStart + w * 4));

    for (let x = 0; x < w; x++) {
      const sx = Math.max(0, Math.min(w - 1, x - shift));
      const di = rowStart + x * 4;
      const si = sx * 4;
      data[di] = rowBuf[si];
      data[di + 1] = rowBuf[si + 1];
      data[di + 2] = rowBuf[si + 2];
    }
  }
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
  rowBuf: Uint8ClampedArray,
) {
  const MAX_SHIFT = Math.round(maxShift * dpr * burst);
  if (MAX_SHIFT === 0) return;

  // Mask bounding box. The full-row snapshot is kept (a shifted read can land
  // anywhere on the row), but the write loop only needs the mask band.
  const x0 = Math.max(0, offX);
  const x1 = maskLoopEnd(offX, mw, dpr, w);
  const y0 = Math.max(0, offY);
  const y1 = maskLoopEnd(offY, mh, dpr, h);

  for (let y = y0; y < y1; y++) {
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

    for (let x = x0; x < x1; x++) {
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
  rowBuf: Uint8ClampedArray,
) {
  const MAX_OFFSET = Math.round(maxOffset * dpr * burst);
  if (MAX_OFFSET === 0) return;
  const pulse = 0.6 + 0.4 * Math.sin(time * 2.2);
  const rOff = Math.round(-MAX_OFFSET * pulse);
  const bOff = Math.round(MAX_OFFSET * pulse);

  // The mask is nonzero only inside this bounding box; outside it mv === 0 and
  // every write below is skipped, so restricting the loops here is lossless and
  // avoids scanning the (often full-width) empty margins.
  const x0 = Math.max(0, offX);
  const x1 = maskLoopEnd(offX, mw, dpr, w);
  const y0 = Math.max(0, offY);
  const y1 = maskLoopEnd(offY, mh, dpr, h);

  for (let y = y0; y < y1; y++) {
    const rowStart = y * w * 4;
    // Channel separation only reads pixels on the SAME row (rx, bx share y), so
    // a per-row snapshot is exactly equivalent to a full-frame copy — taken
    // before this row is written — but moves far fewer bytes.
    rowBuf.set(data.subarray(rowStart, rowStart + w * 4));
    for (let x = x0; x < x1; x++) {
      const mv = maskAt(mask, mw, mh, x, y, dpr, offX, offY);
      if (mv < 0.08) continue;

      const di = rowStart + x * 4;
      const rx = Math.max(0, Math.min(w - 1, x + Math.round(rOff * mv)));
      data[di] = rowBuf[rx * 4];

      const bx = Math.max(0, Math.min(w - 1, x + Math.round(bOff * mv)));
      data[di + 2] = rowBuf[bx * 4 + 2];
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

  // Mask bounding box — outside it mv === 0, so all writes are skipped anyway.
  const x0 = Math.max(0, offX);
  const x1 = maskLoopEnd(offX, mw, dpr, w);
  const y0 = Math.max(0, offY);
  const y1 = maskLoopEnd(offY, mh, dpr, h);

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
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

  // Mask bounding box — outside it mv === 0, so all writes are skipped anyway.
  const x0 = Math.max(0, offX);
  const x1 = maskLoopEnd(offX, mw, dpr, w);
  const y0 = Math.max(0, offY);
  const y1 = maskLoopEnd(offY, mh, dpr, h);

  for (let y = y0; y < y1; y++) {
    const scanPhase = (y + drift) % SCAN_PERIOD;
    const isDark = scanPhase === 0;
    const isBright = scanPhase === 1;
    if (!isDark && !isBright) continue;

    for (let x = x0; x < x1; x++) {
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
  scratch: Uint8ClampedArray,
) {
  const BLOCK_COUNT = Math.round(maxBlocks * burst);
  if (BLOCK_COUNT === 0) return;
  // Snapshot into the reused scratch buffer (no per-frame alloc). This runs
  // after earlier effects, so it intentionally captures their output.
  const copy = scratch;
  copy.set(data);

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

  // Mask bounding box intersected with the [1, w-1)/[1, h-1) interior this pass
  // needs for its neighbour reads. Outside the mask, v === 0 < EDGE_LO, so the
  // skipped pixels never wrote anything.
  const x0 = Math.max(1, offX);
  const x1 = Math.min(w - 1, maskLoopEnd(offX, mw, dpr, w));
  const y0 = Math.max(1, offY);
  const y1 = Math.min(h - 1, maskLoopEnd(offY, mh, dpr, h));

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
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

const SKY_EXTENSION_RATIO = 0.15;

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
  const needsSkyStatic = p.skyStatic > 0 && burst >= 0.4;
  const needsFullWidth = needsSkyStatic || (p.bleedTears > 0 && burst >= 0.5);
  const skyExtPhys = needsSkyStatic
    ? Math.round(maskPh * SKY_EXTENSION_RATIO)
    : 0;
  const readY = Math.max(0, maskPy - skyExtPhys);
  const actualSkyExt = maskPy - readY;

  const margin = Math.ceil(
    Math.max(p.displacement, p.chromaticOffset, 24) *
      dpr *
      Math.max(0.25, burst),
  );
  const readX = needsFullWidth ? 0 : Math.max(0, maskPx - margin);
  const readRight = needsFullWidth
    ? physCanvasW
    : Math.min(physCanvasW, maskPx + maskPw + margin);
  const readW = readRight - readX;
  const readH = Math.min(actualSkyExt + maskPh, physCanvasH - readY);
  if (readW <= 0 || readH <= 0) return;

  const offX = maskPx - readX;
  const offY = actualSkyExt;

  if (time - state.lastBlockUpdate > BLOCK_UPDATE_INTERVAL) {
    state.blockSeed = Math.floor(time * 4);
    state.lastBlockUpdate = time;
  }

  const imageData = ctx.getImageData(readX, readY, readW, readH);
  const data = imageData.data;

  // Reuse frame-to-frame scratch buffers instead of allocating per frame.
  // `scratch` holds a full-buffer snapshot for channel-separation and block
  // corruption; `rowBuf` holds a single row for the tear/displacement passes.
  // Both grow only when the read region grows, so steady-state allocation is
  // zero. A larger-than-needed buffer is fine: callers copy/read from index 0.
  if (!state.scratch || state.scratch.length < data.length) {
    state.scratch = new Uint8ClampedArray(data.length);
  }
  if (!state.rowBuf || state.rowBuf.length < readW * 4) {
    state.rowBuf = new Uint8ClampedArray(readW * 4);
  }
  const scratch = state.scratch;
  const rowBuf = state.rowBuf;

  // Spread the two heaviest, most variable passes (bleed tears + block
  // corruption) across alternating frames so each frame carries at most one.
  // This flattens per-frame cost — the actual cure for the wave stutter. Both
  // effects are already chaotic, so updating each at half the frame rate reads
  // as part of the glitch. Sky static and the cheap mask-local passes run every
  // frame, so the silhouette never fully "calms".
  state.frameCount += 1;
  const runBleedTears = state.frameCount % 2 === 0;
  const runBlockCorruption = !runBleedTears;

  applySkyStatic(data, readW, actualSkyExt, dpr, time, burst, p.skyStatic);
  if (runBleedTears) {
    applyBleedTears(
      data,
      readW,
      readH,
      mask,
      maskWidth,
      maskHeight,
      dpr,
      offY,
      time,
      noise2D,
      burst,
      p.bleedTears,
      rowBuf,
    );
  }
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
    rowBuf,
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
    rowBuf,
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
  if (runBlockCorruption) {
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
      scratch,
    );
  }
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
