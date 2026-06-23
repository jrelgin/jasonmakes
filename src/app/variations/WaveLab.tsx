"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

/**
 * WaveLab — interactive scratch surface for redesigning the inner-page wave.
 *
 * It compares the live site's current wave (shown verbatim as a fixed
 * "baseline" reference) against a tunable "refined" wave, for both the animated
 * masthead line and the foam-field background. Everything is driven by a single
 * path generator so the line and the field always share one shape. Nothing here
 * imports or mutates the real DriftingWave / SeaBackdrop — this page is a
 * sandbox. When a look is chosen, its numbers get ported into those components.
 */

// CSS style object that also accepts CSS custom properties (--wl-*).
type CSSVars = CSSProperties & { [key: `--${string}`]: string | number };

// The current production waves, lifted verbatim from the live components so the
// "baseline" reference is exactly what ships today.
//   line  → .drift-wave in src/styles/pages.css
//   field → the <pattern> in src/components/SeaBackdrop.tsx
const BASELINE_LINE = {
  width: 120,
  height: 18,
  strokeWidth: 1.6,
  path: "M0 9 C 12 9 18 4 30 4 S 48 4 60 9 S 78 14 90 14 S 108 14 120 9",
};
const BASELINE_FIELD = {
  width: 140,
  height: 26,
  strokeWidth: 1.4,
  path: "M0 13 C 14 13 21 5 35 5 S 56 13 70 13 S 91 21 105 21 S 126 21 140 13",
};

type Shape = "sine" | "plateau";

const DEFAULTS = {
  shape: "sine" as Shape,
  amplitude: 7.5,
  wavelength: 106,
  strokeWidth: 2,
  lineOpacity: 0.85,
  cycleSeconds: 9,
  parallax: true,
  parallaxOffset: 61,
  bobAmplitude: 0.5,
  rowGap: 24,
  fieldIntensity: 0.5,
  applyToBackground: false,
  // Second (parallax) line — tuned independently of line 1 so the two trains
  // can differ in size, period, and phase (what reads as natural water).
  amplitude2: 7.5,
  wavelength2: 106,
  phase2: 0,
};

// Build one period of the wave as an SVG path. "sine" is a clean, even curve;
// "plateau" soft-clips the peaks to mimic the flattened crests of the current
// bezier (useful for an A/B of the shape itself at matched dimensions).
function buildPath(
  shape: Shape,
  amplitude: number,
  wavelength: number,
  midline: number,
): string {
  const samples = Math.max(24, Math.round(wavelength / 2));
  const pts: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const x = (i / samples) * wavelength;
    let s = Math.sin((i / samples) * Math.PI * 2);
    if (shape === "plateau") {
      s = Math.max(-1, Math.min(1, s * 1.7));
    }
    const y = midline - amplitude * s;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

function svgUrl(
  path: string,
  width: number,
  height: number,
  strokeWidth: number,
): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'><path d='${path}' fill='none' stroke='#000' stroke-width='${strokeWidth}' stroke-linecap='round' stroke-linejoin='round'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// Style for one drifting line layer (a tinted bar revealed through the wave mask).
function driftLayer(
  maskUrl: string,
  tileW: number,
  tileH: number,
  color: string,
  opacity: number,
  cycleSeconds: number,
  delay = "0s",
): CSSVars {
  return {
    position: "absolute",
    inset: 0,
    backgroundColor: color,
    opacity,
    WebkitMaskImage: maskUrl,
    maskImage: maskUrl,
    WebkitMaskRepeat: "repeat-x",
    maskRepeat: "repeat-x",
    WebkitMaskSize: `${tileW}px ${tileH}px`,
    maskSize: `${tileW}px ${tileH}px`,
    WebkitMaskPosition: "0 50%",
    maskPosition: "0 50%",
    "--wl-shift": `-${tileW}px`,
    animation: `wl-drift ${cycleSeconds}s linear infinite`,
    animationDelay: delay,
  };
}

// Style for a tiled foam field: the wave tile intersected with a top/bottom
// fade, matching the real SeaBackdrop mask. Static, like the live backdrop.
function fieldLayer(
  maskUrl: string,
  tileW: number,
  tileH: number,
  color: string,
  intensity: number,
): CSSProperties {
  const fade =
    "linear-gradient(to bottom, transparent 0, #000 22%, #000 72%, transparent 100%)";
  return {
    position: "absolute",
    inset: 0,
    backgroundColor: color,
    opacity: intensity,
    WebkitMaskImage: `${maskUrl}, ${fade}`,
    maskImage: `${maskUrl}, ${fade}`,
    WebkitMaskRepeat: "repeat, no-repeat",
    maskRepeat: "repeat, no-repeat",
    WebkitMaskSize: `${tileW}px ${tileH}px, 100% 100%`,
    maskSize: `${tileW}px ${tileH}px, 100% 100%`,
    WebkitMaskComposite: "source-in",
    maskComposite: "intersect",
  };
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span
        className="flex items-center justify-between font-mono text-xs uppercase tracking-wider"
        style={{ color: "var(--u-ink-muted)" }}
      >
        <span>{label}</span>
        <span style={{ color: "var(--u-ink)" }}>
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number.parseFloat(e.target.value))}
        className="mt-1 w-full"
        style={{ accentColor: "var(--u-accent)" }}
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider"
      style={{ color: "var(--u-ink-muted)" }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: "var(--u-accent)" }}
      />
      {label}
    </label>
  );
}

