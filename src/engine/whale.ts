/**
 * Daytime whale: a knotwork whale SVG that floats mid-water in the Hokusai
 * (day) seascape — the day-mode counterpart to the night-only tentacle glitch.
 *
 * Unlike the tentacles (which drive per-pixel distortion via an alpha mask),
 * the whale is simply drawn with drawImage and animated:
 *   - it bobs gently up and down,
 *   - it drifts slowly across the scene and loops, like a boat passing.
 *
 * It is rendered between sea rows via the renderer's InterRowCallback, anchored
 * to a mid wave row. Because the foreground wave rows paint afterward, they
 * cover the whale's lower body — giving a partially-submerged waterline for free.
 */

import { WhaleState } from "./types";

// Tuning constants (logical pixels / seconds)
const WIDTH_RATIO = 0.36; // whale width as a fraction of canvas width (medium)
const WHALE_ASPECT = 1024 / 1536; // source PNG is 1536x1024
const DRIFT_FRAC = 0.015; // horizontal speed as a fraction of canvas width / sec
const DRIFT_DIR = -1; // -1 = swims toward its head (left), 1 = right
const BOB_SPEED = 0.45; // radians/sec for the gentle vertical bob
const BOB_AMP = 6; // bob amplitude in logical px
// Fraction of the image height that sits ABOVE the anchored waterline. The
// whale body occupies the vertical middle of the artwork, so anchoring near
// center leaves the back/hump and tail flukes above the waves while the
// foreground wave rows submerge the belly and knotwork.
const WATERLINE_FRAC = 0.5;

export function loadWhaleImage(
  src = "/images/whale/whale.svg",
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function createWhaleState(
  img: HTMLImageElement,
  canvasWidth: number,
): WhaleState {
  const width = Math.round(canvasWidth * WIDTH_RATIO);
  const height = Math.round(width * WHALE_ASPECT);
  return {
    img,
    width,
    height,
    canvasWidth,
    driftDir: DRIFT_DIR,
  };
}

/**
 * Draw the whale anchored to a mid wave row.
 *
 * @param anchorY  the animated Y of the wave row the whale rides (its waterline)
 */
export function renderWhale(
  ctx: CanvasRenderingContext2D,
  state: WhaleState,
  time: number,
  anchorY: number,
): void {
  const { img, width, height, canvasWidth, driftDir } = state;

  // Horizontal drift: glide across and loop. The travel range spans the canvas
  // plus the whale width on both sides so it fully exits one edge before
  // re-entering the other (a clean pass, no mid-screen teleport).
  const range = canvasWidth + width * 2;
  const speed = DRIFT_FRAC * canvasWidth;
  // Start centered so the whale is on-screen on first paint.
  const startX = canvasWidth * 0.5 - width / 2 + width;
  let phase = (startX + driftDir * speed * time) % range;
  if (phase < 0) phase += range;
  const x = phase - width; // maps travel into [-width, canvasWidth + width]

  // Gentle independent bob layered on top of the wave row's own breathing.
  const bob = Math.sin(time * BOB_SPEED) * BOB_AMP;
  const y = anchorY - height * WATERLINE_FRAC + bob;

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.drawImage(img, x, y, width, height);
  ctx.restore();
}
