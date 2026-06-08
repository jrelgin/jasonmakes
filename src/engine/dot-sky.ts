import { getCanvas2DContext } from "./canvas";
import { DOT_EARTH_TONES } from "./dot-palette";
import { createNoiseGenerators } from "./noise";
import { isMobileWidth } from "./responsive";
import {
  Dimensions,
  DotCircleFormation,
  DotSkyCache,
  DotSkyConfig,
  MoonCrescentConfig,
  SkyMode,
} from "./types";

type Noise2D = (x: number, y: number) => number;
type RNG = () => number;

// ─── Sky mode helpers ────────────────────────────────────────────

const SKY_BASE_FILL: Record<SkyMode, string> = {
  day: "#FFFFFF",
  night: "#101018",
  dusk: "#101018",
};

function getBackgroundColors(skyMode: SkyMode): readonly string[] {
  switch (skyMode) {
    case "night":
      return DOT_EARTH_TONES.backgroundDusk;
    case "dusk":
      return DOT_EARTH_TONES.backgroundDusk;
    default:
      return DOT_EARTH_TONES.backgroundBlue;
  }
}

// ─── Dot sky config generation ───────────────────────────────────

function createDotSkyConfig(
  dimensions: Dimensions,
  horizonY: number,
  seed: number,
  skyMode: SkyMode,
): DotSkyConfig {
  const { width } = dimensions;

  // Sun center near the waterline, offset to the right.
  // Large outerRadius ensures concentric arcs sweep the full sky from this anchor point.
  const cx = width * 0.75;
  const cy = horizonY * 0.88;
  // Must reach the farthest sky corner so rings cover the entire sky
  const outerRadius = Math.ceil(
    Math.sqrt(Math.max(cx, width - cx) ** 2 + cy ** 2),
  );
  // On mobile the sun scales down with the canvas and reads as a small,
  // washed-out cluster. Enlarge the warm focal core + glow on phones WITHOUT
  // changing dot density: ringCount/ringSpacing below are derived from the
  // UNSCALED base radius so the ring pitch (and the dotSize*1.2 dot pitch in
  // drawNoisyRingSun) is pixel-identical to desktop.
  const SUN_MOBILE_SCALE = 2.2;
  const baseInnerRadius = Math.max(14, horizonY * 0.02);
  const innerRadius = isMobileWidth(width)
    ? baseInnerRadius * SUN_MOBILE_SCALE
    : baseInnerRadius;
  // ~14px spacing — between the original 20px and the denser 10px
  const ringCount = Math.round((outerRadius - baseInnerRadius) / 14);
  const ringSpacing = (outerRadius - baseInnerRadius) / ringCount;

  // Map the sun gradient evenly across ringCount
  const gradientLen = DOT_EARTH_TONES.sunRingGradient.length;
  const colors: string[] = Array.from({ length: ringCount }, (_, i) => {
    const t = i / Math.max(1, ringCount - 1);
    const idx = Math.min(gradientLen - 1, Math.floor(t * (gradientLen - 1)));
    return DOT_EARTH_TONES.sunRingGradient[idx];
  });

  const sun: DotCircleFormation = {
    center: { x: cx, y: cy },
    ringCount,
    innerRadius,
    ringSpacing,
    dotSize: 2.5, // base; grows per ring in the draw function
    colors,
  };

  const moon = createMoonCrescentConfig(dimensions, horizonY, skyMode);

  return {
    sun,
    moon,
    backgroundSeed: seed + 7000,
  };
}

// ─── Moon crescent config ────────────────────────────────────────

function createMoonCrescentConfig(
  dimensions: Dimensions,
  horizonY: number,
  skyMode: SkyMode,
): MoonCrescentConfig {
  const { width } = dimensions;

  // Night: prominent crescent on the left, near horizon
  // Dusk: upper-left accent (smaller)
  const cx = skyMode === "night" ? width * 0.25 : width * 0.18;
  const cy = skyMode === "night" ? horizonY * 0.72 : horizonY * 0.58;

  // Night: larger crescent to be visually significant against dark sky
  // Dusk: same contained accent
  const moonRadius =
    skyMode === "night"
      ? Math.max(115, horizonY * 0.65)
      : Math.max(60, horizonY * 0.57);

  // Always contained — rings stay within moonRadius
  const outerR = moonRadius;

  // Shadow circle creates crescent shape within moonRadius
  const shadowCenter = {
    x: cx + moonRadius * 0.35,
    y: cy - moonRadius * 0.05,
  };
  const shadowRadius = moonRadius * 0.72;

  // Ring structure from center to outerRadius
  const innerRadius = Math.max(4, moonRadius * 0.03);
  const ringCount = Math.max(8, Math.round(moonRadius / 6));
  const ringSpacing = (outerR - innerRadius) / Math.max(1, ringCount);

  // Map gold gradient evenly across rings
  const gradientLen = DOT_EARTH_TONES.moonGoldGradient.length;
  const colors: string[] = Array.from({ length: ringCount }, (_, i) => {
    const t = i / Math.max(1, ringCount - 1);
    const idx = Math.min(gradientLen - 1, Math.floor(t * (gradientLen - 1)));
    return DOT_EARTH_TONES.moonGoldGradient[idx];
  });

  return {
    center: { x: cx, y: cy },
    moonRadius,
    outerRadius: outerR,
    shadowCenter,
    shadowRadius,
    ringCount,
    ringSpacing,
    dotSize: 2.0,
    colors,
  };
}

