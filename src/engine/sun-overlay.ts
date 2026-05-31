import { SunOverlayConfig } from "./types";

/**
 * Compute the rotation angle for the dot sky canvas.
 * Returns 0 if rotation is disabled.
 */
export function getSunRotationAngle(
  overlay: SunOverlayConfig,
  time: number,
): number {
  if (!overlay.animations.rotation.enabled) return 0;
  // Speed 0.5 => 1.5 degrees per second (~4 min full rotation)
  const degreesPerSecond = overlay.animations.rotation.speed * 3;
  const radiansPerSecond = degreesPerSecond * (Math.PI / 180);
  return time * radiansPerSecond;
}

/**
 * Render all enabled sun animation overlays.
 * Called each frame AFTER the cached dot sky is composited but BEFORE the sea.
 */
export function renderSunOverlays(
  ctx: CanvasRenderingContext2D,
  overlay: SunOverlayConfig,
  time: number,
  canvasWidth: number,
): void {
  const { animations } = overlay;

  if (animations.pulsingGlow.enabled) {
    renderPulsingGlow(ctx, overlay, time, canvasWidth);
  }
  if (animations.radiatingRings.enabled) {
    renderRadiatingRings(ctx, overlay, time, canvasWidth);
  }
  if (animations.shimmer.enabled) {
    renderShimmer(ctx, overlay, time, canvasWidth);
  }
}

// ─── Animation 1: Pulsing Central Glow ────────────────────────────

function renderPulsingGlow(
  ctx: CanvasRenderingContext2D,
  overlay: SunOverlayConfig,
  time: number,
  canvasWidth: number,
) {
  const { center, glowRadius, horizonY, animations } = overlay;
  const { speed, intensity } = animations.pulsingGlow;

  // Sine wave oscillation: 0.0 to 1.0
  const pulse = (Math.sin(time * speed * Math.PI * 2) + 1) / 2;

  // Base alpha modulated by pulse and intensity
  const alpha = 0.05 + pulse * intensity * 0.4;

  // Radius oscillates between 80% and 120% of base glow radius
  const radiusScale = 0.8 + pulse * 0.4 * intensity;
  const r = glowRadius * radiusScale;

  ctx.save();

  // Clip to sky region
  ctx.beginPath();
  ctx.rect(0, 0, canvasWidth, horizonY + 2);
  ctx.clip();

  const glow = ctx.createRadialGradient(
    center.x,
    center.y,
    0,
    center.x,
    center.y,
    r,
  );
  glow.addColorStop(0, `rgba(255, 255, 240, ${alpha})`);
  glow.addColorStop(0.4, `rgba(255, 230, 120, ${alpha * 0.5})`);
  glow.addColorStop(1, "rgba(255, 180, 30, 0)");

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─── Animation 2: Radiating Ring Pulse ────────────────────────────

function renderRadiatingRings(
  ctx: CanvasRenderingContext2D,
  overlay: SunOverlayConfig,
  time: number,
  canvasWidth: number,
) {
  const { center, innerRadius, glowRadius, horizonY, animations } = overlay;
  const { speed, intensity } = animations.radiatingRings;

  ctx.save();

  // Clip to sky
  ctx.beginPath();
  ctx.rect(0, 0, canvasWidth, horizonY + 2);
  ctx.clip();

  // 3 concentric ripple rings traveling outward, staggered by 1/3 of the cycle
  const maxRadius = glowRadius * 2.5;
  const ringCount = 3;

  for (let i = 0; i < ringCount; i++) {
    // Phase offset for each ring
    const phase = (time * speed * 0.15 + i / ringCount) % 1.0;

    // Radius grows from innerRadius to maxRadius
    const radius = innerRadius + phase * (maxRadius - innerRadius);

    // Alpha: fade in quickly, then fade out as it expands
    const fadeIn = Math.min(1, phase / 0.2);
    const fadeOut = Math.max(0, 1 - (phase - 0.2) / 0.8);
    const alpha = fadeIn * fadeOut * intensity * 0.25;

    if (alpha < 0.005) continue;

    ctx.strokeStyle = `rgba(255, 240, 200, ${alpha})`;
    ctx.lineWidth = 2 + (1 - phase) * 3;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

// ─── Animation 4: Heat Shimmer / Dot Twinkle ──────────────────────

function renderShimmer(
  ctx: CanvasRenderingContext2D,
  overlay: SunOverlayConfig,
  time: number,
  canvasWidth: number,
) {
  const { center, innerRadius, glowRadius, horizonY, animations } = overlay;
  const { intensity } = animations.shimmer;

  ctx.save();

  // Clip to sky
  ctx.beginPath();
  ctx.rect(0, 0, canvasWidth, horizonY + 2);
  ctx.clip();

  // Fixed set of shimmer dot positions using golden angle distribution
  const shimmerRadius = glowRadius * 1.5;
  const dotCount = Math.floor(20 + intensity * 60);

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < dotCount; i++) {
    const theta = i * goldenAngle;
    const r = innerRadius * 0.5 + (i / dotCount) * shimmerRadius;

    const x = center.x + Math.cos(theta) * r;
    const y = center.y + Math.sin(theta) * r;

    // Skip dots outside sky
    if (y < 0 || y > horizonY || x < 0 || x > canvasWidth) continue;

    // Each dot has its own phase offset for staggered twinkling
    const phaseOffset = i * 0.618;
    const twinkle = (Math.sin(time * 1.5 + phaseOffset * Math.PI * 2) + 1) / 2;

    // Only render when bright enough
    const alpha = twinkle * intensity * 0.6;
    if (alpha < 0.05) continue;

    const dotSize = 1.5 + (i % 3) * 0.5;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#FFFFF0";
    ctx.beginPath();
    ctx.arc(x, y, dotSize, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}
