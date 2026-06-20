import { getCanvas2DContext } from "./canvas";
import { createDotSkyCache } from "./dot-sky";
import { createNoiseGenerators } from "./noise";
import { createOffscreenCanvas } from "./offscreen";
import { PALETTES } from "./palette";
import { createSeaPatternCache } from "./sea";
import {
  Dimensions,
  Palette,
  SceneConfig,
  SceneState,
  SkyMode,
  SunOverlayConfig,
  createDefaultSunAnimationParams,
} from "./types";

/**
 * Pre-render paper texture to an offscreen canvas (static — never changes per frame)
 */
function createPaperTextureCache(
  width: number,
  height: number,
  noise2D: (x: number, y: number) => number,
): HTMLCanvasElement {
  const canvas = createOffscreenCanvas(width, height);
  const ctx = getCanvas2DContext(canvas);

  ctx.globalAlpha = 0.03;
  const step = 6;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const n = noise2D(x * 0.05, y * 0.05);
      if (n > 0.3) {
        ctx.fillStyle = n > 0.6 ? "#FFF" : "#000";
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  return canvas;
}

/**
 * Pre-render vignette to an offscreen canvas (static — only depends on dimensions)
 */
function createVignetteCache(width: number, height: number): HTMLCanvasElement {
  const canvas = createOffscreenCanvas(width, height);
  const ctx = getCanvas2DContext(canvas);

  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.35,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.7,
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.3)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas;
}

/**
 * Generate horizon points using noise for an organic, undulating horizon line
 */
function generateHorizon(
  width: number,
  horizonBaseY: number,
  noise2D: (x: number, y: number) => number,
  seed: number,
): number[] {
  const pointCount = Math.ceil(width / 4) + 1;
  const points: number[] = [];

  // Flat horizon line - no noise undulation
  for (let i = 0; i < pointCount; i++) {
    points.push(horizonBaseY);
  }

  return points;
}

/**
 * Create a new scene with the given configuration.
 * Each seed produces a unique but deterministic scene.
 */
export function createScene(
  dimensions: Dimensions,
  seed?: number,
  palette?: Palette,
  waveScale?: number,
  skyMode?: SkyMode,
  renderScale = 1,
): SceneState {
  const actualSeed = seed ?? Math.floor(Math.random() * 999999);
  const { noise2D, rng } = createNoiseGenerators(actualSeed);

  const resolvedPalette =
    palette ?? PALETTES[Math.floor(rng() * PALETTES.length)];
  const resolvedSkyMode = skyMode ?? "day";

  const horizonRatio = 0.48 + rng() * 0.06; // 48-54% from top

  const config: SceneConfig = {
    seed: actualSeed,
    dimensions,
    horizonRatio,
    waveLineCount: 80,
    waveSpeed: 0.4,
    waveScale: waveScale ?? 1,
    renderScale,
    palette: resolvedPalette,
    skyMode: resolvedSkyMode,
  };

  const horizonBaseY = horizonRatio * dimensions.height;
  const horizonPoints = generateHorizon(
    dimensions.width,
    horizonBaseY,
    noise2D,
    actualSeed,
  );

  const { cache: dotSkyCache, sunFormation } = createDotSkyCache(
    dimensions,
    horizonBaseY,
    actualSeed,
    resolvedSkyMode,
  );

  // Sun overlay only needed in day/dusk modes (sun visible)
  const sunOverlayConfig: SunOverlayConfig | null =
    resolvedSkyMode !== "night"
      ? {
          center: sunFormation.center,
          innerRadius: sunFormation.innerRadius,
          glowRadius: sunFormation.innerRadius * 6,
          horizonY: horizonBaseY,
          animations: createDefaultSunAnimationParams(),
        }
      : null;

  // Pre-render static layers (these never change per frame)
  const { width, height } = dimensions;
  const noiseCache = { noise2D };
  const paperTextureCache = createPaperTextureCache(width, height, noise2D);
  const vignetteCache = createVignetteCache(width, height);
  const seaPatternCache = createSeaPatternCache(
    dimensions,
    horizonBaseY,
    resolvedPalette,
    config.waveScale,
    config.renderScale,
  );

  return {
    time: 0,
    config,
    entities: [],
    horizonPoints,
    dotSkyCache,
    sunOverlayConfig,
    noiseCache,
    paperTextureCache,
    vignetteCache,
    seaPatternCache,
    tentacleGlitch: null,
  };
}

/**
 * Update the scene state for one frame
 */
export function updateScene(state: SceneState, deltaTime: number): void {
  state.time += deltaTime;
}

/**
 * Resize the scene to new dimensions (re-generates with same seed)
 */
export function resizeScene(
  state: SceneState,
  dimensions: Dimensions,
): SceneState {
  return createScene(
    dimensions,
    state.config.seed,
    state.config.palette,
    state.config.waveScale,
    state.config.skyMode,
    state.config.renderScale,
  );
}
