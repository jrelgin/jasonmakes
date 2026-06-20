import { getCanvas2DContext } from "./canvas";
import { createOffscreenCanvas } from "./offscreen";
import {
  Dimensions,
  Palette,
  SeaPatternCache,
  SeaPatternCacheRow,
} from "./types";

type Noise2D = (x: number, y: number) => number;
const ROW_COUNT = 12;
const DRIFT_SPEED = 0.012;

/** Callback that fires between wave rows. Receives the row index just completed and its animated Y position. */
export type InterRowCallback = (
  ctx: CanvasRenderingContext2D,
  rowIndex: number,
  rowY: number,
) => void;

/**
 * Linearly interpolate between two hex colors (#RRGGBB).
 */
function lerpColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

/**
 * Draw a single seigaiha wave unit: multiple concentric half-circle arcs
 * centered at (cx, cy), opening downward.
 */
function drawWaveUnit(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  lineCount: number,
  lineWidth: number,
  alpha: number,
  palette: Palette,
  fillColor: string,
  extensionDown: number,
) {
  // Solid fill to occlude arcs from rows behind — semicircle + vertical extension
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI);
  ctx.lineTo(cx + radius, cy + extensionDown);
  ctx.lineTo(cx - radius, cy + extensionDown);
  ctx.closePath();
  ctx.globalAlpha = 1;
  ctx.fillStyle = fillColor;
  ctx.fill();

  // Concentric arc lines with vertical extensions downward
  const innerPad = radius * 0.2;
  const drawableR = radius - innerPad;

  for (let i = 0; i < lineCount; i++) {
    const t = i / (lineCount - 1);
    const r = innerPad + t * drawableR;
    if (r < 1) continue;

    ctx.beginPath();
    ctx.moveTo(cx - r, cy + extensionDown);
    ctx.lineTo(cx - r, cy);
    ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
    ctx.lineTo(cx + r, cy + extensionDown);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = palette.foam;
    ctx.globalAlpha = alpha * (0.5 + 0.5 * (1 - t));
    ctx.stroke();
  }
}

function getRowSpacings(): number[] {
  const rawSpacings: number[] = [];
  for (let i = 0; i < ROW_COUNT; i++) {
    const t = i / Math.max(ROW_COUNT - 1, 1);
    rawSpacings.push(0.4 + t * t * t * 3.6);
  }
  return rawSpacings;
}

function createSeaBaseCanvas(
  dimensions: Dimensions,
  horizonBaseY: number,
  palette: Palette,
  renderScale: number,
): HTMLCanvasElement {
  const { width, height } = dimensions;
  const canvas = createOffscreenCanvas(
    Math.ceil(width * renderScale),
    Math.ceil(height * renderScale),
  );

  const ctx = getCanvas2DContext(canvas);
  ctx.scale(renderScale, renderScale);
  const seaGradient = ctx.createLinearGradient(0, horizonBaseY, 0, height);
  seaGradient.addColorStop(0, palette.seaLight);
  seaGradient.addColorStop(0.35, palette.seaMid);
  seaGradient.addColorStop(1, palette.seaDeep);
  ctx.fillStyle = seaGradient;
  ctx.fillRect(0, horizonBaseY, width, height - horizonBaseY);

  return canvas;
}

function createWaveTile(
  radius: number,
  spacing: number,
  lineCount: number,
  lineWidth: number,
  alpha: number,
  palette: Palette,
  fillColor: string,
  renderScale: number,
): Pick<
  SeaPatternCacheRow,
  "tile" | "centerX" | "centerY" | "tileWidth" | "tileHeight"
> {
  const pad = Math.ceil(Math.max(3, lineWidth * 2));
  const centerX = radius + pad;
  const centerY = radius + pad;
  const tileWidth = Math.ceil(radius * 2 + pad * 2);
  const tileHeight = Math.ceil(radius + spacing + pad * 2);
  const tile = createOffscreenCanvas(
    Math.ceil(tileWidth * renderScale),
    Math.ceil(tileHeight * renderScale),
  );

  const ctx = getCanvas2DContext(tile);
  ctx.scale(renderScale, renderScale);
  drawWaveUnit(
    ctx,
    centerX,
    centerY,
    radius,
    lineCount,
    lineWidth,
    alpha,
    palette,
    fillColor,
    spacing,
  );

  return { tile, centerX, centerY, tileWidth, tileHeight };
}

