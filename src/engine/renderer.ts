import { compositeDotSky, drawNoisyRingSun } from "./dot-sky";
import { createNoiseGenerators } from "./noise";
import { InterRowCallback, renderSea } from "./sea";
import { renderSky } from "./sky";
import { getSunRotationAngle, renderSunOverlays } from "./sun-overlay";
import { renderGlitchTentacles } from "./tentacles";
import { SceneState } from "./types";
import { renderWhale } from "./whale";

/**
 * Main renderer - draws the complete scene to a canvas context
 */
export function renderScene(ctx: CanvasRenderingContext2D, state: SceneState) {
  const { config, horizonPoints, time } = state;
  const { dimensions, palette } = config;
  const { width, height } = dimensions;

  const noise2D =
    state.noiseCache?.noise2D ?? createNoiseGenerators(config.seed).noise2D;

  ctx.clearRect(0, 0, width, height);

  const horizonBaseY = config.horizonRatio * height;
  const skyMode = config.skyMode;

  // Layer 1: Sky background
  if (state.dotSkyCache) {
    compositeDotSky(ctx, state.dotSkyCache);

    if (skyMode !== "day") {
      const { moonCanvas } = state.dotSkyCache;
      ctx.drawImage(
        moonCanvas,
        0,
        0,
        moonCanvas.width,
        moonCanvas.height,
        0,
        0,
        state.dotSkyCache.dimensions.width,
        state.dotSkyCache.horizonY + 2,
      );
    }

    if (skyMode !== "night") {
      const rotationAngle = state.sunOverlayConfig
        ? getSunRotationAngle(state.sunOverlayConfig, time)
        : 0;

      if (rotationAngle !== 0) {
        const ringGen = createNoiseGenerators(state.dotSkyCache.seed + 8000);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width, horizonBaseY + 2);
        ctx.clip();
        drawNoisyRingSun(
          ctx,
          state.dotSkyCache.sunFormation,
          horizonBaseY,
          ringGen.noise2D,
          ringGen.rng,
          rotationAngle,
        );
        ctx.restore();
      } else {
        const { sunCanvas } = state.dotSkyCache;
        ctx.drawImage(
          sunCanvas,
          0,
          0,
          sunCanvas.width,
          sunCanvas.height,
          0,
          0,
          state.dotSkyCache.dimensions.width,
          state.dotSkyCache.horizonY + 2,
        );
      }
    }
  } else {
    renderSky(ctx, dimensions, horizonBaseY + 15, palette);
  }

  // Layer 1.5: Sun animation overlays (day and dusk only)
  if (skyMode !== "night" && state.sunOverlayConfig) {
    renderSunOverlays(ctx, state.sunOverlayConfig, time, width);
  }

  // Build the inter-row callback. Both the night tentacles and the day whale
  // draw between wave rows so the foreground rows paint on top, giving depth:
  //   - tentacles fire after row 7 (rows 8-11 overlap),
  //   - the whale fires after a mid row (later rows submerge its lower body).
  const GLITCH_AFTER_ROW = 7;
  const WHALE_AFTER_ROW = 8;
  let interRowCallback: InterRowCallback | undefined;

  if (config.skyMode === "night" && state.tentacleGlitch) {
    const glitchState = state.tentacleGlitch;
    interRowCallback = (drawCtx, rowIndex) => {
      if (rowIndex !== GLITCH_AFTER_ROW) return;
      renderGlitchTentacles(drawCtx, glitchState, time, noise2D);
    };
  } else if (config.skyMode === "day" && state.whale) {
    const whale = state.whale;
    interRowCallback = (drawCtx, rowIndex, rowY) => {
      if (rowIndex !== WHALE_AFTER_ROW) return;
      renderWhale(drawCtx, whale, time, rowY);
    };
  }

  // Layer 2: Sea (base fill + seigaiha wave pattern)
  renderSea(
    ctx,
    dimensions,
    horizonBaseY,
    horizonPoints,
    time,
    noise2D,
    palette,
    config.waveScale,
    interRowCallback,
    state.seaPatternCache,
  );

  // Subtle paper texture overlay
  if (state.paperTextureCache) {
    ctx.drawImage(state.paperTextureCache, 0, 0);
  }

  // Vignette
  if (state.vignetteCache) {
    ctx.drawImage(state.vignetteCache, 0, 0);
  }
}