export default function WaveLab() {
  const [s, setS] = useState(DEFAULTS);
  const set = <K extends keyof typeof DEFAULTS>(
    key: K,
    value: (typeof DEFAULTS)[K],
  ) => setS((prev) => ({ ...prev, [key]: value }));

  const lineColor = "var(--u-wave-line)";

  // Tunable line + field masks, regenerated whenever the inputs change.
  const tuned = useMemo(() => {
    // Container is sized to the taller of the two lines so neither clips; both
    // masks share one midline so they ride a common baseline.
    const ampMax = Math.max(s.amplitude, s.amplitude2);
    const lineHeight = Math.ceil(ampMax * 2 + s.strokeWidth * 2 + 6);
    const lineMid = lineHeight / 2;
    const linePath = buildPath(s.shape, s.amplitude, s.wavelength, lineMid);
    const lineUrl = svgUrl(linePath, s.wavelength, lineHeight, s.strokeWidth);

    const line2Path = buildPath(s.shape, s.amplitude2, s.wavelength2, lineMid);
    const line2Url = svgUrl(
      line2Path,
      s.wavelength2,
      lineHeight,
      s.strokeWidth,
    );

    const fieldMid = s.rowGap / 2;
    const fieldAmp = Math.min(s.amplitude, s.rowGap / 2 - s.strokeWidth);
    const fieldPath = buildPath(s.shape, fieldAmp, s.wavelength, fieldMid);
    const fieldUrl = svgUrl(fieldPath, s.wavelength, s.rowGap, s.strokeWidth);

    return { lineHeight, lineUrl, line2Url, fieldUrl };
  }, [
    s.shape,
    s.amplitude,
    s.amplitude2,
    s.wavelength,
    s.wavelength2,
    s.strokeWidth,
    s.rowGap,
  ]);

  const baselineLineUrl = svgUrl(
    BASELINE_LINE.path,
    BASELINE_LINE.width,
    BASELINE_LINE.height,
    BASELINE_LINE.strokeWidth,
  );
  const baselineFieldUrl = svgUrl(
    BASELINE_FIELD.path,
    BASELINE_FIELD.width,
    BASELINE_FIELD.height,
    BASELINE_FIELD.strokeWidth,
  );

  const parallaxCycle = s.cycleSeconds * (1 - s.parallaxOffset / 100);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-14 md:py-20">
      <style>{`
        @keyframes wl-drift {
          from { -webkit-mask-position: 0 50%; mask-position: 0 50%; }
          to   { -webkit-mask-position: var(--wl-shift) 50%; mask-position: var(--wl-shift) 50%; }
        }
        @keyframes wl-bob {
          0%, 100% { transform: translateY(calc(var(--wl-bob) * -1)); }
          50%      { transform: translateY(var(--wl-bob)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .wl-anim { animation: none !important; }
        }
      `}</style>

      <header className="max-w-3xl">
        <p className="u-eyebrow text-lg">Scratch · not linked in nav</p>
        <h1 className="u-title mt-3 text-5xl md:text-6xl">Wave Variations</h1>
        <p className="u-lede mt-5 text-xl">
          A sandbox for redesigning the inner-page wave — a cleaner line shape
          and motion you can actually see. The live site is untouched; these are
          comparisons against it. Use the theme toggle in the nav to check both
          palettes.
        </p>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[20rem_1fr]">
        {/* Controls */}
        <aside className="frost-panel h-fit space-y-5 p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h2
              className="font-mono text-xs uppercase tracking-wider"
              style={{ color: "var(--u-ink)" }}
            >
              Controls
            </h2>
            <button
              type="button"
              onClick={() => setS(DEFAULTS)}
              className="rounded px-2 py-1 font-mono text-xs uppercase tracking-wider"
              style={{
                color: "var(--u-accent)",
                border: "1px solid var(--u-hairline)",
              }}
            >
              Reset
            </button>
          </div>

          <div className="flex gap-2">
            {(["sine", "plateau"] as Shape[]).map((shape) => (
              <button
                key={shape}
                type="button"
                onClick={() => set("shape", shape)}
                className="flex-1 rounded px-2 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors"
                style={{
                  border: "1px solid var(--u-hairline)",
                  color: s.shape === shape ? "var(--u-bg-1)" : "var(--u-ink)",
                  backgroundColor:
                    s.shape === shape ? "var(--u-accent)" : "transparent",
                }}
              >
                {shape === "sine" ? "Refined sine" : "Plateau"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <Slider
              label="Amplitude · line 1"
              unit="px"
              min={1}
              max={10}
              step={0.5}
              value={s.amplitude}
              onChange={(v) => set("amplitude", v)}
            />
            <Slider
              label="Wavelength · line 1"
              unit="px"
              min={24}
              max={160}
              step={2}
              value={s.wavelength}
              onChange={(v) => set("wavelength", v)}
            />
            <Slider
              label="Stroke"
              unit="px"
              min={0.5}
              max={4}
              step={0.1}
              value={s.strokeWidth}
              onChange={(v) => set("strokeWidth", v)}
            />
            <Slider
              label="Line opacity"
              min={0.2}
              max={1}
              step={0.05}
              value={s.lineOpacity}
              onChange={(v) => set("lineOpacity", v)}
            />
          </div>

          <hr style={{ borderColor: "var(--u-hairline)" }} />

          <div className="space-y-4">
            <p
              className="font-mono text-xs uppercase tracking-wider"
              style={{ color: "var(--u-ink-muted)" }}
            >
              Motion
            </p>
            <Slider
              label="Cycle (lower = faster)"
              unit="s"
              min={2}
              max={24}
              step={0.5}
              value={s.cycleSeconds}
              onChange={(v) => set("cycleSeconds", v)}
            />
            <Toggle
              label="Parallax 2nd line"
              checked={s.parallax}
              onChange={(v) => set("parallax", v)}
            />
            {s.parallax && (
              <>
                <Slider
                  label="Parallax offset"
                  unit="%"
                  min={10}
                  max={80}
                  value={s.parallaxOffset}
                  onChange={(v) => set("parallaxOffset", v)}
                />
                <Slider
                  label="Amplitude · line 2"
                  unit="px"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={s.amplitude2}
                  onChange={(v) => set("amplitude2", v)}
                />
                <Slider
                  label="Wavelength · line 2"
                  unit="px"
                  min={24}
                  max={160}
                  step={2}
                  value={s.wavelength2}
                  onChange={(v) => set("wavelength2", v)}
                />
                <Slider
                  label="Phase · line 2"
                  unit="%"
                  min={0}
                  max={100}
                  step={1}
                  value={s.phase2}
                  onChange={(v) => set("phase2", v)}
                />
              </>
            )}
            <Slider
              label="Vertical bob"
              unit="px"
              min={0}
              max={8}
              step={0.5}
              value={s.bobAmplitude}
              onChange={(v) => set("bobAmplitude", v)}
            />
          </div>

          <hr style={{ borderColor: "var(--u-hairline)" }} />

          <div className="space-y-4">
            <p
              className="font-mono text-xs uppercase tracking-wider"
              style={{ color: "var(--u-ink-muted)" }}
            >
              Foam field
            </p>
            <Slider
              label="Row gap"
              unit="px"
              min={14}
              max={48}
              value={s.rowGap}
              onChange={(v) => set("rowGap", v)}
            />
            <Slider
              label="Field intensity"
              min={0.05}
              max={1}
              step={0.05}
              value={s.fieldIntensity}
              onChange={(v) => set("fieldIntensity", v)}
            />
            <Toggle
              label="Apply field to page bg"
              checked={s.applyToBackground}
              onChange={(v) => set("applyToBackground", v)}
            />
          </div>
        </aside>

        {/* Previews */}
        <div className="space-y-10">
          {/* Drifting line */}
          <section className="read-veil">
            <h2
              className="font-mono text-xs uppercase tracking-wider"
              style={{ color: "var(--u-ink-muted)" }}
            >
              Drifting line
            </h2>

            <p
              className="mt-6 font-mono text-[0.65rem] uppercase tracking-wider"
              style={{ color: "var(--u-ink-muted)" }}
            >
              Current (baseline)
            </p>
            <div
              className="relative mt-2 w-full max-w-md"
              style={{ height: BASELINE_LINE.height }}
            >
              <div
                className="wl-anim"
                style={driftLayer(
                  baselineLineUrl,
                  BASELINE_LINE.width,
                  BASELINE_LINE.height,
                  lineColor,
                  1,
                  14,
                )}
              />
            </div>

            <p
              className="mt-8 font-mono text-[0.65rem] uppercase tracking-wider"
              style={{ color: "var(--u-accent)" }}
            >
              Tuned
            </p>
            <div
              className="wl-anim mt-2 w-full max-w-md"
              style={
                {
                  "--wl-bob": `${s.bobAmplitude}px`,
                  animation:
                    s.bobAmplitude > 0
                      ? "wl-bob 4.5s ease-in-out infinite"
                      : undefined,
                } as CSSVars
              }
            >
              <div
                className="relative w-full"
                style={{ height: tuned.lineHeight }}
              >
                <div
                  className="wl-anim"
                  style={driftLayer(
                    tuned.lineUrl,
                    s.wavelength,
                    tuned.lineHeight,
                    lineColor,
                    s.lineOpacity,
                    s.cycleSeconds,
                  )}
                />
                {s.parallax && (
                  <div
                    className="wl-anim"
                    style={driftLayer(
                      tuned.line2Url,
                      s.wavelength2,
                      tuned.lineHeight,
                      lineColor,
                      s.lineOpacity * 0.5,
                      parallaxCycle,
                      // Phase as a fraction of the cycle: drift covers one
                      // wavelength2 per cycle, so N% delay shifts crests by N%.
                      `-${((s.phase2 / 100) * parallaxCycle).toFixed(3)}s`,
                    )}
                  />
                )}
              </div>
            </div>

            <p
              className="mt-8 text-base"
              style={{ color: "var(--u-ink-muted)" }}
            >
              The tuned line sits where it would in a masthead (≈16–28rem wide).
              Narrow the browser or watch the crests travel to gauge the motion.
            </p>
          </section>

          {/* Foam field */}
          <section className="read-veil">
            <h2
              className="font-mono text-xs uppercase tracking-wider"
              style={{ color: "var(--u-ink-muted)" }}
            >
              Foam-field background
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <p
                  className="font-mono text-[0.65rem] uppercase tracking-wider"
                  style={{ color: "var(--u-ink-muted)" }}
                >
                  Current (baseline)
                </p>
                <div
                  className="frost-panel relative mt-2 h-64 overflow-hidden"
                  style={{ borderRadius: 12 }}
                >
                  <div
                    style={fieldLayer(
                      baselineFieldUrl,
                      BASELINE_FIELD.width,
                      BASELINE_FIELD.height,
                      lineColor,
                      0.5,
                    )}
                  />
                </div>
              </div>
              <div>
                <p
                  className="font-mono text-[0.65rem] uppercase tracking-wider"
                  style={{ color: "var(--u-accent)" }}
                >
                  Tuned
                </p>
                <div
                  className="frost-panel relative mt-2 h-64 overflow-hidden"
                  style={{ borderRadius: 12 }}
                >
                  <div
                    style={fieldLayer(
                      tuned.fieldUrl,
                      s.wavelength,
                      s.rowGap,
                      lineColor,
                      s.fieldIntensity,
                    )}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Optional: see the tuned field as the actual page background */}
      {s.applyToBackground && (
        <div
          aria-hidden="true"
          style={{
            ...fieldLayer(
              tuned.fieldUrl,
              s.wavelength,
              s.rowGap,
              lineColor,
              s.fieldIntensity,
            ),
            position: "fixed",
            zIndex: -1,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
