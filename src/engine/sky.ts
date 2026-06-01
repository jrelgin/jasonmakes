import { Dimensions, Palette } from "./types";

/**
 * Render the sky layer - a gradient from sky color to horizon color
 */
export function renderSky(
  ctx: CanvasRenderingContext2D,
  dimensions: Dimensions,
  horizonY: number,
  palette: Palette,
) {
  const gradient = ctx.createLinearGradient(0, 0, 0, horizonY);
  gradient.addColorStop(0, palette.sky);
  gradient.addColorStop(0.7, palette.sky);
  gradient.addColorStop(1, palette.skyHorizon);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, dimensions.width, horizonY + 2);
}