export function createSeaPatternCache(
  dimensions: Dimensions,
  horizonBaseY: number,
  palette: Palette,
  waveScale = 1,
  renderScale = 1,
): SeaPatternCache | null {
  const { height } = dimensions;
  const seaHeight = height - horizonBaseY;
  if (seaHeight <= 0) return null;

  const rawSpacings = getRowSpacings();
  const totalRaw = rawSpacings.reduce((sum, spacing) => sum + spacing, 0);
  const spacingScale = ((seaHeight * 1.05) / totalRaw) * waveScale;
  const rows: SeaPatternCacheRow[] = [];

  let y = horizonBaseY;
  for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
    const depthT = rowIndex / Math.max(ROW_COUNT - 1, 1);
    const spacing = rawSpacings[rowIndex] * spacingScale;
    const radius = spacing * 1.15;
    const lineCount = Math.round(3 + depthT * 3);
    const lineWidth = 0.8 + depthT * depthT * 2.5;
    const alpha = 0.2 + depthT * 0.6;

    const bandCount = 4;
    const bandIndex = Math.min(Math.floor(depthT * bandCount), bandCount - 1);
    const bandT = bandIndex / Math.max(bandCount - 1, 1);
    const fillColor =
      bandT < 0.65
        ? lerpColor(palette.seaLight, palette.seaMid, bandT / 0.65)
        : lerpColor(palette.seaMid, palette.seaDeep, (bandT - 0.65) / 0.35);

    const tile = createWaveTile(
      radius,
      spacing,
      lineCount,
      lineWidth,
      alpha,
      palette,
      fillColor,
      renderScale,
    );
    rows.push({
      ...tile,
      radius,
      spacing,
      waveWidth: radius * 2,
      baseY: y,
      depthT,
    });

    y += spacing;
  }

  return {
    baseCanvas: createSeaBaseCanvas(
      dimensions,
      horizonBaseY,
      palette,
      renderScale,
    ),
    rows,
  };
}

function drawCachedSeigaihaPattern(
  ctx: CanvasRenderingContext2D,
  dimensions: Dimensions,
  time: number,
  cache: SeaPatternCache,
  interRowCallback?: InterRowCallback,
) {
  const { width, height } = dimensions;

  for (let rowIndex = 0; rowIndex < cache.rows.length; rowIndex++) {
    const row = cache.rows[rowIndex];
    const driftDirection = rowIndex % 2 === 0 ? 1 : -1;
    const drift =
      driftDirection * time * DRIFT_SPEED * width * (0.3 + row.depthT * 0.7);

    const breatheAmt = 5 + row.depthT * 18;
    const breatheOffset = Math.sin(time * 0.5 + rowIndex * 0.6) * breatheAmt;
    const animY = row.baseY + breatheOffset;

    if (animY - row.radius > height + row.radius) continue;

    const baseOffset = rowIndex % 2 === 1 ? row.radius : 0;
    const padding = row.waveWidth * 3;
    const startX = -padding + ((drift + baseOffset) % row.waveWidth);
    const normalizedStartX =
      startX - Math.ceil((startX + padding) / row.waveWidth) * row.waveWidth;

    for (let x = normalizedStartX; x < width + padding; x += row.waveWidth) {
      ctx.drawImage(
        row.tile,
        x - row.centerX,
        animY - row.centerY,
        row.tileWidth,
        row.tileHeight,
      );
    }

    if (interRowCallback) {
      interRowCallback(ctx, rowIndex, animY);
    }
  }
}

/**
 * Render the seigaiha (blue ocean wave) pattern filling the sea area.
 *
 * Fixed 12 rows of concentric half-circle arcs arranged like fish scales.
 * Row spacing grows with depth for natural perspective. Each subsequent
 * row is offset horizontally (brickwork style) and overlaps the row above.
 *
 * Animation: alternating rows drift laterally; all rows breathe vertically.
 */