// ─── Concentric dot background ──────────────────────────────────
// Rings share the same center as the primary celestial body so the
// whole sky is one unified radial pattern.

function drawBackgroundDotField(
  ctx: CanvasRenderingContext2D,
  dimensions: Dimensions,
  horizonY: number,
  centerX: number,
  centerY: number,
  rng: RNG,
  bgColors: readonly string[],
  blendColors?: readonly string[],
  blendMidX?: number,
) {
  const { width } = dimensions;

  const ringSpacing = 5; // tight rings — dots in adjacent rings essentially touch
  const dotRadius = 2.75; // matches original cellSize * 0.55; rings touch at this size

  // Reach the farthest sky corner from the center
  const maxDist = Math.ceil(
    Math.sqrt(
      Math.max(centerX, width - centerX) ** 2 +
        Math.max(centerY, horizonY - centerY) ** 2,
    ),
  );
  const ringCount = Math.ceil(maxDist / ringSpacing);

  // Blend zone width (for dusk horizontal blend)
  const hasBlend = blendColors !== undefined && blendMidX !== undefined;
  const blendHalf = width * 0.15; // ±15% of width around midpoint

  for (let ringIdx = 1; ringIdx <= ringCount; ringIdx++) {
    const baseRadius = ringIdx * ringSpacing;
    const circumference = 2 * Math.PI * baseRadius;
    // Dot pitch matches the ring spacing for uniform density
    const dotCount = Math.max(
      6,
      Math.floor(circumference / (dotRadius * 2 * 1.1)),
    );

    for (let i = 0; i < dotCount; i++) {
      const theta = (i / dotCount) * 2 * Math.PI;

      // Small jitter keeps dots hand-painted rather than mechanically precise
      const radialJitter = (rng() - 0.5) * ringSpacing * 0.4;
      const angularJitter = (rng() - 0.5) * ((2 * Math.PI) / dotCount) * 0.3;

      const x =
        centerX + Math.cos(theta + angularJitter) * (baseRadius + radialJitter);
      const y =
        centerY + Math.sin(theta + angularJitter) * (baseRadius + radialJitter);

      if (y < 0 || y > horizonY || x < 0 || x > width) continue;

      // Pick color — blend between two palettes if in dusk mode
      let color: string;
      if (hasBlend && blendColors && blendMidX !== undefined) {
        // Smooth blend: 0 = left (dark/dusk), 1 = right (blue/day)
        const t = Math.max(
          0,
          Math.min(1, (x - (blendMidX - blendHalf)) / (blendHalf * 2)),
        );
        if (rng() < t) {
          color = bgColors[Math.floor(rng() * bgColors.length)];
        } else {
          color = blendColors[Math.floor(rng() * blendColors.length)];
        }
      } else {
        color = bgColors[Math.floor(rng() * bgColors.length)];
      }

      const alpha = 0.88 + rng() * 0.12;
      const r = dotRadius * (0.9 + rng() * 0.2);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
}

// ─── Noise-displaced concentric ring sun ─────────────────────────

export function drawNoisyRingSun(
  ctx: CanvasRenderingContext2D,
  config: DotCircleFormation,
  horizonY: number,
  noise2D: Noise2D,
  rng: RNG,
  rotationAngle = 0,
) {
  const { center, ringCount, innerRadius, ringSpacing, colors } = config;
  const { x: cx, y: cy } = center;

  // Soft center glow — blends into the dot field, no hard edges
  const glowRadius = innerRadius * 6;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
  glow.addColorStop(0, "rgba(255, 255, 240, 0.7)");
  glow.addColorStop(0.4, "rgba(255, 230, 120, 0.35)");
  glow.addColorStop(1, "rgba(255, 180, 30, 0)");
  ctx.fillStyle = glow;
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  // ── Noise parameters ───────────────────────────────────────────
  // noiseFreq controls how many wobble undulations appear per full rotation.
  // 2.5 → roughly 2–3 organic bulges/dents per ring, matching reference art.
  const noiseFreq = 2.5;

  // Power curve for ring positions: exponent > 1 clusters rings tightly near
  // the center (yellow zone) and fans them out toward the orange/red outer edge.
  const totalSpan = ringCount * ringSpacing;
  const curveExp = 1.8;

  for (let ringIdx = 0; ringIdx < ringCount; ringIdx++) {
    const t = ringIdx / Math.max(1, ringCount - 1);
    const baseRadius = innerRadius + t ** curveExp * totalSpan;

    // Local spacing: derivative of the curve, used for proportional wobble amplitude
    const tPrev = Math.max(0, (ringIdx - 1) / Math.max(1, ringCount - 1));
    const localSpacing = (t ** curveExp - tPrev ** curveExp) * totalSpan;

    const color = colors[Math.min(ringIdx, colors.length - 1)];

    // Dot size grows linearly with ring index; outer rings have larger, bolder dots
    const dotSize = 2.5 + ringIdx * 0.28;
    const dotRadius = dotSize / 2;

    // Moderate density — background will show through outer rings naturally
    const circumference = 2 * Math.PI * baseRadius;
    const dotCount = Math.max(12, Math.floor(circumference / (dotSize * 1.2)));

    // Outer rings fade to transparent so warm dots dissolve into the sky.
    // Inner 78%: full opacity. Outer 22%: fade to 0 with a smooth power curve.
    const ringT = ringIdx / Math.max(1, ringCount - 1);
    const fadeStart = 0.78;
    const fadeFactor =
      ringT < fadeStart
        ? 1.0
        : (1.0 - (ringT - fadeStart) / (1.0 - fadeStart)) ** 1.5;
    const baseAlpha = 0.99 * fadeFactor;

    for (let i = 0; i < dotCount; i++) {
      // rotationAngle offsets all dots uniformly — the wobble pattern rotates with them
      const theta = rotationAngle + (i / dotCount) * 2 * Math.PI;

      // Sample noise at unit-circle coordinates scaled by noiseFreq.
      // Using the same angular coordinates for every ring creates coherent wobble —
      // adjacent rings bulge in the same direction, looking like one unified form.
      const nx = Math.cos(theta) * noiseFreq;
      const ny = Math.sin(theta) * noiseFreq;

      // Angular wobble: shifts the dot's angle slightly (coherent across rings)
      const angularWobble = noise2D(nx, ny) * 0.06; // ±~3.4°

      // Radial wobble: pushes the dot's radius in or out.
      // +7.3 offset decorrelates from angular wobble using the same noise function.
      const radialWobble = noise2D(nx + 7.3, ny + 7.3) * localSpacing * 0.35;

      const finalAngle = theta + angularWobble;
      const finalRadius = baseRadius + radialWobble;

      const x = cx + Math.cos(finalAngle) * finalRadius;
      const y = cy + Math.sin(finalAngle) * finalRadius;

      // Clip: skip dots outside the sky region
      if (y < 0 || y > horizonY) continue;

      // Per-dot imperfection for hand-painted feel
      const sizeVar = 0.8 + rng() * 0.4;
      const alphaVar = baseAlpha * (0.75 + rng() * 0.5);

      ctx.globalAlpha = Math.min(1, alphaVar);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, dotRadius * sizeVar, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
}

// ─── Noise-displaced crescent moon ───────────────────────────────
// Contained dot formation with radiating glow extending outward.

function drawNoisyCrescentMoon(
  ctx: CanvasRenderingContext2D,
  config: MoonCrescentConfig,
  horizonY: number,
  noise2D: Noise2D,
  rng: RNG,
) {
  const {
    center,
    moonRadius,
    shadowCenter,
    shadowRadius,
    ringCount,
    ringSpacing,
    dotSize: baseDotSize,
    colors,
  } = config;
  const { x: cx, y: cy } = center;

  // ── Radiating glow — soft silver/gold light emanating from moon center ──
  // Drawn BEFORE dots so dots sit on top of the glow
  const glowOuterRadius = moonRadius * 5;
  const outerGlow = ctx.createRadialGradient(
    cx,
    cy,
    moonRadius * 0.3,
    cx,
    cy,
    glowOuterRadius,
  );
  outerGlow.addColorStop(0, "rgba(255, 248, 220, 0.25)");
  outerGlow.addColorStop(0.2, "rgba(255, 220, 140, 0.14)");
  outerGlow.addColorStop(0.45, "rgba(220, 180, 60, 0.06)");
  outerGlow.addColorStop(1, "rgba(180, 140, 30, 0)");
  ctx.fillStyle = outerGlow;
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, glowOuterRadius, 0, Math.PI * 2);
  ctx.fill();

  // ── Center glow clipped to crescent shape (warm silver/gold) ──
  const innerGlowR = moonRadius * 0.5;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, innerGlowR, 0, Math.PI * 2);
  ctx.arc(shadowCenter.x, shadowCenter.y, shadowRadius, 0, Math.PI * 2, true);
  ctx.clip();
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerGlowR);
  glow.addColorStop(0, "rgba(255, 248, 220, 0.6)");
  glow.addColorStop(0.4, "rgba(255, 220, 140, 0.3)");
  glow.addColorStop(1, "rgba(200, 160, 40, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, innerGlowR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Crescent dot rings (always contained within moonRadius) ──
  const noiseFreq = 2.5;
  const innerRadius = Math.max(4, moonRadius * 0.03);
  const totalSpan = ringCount * ringSpacing;
  const curveExp = 1.6;

  // Pre-compute shadow values for distance test
  const shadowCx = shadowCenter.x;
  const shadowCy = shadowCenter.y;
  const shadowR2 = shadowRadius * shadowRadius;
  const moonR2 = moonRadius * moonRadius;

  for (let ringIdx = 0; ringIdx < ringCount; ringIdx++) {
    const t = ringIdx / Math.max(1, ringCount - 1);
    const baseRadius = innerRadius + t ** curveExp * totalSpan;

    const tPrev = Math.max(0, (ringIdx - 1) / Math.max(1, ringCount - 1));
    const localSpacing = (t ** curveExp - tPrev ** curveExp) * totalSpan;

    const color = colors[Math.min(ringIdx, colors.length - 1)];
    const dotSize = baseDotSize + ringIdx * 0.22;
    const dotRadius = dotSize / 2;

    const circumference = 2 * Math.PI * baseRadius;
    const dotCount = Math.max(12, Math.floor(circumference / (dotSize * 1.2)));

    // Outer ring fade
    const ringT = ringIdx / Math.max(1, ringCount - 1);
    const fadeStart = 0.75;
    const fadeFactor =
      ringT < fadeStart
        ? 1.0
        : (1.0 - (ringT - fadeStart) / (1.0 - fadeStart)) ** 1.5;
    const baseAlpha = 0.95 * fadeFactor;

    for (let i = 0; i < dotCount; i++) {
      const theta = (i / dotCount) * 2 * Math.PI;

      const nx = Math.cos(theta) * noiseFreq;
      const ny = Math.sin(theta) * noiseFreq;

      const angularWobble = noise2D(nx, ny) * 0.06;
      const radialWobble = noise2D(nx + 7.3, ny + 7.3) * localSpacing * 0.35;

      const finalAngle = theta + angularWobble;
      const finalRadius = baseRadius + radialWobble;

      const x = cx + Math.cos(finalAngle) * finalRadius;
      const y = cy + Math.sin(finalAngle) * finalRadius;

      // Clip to sky region
      if (y < 0 || y > horizonY) continue;

      // Contained: skip dots outside moon circle
      const dxMoon = x - cx;
      const dyMoon = y - cy;
      if (dxMoon * dxMoon + dyMoon * dyMoon > moonR2) continue;

      // Crescent exclusion — skip dots inside shadow circle
      const dxShadow = x - shadowCx;
      const dyShadow = y - shadowCy;
      if (dxShadow * dxShadow + dyShadow * dyShadow < shadowR2) continue;

      // Per-dot imperfection
      const sizeVar = 0.8 + rng() * 0.4;
      const alphaVar = baseAlpha * (0.75 + rng() * 0.5);

      ctx.globalAlpha = Math.min(1, alphaVar);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, dotRadius * sizeVar, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
}

// ─── Public API ──────────────────────────────────────────────────

export interface DotSkyCacheResult {
  cache: DotSkyCache;
  sunFormation: DotCircleFormation;
}

export function createDotSkyCache(
  dimensions: Dimensions,
  horizonY: number,
  seed: number,
  skyMode: SkyMode = "day",
): DotSkyCacheResult {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const canvasHeight = Math.ceil(horizonY + 2);

  const config = createDotSkyConfig(dimensions, horizonY, seed, skyMode);

  // Sky background canvas (base fill + dot field)
  const offscreen = document.createElement("canvas");
  offscreen.width = dimensions.width * dpr;
  offscreen.height = canvasHeight * dpr;
  const ctx = getCanvas2DContext(offscreen);
  ctx.scale(dpr, dpr);

  // Sun canvas (transparent background, sun rings only — enables independent rotation)
  const sunOffscreen = document.createElement("canvas");
  sunOffscreen.width = dimensions.width * dpr;
  sunOffscreen.height = canvasHeight * dpr;
  const sunCtx = getCanvas2DContext(sunOffscreen);
  sunCtx.scale(dpr, dpr);

  // Moon canvas (transparent background, moon dots + glow — separate layer)
  const moonOffscreen = document.createElement("canvas");
  moonOffscreen.width = dimensions.width * dpr;
  moonOffscreen.height = canvasHeight * dpr;
  const moonCtx = getCanvas2DContext(moonOffscreen);
  moonCtx.scale(dpr, dpr);

  // Separate noise generators for background dots, sun rings, and moon rings
  const bgGen = createNoiseGenerators(config.backgroundSeed);
  const ringGen = createNoiseGenerators(seed + 8000);
  const moonGen = createNoiseGenerators(seed + 9000);

  // Draw sky background
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, dimensions.width, horizonY + 2);
  ctx.clip();

  if (skyMode === "dusk") {
    // Dusk: horizontal gradient base fill — light (right/sun) to dark (left/moon)
    const grad = ctx.createLinearGradient(0, 0, dimensions.width, 0);
    grad.addColorStop(0, SKY_BASE_FILL.dusk); // dark left
    grad.addColorStop(0.5, "#404858"); // mid blend
    grad.addColorStop(1, SKY_BASE_FILL.day); // light right
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = SKY_BASE_FILL[skyMode];
  }
  ctx.fillRect(0, 0, dimensions.width, horizonY + 2);

  if (skyMode === "dusk") {
    // Dusk: blended dot field — blue on right, dark on left
    const centerX = dimensions.width * 0.5;
    const centerY = horizonY * 0.5;
    drawBackgroundDotField(
      ctx,
      dimensions,
      horizonY,
      centerX,
      centerY,
      bgGen.rng,
      DOT_EARTH_TONES.backgroundBlue,
      DOT_EARTH_TONES.backgroundDusk,
      dimensions.width * 0.5,
    );
  } else {
    // Day / Night: single-palette background centered on primary body
    const bgCenter =
      skyMode === "night" ? config.moon.center : config.sun.center;
    drawBackgroundDotField(
      ctx,
      dimensions,
      horizonY,
      bgCenter.x,
      bgCenter.y,
      bgGen.rng,
      getBackgroundColors(skyMode),
    );
  }

  ctx.restore();

  // Draw sun rings (day and dusk only — stays empty in night mode)
  if (skyMode !== "night") {
    sunCtx.save();
    sunCtx.beginPath();
    sunCtx.rect(0, 0, dimensions.width, horizonY + 2);
    sunCtx.clip();

    drawNoisyRingSun(
      sunCtx,
      config.sun,
      horizonY,
      ringGen.noise2D,
      ringGen.rng,
    );

    sunCtx.restore();
  }

  // Draw moon (night and dusk only — stays empty in day mode)
  if (skyMode !== "day") {
    moonCtx.save();
    moonCtx.beginPath();
    moonCtx.rect(0, 0, dimensions.width, horizonY + 2);
    moonCtx.clip();

    drawNoisyCrescentMoon(
      moonCtx,
      config.moon,
      horizonY,
      moonGen.noise2D,
      moonGen.rng,
    );

    moonCtx.restore();
  }

  return {
    cache: {
      canvas: offscreen,
      sunCanvas: sunOffscreen,
      moonCanvas: moonOffscreen,
      sunFormation: config.sun,
      moonConfig: config.moon,
      dimensions,
      horizonY,
      seed,
      paletteKey: "dot-art",
      skyMode,
    },
    sunFormation: config.sun,
  };
}

export function compositeDotSky(
  ctx: CanvasRenderingContext2D,
  cache: DotSkyCache,
) {
  ctx.drawImage(
    cache.canvas,
    0,
    0,
    cache.canvas.width,
    cache.canvas.height,
    0,
    0,
    cache.dimensions.width,
    cache.horizonY + 2,
  );
}
