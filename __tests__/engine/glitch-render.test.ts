import { describe, it, expect } from "vitest";

import { createNoiseGenerators } from "../../src/engine/noise";
import { renderGlitchTentacles } from "../../src/engine/tentacles";
import type { GlitchParams, TentacleGlitchState } from "../../src/engine/types";

/**
 * Determinism + performance harness for the twilight glitch renderer.
 *
 * renderGlitchTentacles(ctx, state, time, noise2D) is pure given a seeded noise
 * function, a fixed mask, and a fixed pixel buffer. We drive it with a fake 2D
 * context backed by a plain Uint8ClampedArray so it runs in Node with no canvas.
 *
 * The golden checksums PROVE byte-for-byte identical output. They are swept
 * across several devicePixelRatios — including fractional ones (browser zoom,
 * 125%/150% OS scaling) — because coordinate rounding (Math.ceil(mw*dpr) etc.)
 * behaves differently at fractional DPR, and that is exactly where a naive loop
 * bound can silently drop an edge column. Any change to a single output byte at
 * any DPR breaks the matching assertion.
 */

const TWILIGHT_GLITCH: GlitchParams = {
  burstBase: 0.42,
  burstThreshold: 0.18,
  displacement: 77,
  chromaticOffset: 80,
  scanLines: 1,
  blockCount: 24,
  alienColors: 0.65,
  bleedTears: 0.68,
  skyStatic: 0.3,
  edgeFringe: 0.66,
};

const LOGICAL_W = 1440;
const LOGICAL_H = 900;

// Logical mask placement (state stores logical coords; renderGlitchTentacles
// scales by dpr internally). Chosen to mirror the real ~60%-width right-side
// tentacle silhouette.
const MASK_X = 430;
const MASK_Y = 300;
const MASK_W = 900;
const MASK_H = 560;

const DPRS = [1, 1.07, 1.25, 1.5, 1.75, 2];

// Pinned from the pristine committed code, per DPR. Set a value to -1 to print
// and capture it. Any rendered-output change breaks the matching assertion.
// Pinned from the current intended output (which now spreads bleed-tears /
// block-corruption across alternating frames). Re-pin only when a visual change
// is intended; an unexpected mismatch means an accidental change to the glitch.
const GOLDEN: Record<string, number> = {
  "1": 944267281,
  "1.07": 1042846591,
  "1.25": 2042511563,
  "1.5": 1005742698,
  "1.75": 1688380554,
  "2": 2003867736,
};

function buildMask(): Uint8Array {
  const mask = new Uint8Array(MASK_W * MASK_H);
  for (let my = 0; my < MASK_H; my++) {
    for (let mx = 0; mx < MASK_W; mx++) {
      const nx = (mx / MASK_W - 0.5) * 2;
      const ny = (my / MASK_H - 0.5) * 2;
      const d = Math.sqrt(nx * nx + ny * ny);
      // Radial silhouette with a soft edge -> exercises interior, edge, zero.
      mask[my * MASK_W + mx] = d < 1 ? Math.round((1 - d) * 255) : 0;
    }
  }
  return mask;
}

function freshState(): TentacleGlitchState {
  return {
    mask: buildMask(),
    maskWidth: MASK_W,
    maskHeight: MASK_H,
    x: MASK_X,
    y: MASK_Y,
    blockSeed: 0,
    lastBlockUpdate: 0,
    params: TWILIGHT_GLITCH,
    frameCount: 0,
    scratch: null,
    rowBuf: null,
  };
}

function freshBacking(physW: number, physH: number): Uint8ClampedArray {
  const buf = new Uint8ClampedArray(physW * physH * 4);
  for (let y = 0; y < physH; y++) {
    for (let x = 0; x < physW; x++) {
      const i = (y * physW + x) * 4;
      buf[i] = (x * 3 + y) & 255;
      buf[i + 1] = (y * 5 + x * 2) & 255;
      buf[i + 2] = (x ^ y) & 255;
      buf[i + 3] = 255;
    }
  }
  return buf;
}

// Minimal CanvasRenderingContext2D stand-in: region read/write against `backing`.
function makeCtx(
  backing: Uint8ClampedArray,
  physW: number,
  physH: number,
  dpr: number,
) {
  // Browser getImageData/putImageData are native bulk memcpys. Model them with
  // TypedArray.slice/set (one native copy) rather than a JS per-row loop, so the
  // perf number reflects the JS pixel passes (the part that actually runs as JS
  // in the browser and the part these optimizations change), not an artificial
  // interpreter-speed readback. Full-width reads are contiguous -> single bulk
  // copy; partial reads fall back to per-row (and are smaller anyway).
  return {
    canvas: { width: physW, height: physH },
    getTransform: () => ({ a: dpr }),
    getImageData: (x: number, y: number, w: number, h: number) => {
      if (x === 0 && w === physW) {
        const start = y * physW * 4;
        return { data: backing.slice(start, start + w * h * 4), width: w, height: h };
      }
      const data = new Uint8ClampedArray(w * h * 4);
      for (let row = 0; row < h; row++) {
        const src = ((y + row) * physW + x) * 4;
        data.set(backing.subarray(src, src + w * 4), row * w * 4);
      }
      return { data, width: w, height: h };
    },
    putImageData: (
      img: { data: Uint8ClampedArray; width: number; height: number },
      x: number,
      y: number,
      // dirty-rect overload (OPT-4); ignored here on purpose so the test
      // verifies the FULL buffer, catching any dirty-rect that is too small.
      ..._dirty: number[]
    ) => {
      const { data, width: w, height: h } = img;
      if (x === 0 && w === physW) {
        backing.set(data, y * physW * 4);
        return;
      }
      for (let row = 0; row < h; row++) {
        const dst = ((y + row) * physW + x) * 4;
        backing.set(data.subarray(row * w * 4, row * w * 4 + w * 4), dst);
      }
    },
  } as unknown as CanvasRenderingContext2D;
}

function checksum(buf: Uint8ClampedArray): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < buf.length; i++) {
    h ^= buf[i];
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const FRAMES = 24;
function runScenario(dpr: number): number {
  const physW = Math.round(LOGICAL_W * dpr);
  const physH = Math.round(LOGICAL_H * dpr);
  const backing = freshBacking(physW, physH);
  const state = freshState();
  const ctx = makeCtx(backing, physW, physH, dpr);
  const { noise2D } = createNoiseGenerators(1337);
  for (let f = 0; f < FRAMES; f++) {
    renderGlitchTentacles(ctx, state, 0.13 * f, noise2D);
  }
  return checksum(backing);
}

describe("renderGlitchTentacles", () => {
  it("produces stable, deterministic output at every DPR (fidelity lock)", () => {
    for (const dpr of DPRS) {
      const key = String(dpr);
      const sum = runScenario(dpr);
      // eslint-disable-next-line no-console
      console.log(`[glitch] dpr=${key} checksum=${sum}`);
      if (GOLDEN[key] >= 0) expect(sum, `dpr=${key}`).toBe(GOLDEN[key]);
    }
  });

  it("is internally deterministic (same inputs -> same output)", () => {
    expect(runScenario(1.5)).toBe(runScenario(1.5));
  });
});