function drawSeigaihaPattern(
  ctx: CanvasRenderingContext2D,
  dimensions: Dimensions,
  horizonBaseY: number,
  horizonPoints: number[],
  time: number,
  noise2D: Noise2D,
  palette: Palette,
  waveScale = 1,
  interRowCallback?: InterRowCallback,
) {
  const { width, height } = dimensions;
  const seaHeight = height - horizonBaseY;
  if (seaHeight <= 0) return;

  // Compute row spacings with perspective (growing toward foreground)
  const rawSpacings = getRowSpacings();
  const totalRaw = rawSpacings.reduce((sum, spacing) => sum + spacing, 0);
  // Scale so rows extend slightly past the bottom for full coverage
  // waveScale uniformly shrinks or grows all wave units
  const spacingScale = ((seaHeight * 1.05) / totalRaw) * waveScale;

  let y = horizonBaseY;

  for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
    const depthT = rowIndex / Math.max(ROW_COUNT - 1, 1);
    const spacing = rawSpacings[rowIndex] * spacingScale;
    const radius = spacing * 1.15; // radius > spacing for fish-scale overlap

    // Bolder line parameters that increase with depth
    const lineCount = Math.round(3 + depthT * 3);
    const lineWidth = 0.8 + depthT * depthT * 2.5;
    const alpha = 0.2 + depthT * 0.6;

    // Stepped color bands (4 discrete steps instead of smooth gradient)
    const bandCount = 4;
    const bandIndex = Math.min(Math.floor(depthT * bandCount), bandCount - 1);
    const bandT = bandIndex / Math.max(bandCount - 1, 1);
    const fillColor =
      bandT < 0.65
        ? lerpColor(palette.seaLight, palette.seaMid, bandT / 0.65)
        : lerpColor(palette.seaMid, palette.seaDeep, (bandT - 0.65) / 0.35);

    // Lateral drift animation: alternating rows move in opposite directions
    const driftDirection = rowIndex % 2 === 0 ? 1 : -1;
    const drift =
      driftDirection * time * DRIFT_SPEED * width * (0.3 + depthT * 0.7);

    // Vertical breathing animation
    const breatheAmt = 5 + depthT * 18;
    const breatheOffset = Math.sin(time * 0.5 + rowIndex * 0.6) * breatheAmt;
    const animY = y + breatheOffset;

    // Brickwork offset (every other row shifted by half a wave width)
    const isOffsetRow = rowIndex % 2 === 1;
    const waveWidth = radius * 2;
    const baseOffset = isOffsetRow ? radius : 0;

    // Calculate start position for tiling across width
    const padding = waveWidth * 3;
    const startX = -padding + ((drift + baseOffset) % waveWidth);
    const normalizedStartX =
      startX - Math.ceil((startX + padding) / waveWidth) * waveWidth;

    for (let x = normalizedStartX; x < width + padding; x += waveWidth) {
      const cx = x;
      const cy = animY;

      if (cy - radius > height + radius) continue;

      drawWaveUnit(
        ctx,
        cx,
        cy,
        radius,
        lineCount,
        lineWidth,
        alpha,
        palette,
        fillColor,
        spacing,
      );
    }

    if (interRowCallback) {
      interRowCallback(ctx, rowIndex, animY);
    }

    y += spacing;
  }

  ctx.globalAlpha = 1;
}

/**
 * Render the full sea layer
 */
export function renderSea(
  ctx: CanvasRenderingContext2D,
  dimensions: Dimensions,
  horizonBaseY: number,
  horizonPoints: number[],
  time: number,
  noise2D: Noise2D,
  palette: Palette,
  waveScale = 1,
  interRowCallback?: InterRowCallback,
  cache?: SeaPatternCache | null,
) {
  const { width, height } = dimensions;

  ctx.save();

  if (cache) {
    ctx.drawImage(cache.baseCanvas, 0, 0, width, height);
    drawCachedSeigaihaPattern(ctx, dimensions, time, cache, interRowCallback);
    ctx.restore();
    return;
  }

  // Sea base gradient fill (below horizon only)
  const seaGradient = ctx.createLinearGradient(0, horizonBaseY, 0, height);
  seaGradient.addColorStop(0, palette.seaLight);
  seaGradient.addColorStop(0.35, palette.seaMid);
  seaGradient.addColorStop(1, palette.seaDeep);
  ctx.fillStyle = seaGradient;
  ctx.fillRect(0, horizonBaseY, width, height - horizonBaseY);

  // Seigaiha concentric arc wave pattern — no clip so wave arcs
  // can extend above the horizon, letting their shape define it
  drawSeigaihaPattern(
    ctx,
    dimensions,
    horizonBaseY,
    horizonPoints,
    time,
    noise2D,
    palette,
    waveScale,
    interRowCallback,
  );

  ctx.restore();
}
