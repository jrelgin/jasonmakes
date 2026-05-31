"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

import type { ThemeKey } from "@/components/theme-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import type { GlitchParams, Palette, SunAnimationParams } from "@/engine/types";

interface ControlSidebarProps {
  activeTheme: ThemeKey;
  onThemeChange: (palette: Palette, key: ThemeKey) => void;
  waveScale: number;
  onWaveScaleChange: (value: number) => void;
  sunAnimations: SunAnimationParams;
  onSunAnimationChange: (params: SunAnimationParams) => void;
  glitchParams: GlitchParams;
  onGlitchParamChange: (params: GlitchParams) => void;
}

const PANEL_WIDTH = 260;

const panelBg = "rgba(13, 21, 32, 0.88)";
const sectionLabel: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "rgba(255, 255, 255, 0.4)",
  marginBottom: 8,
};
const sliderRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 6,
};
const sliderLabelStyle: CSSProperties = {
  fontSize: 11,
  color: "rgba(255, 255, 255, 0.45)",
  width: 54,
  flexShrink: 0,
};
const sliderStyle: CSSProperties = {
  flex: 1,
  height: 28,
  accentColor: "rgba(255, 255, 255, 0.5)",
  cursor: "pointer",
  opacity: 0.8,
};
const toggleRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};
const effectLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "rgba(255, 255, 255, 0.75)",
};
const dividerStyle: CSSProperties = {
  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
  margin: "12px 0",
};

function EffectSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={sliderRowStyle}>
      <span style={sliderLabelStyle}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={sliderStyle}
      />
    </div>
  );
}

function DevSwitch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={(event) => onChange(event.currentTarget.checked)}
      style={{
        width: 38,
        height: 22,
        accentColor: "#d97706",
        cursor: "pointer",
      }}
    />
  );
}

export function ControlSidebar({
  activeTheme,
  onThemeChange,
  waveScale,
  onWaveScaleChange,
  sunAnimations,
  onSunAnimationChange,
  glitchParams,
  onGlitchParamChange,
}: ControlSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function updateAnimation<K extends keyof SunAnimationParams>(
    key: K,
    field: keyof SunAnimationParams[K],
    value: number | boolean,
  ) {
    const updated = {
      ...sunAnimations,
      [key]: {
        ...sunAnimations[key],
        [field]: value,
      },
    };
    onSunAnimationChange(updated);
  }

  function updateGlitch<K extends keyof GlitchParams>(
    key: K,
    value: GlitchParams[K],
  ) {
    onGlitchParamChange({ ...glitchParams, [key]: value });
  }

  const settingsJson = JSON.stringify(
    {
      waveScale,
      sunAnimations,
      ...(activeTheme === "twilight" ? { glitchParams } : {}),
    },
    null,
    2,
  );

  function handleCopy() {
    navigator.clipboard.writeText(settingsJson).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        zIndex: 50,
        display: "flex",
        pointerEvents: "none",
        transition: "transform 0.3s ease-in-out",
        transform: isOpen ? "translateX(0)" : `translateX(${PANEL_WIDTH}px)`,
      }}
    >
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close controls" : "Open controls"}
        style={{
          pointerEvents: "auto",
          alignSelf: "center",
          width: 28,
          height: 56,
          border: "none",
          borderRadius: "8px 0 0 8px",
          background: panelBg,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: "rgba(255, 255, 255, 0.5)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {isOpen ? "\u203A" : "\u2039"}
      </button>

      {/* Sliding panel */}
      <div
        style={{
          pointerEvents: "auto",
          width: PANEL_WIDTH,
          height: "100%",
          background: panelBg,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderLeft: "1px solid rgba(255, 255, 255, 0.06)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {/* Theme section */}
        <div>
          <div style={sectionLabel}>Theme</div>
          <ThemeSwitcher
            activeTheme={activeTheme}
            onThemeChange={onThemeChange}
          />
        </div>

        <div style={dividerStyle} />

        {/* Wave section */}
        <div>
          <div style={sectionLabel}>Waves</div>
          <div style={sliderRowStyle}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              style={{ color: "rgba(255, 255, 255, 0.5)", flexShrink: 0 }}
              aria-hidden="true"
            >
              <path
                d="M1 11C2 9.5 3.5 9 4.5 10C5.5 11 7 10.5 8 9C9 7.5 10.5 8 12 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="range"
              min="0.3"
              max="1.5"
              step="0.05"
              value={waveScale}
              onChange={(e) => onWaveScaleChange(parseFloat(e.target.value))}
              aria-label="Wave scale"
              style={sliderStyle}
            />
            <svg
              width="18"
              height="18"
              viewBox="0 0 16 16"
              fill="none"
              style={{ color: "rgba(255, 255, 255, 0.5)", flexShrink: 0 }}
              aria-hidden="true"
            >
              <path
                d="M1 11C2 9.5 3.5 9 4.5 10C5.5 11 7 10.5 8 9C9 7.5 10.5 8 12 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {activeTheme === "twilight" && (
          <>
            <div style={dividerStyle} />

            {/* Glitch Effects section (twilight mode only) */}
            <div>
              <div style={sectionLabel}>Glitch Effects</div>

              <div style={{ marginBottom: 10 }}>
                <span
                  style={{
                    ...effectLabelStyle,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  Burst Rhythm
                </span>
                <EffectSlider
                  label="Calm"
                  value={glitchParams.burstBase}
                  min={0}
                  max={0.8}
                  step={0.01}
                  onChange={(v) => updateGlitch("burstBase", v)}
                />
                <EffectSlider
                  label="Freq"
                  value={glitchParams.burstThreshold}
                  min={0}
                  max={0.8}
                  step={0.01}
                  onChange={(v) => updateGlitch("burstThreshold", v)}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <span
                  style={{
                    ...effectLabelStyle,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  Distortion
                </span>
                <EffectSlider
                  label="Displace"
                  value={glitchParams.displacement}
                  min={0}
                  max={200}
                  step={1}
                  onChange={(v) => updateGlitch("displacement", v)}
                />
                <EffectSlider
                  label="Chroma"
                  value={glitchParams.chromaticOffset}
                  min={0}
                  max={80}
                  step={1}
                  onChange={(v) => updateGlitch("chromaticOffset", v)}
                />
                <EffectSlider
                  label="Scan"
                  value={glitchParams.scanLines}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => updateGlitch("scanLines", v)}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <span
                  style={{
                    ...effectLabelStyle,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  Corruption
                </span>
                <EffectSlider
                  label="Blocks"
                  value={glitchParams.blockCount}
                  min={0}
                  max={40}
                  step={1}
                  onChange={(v) => updateGlitch("blockCount", v)}
                />
                <EffectSlider
                  label="Colors"
                  value={glitchParams.alienColors}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => updateGlitch("alienColors", v)}
                />
                <EffectSlider
                  label="Tears"
                  value={glitchParams.bleedTears}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => updateGlitch("bleedTears", v)}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <span
                  style={{
                    ...effectLabelStyle,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  Atmosphere
                </span>
                <EffectSlider
                  label="Sky"
                  value={glitchParams.skyStatic}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => updateGlitch("skyStatic", v)}
                />
                <EffectSlider
                  label="Fringe"
                  value={glitchParams.edgeFringe}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => updateGlitch("edgeFringe", v)}
                />
              </div>
            </div>
          </>
        )}

        {activeTheme !== "twilight" && (
          <>
            <div style={dividerStyle} />

            {/* Sun Effects section (hidden in night mode — moon is static) */}
            <div>
              <div style={sectionLabel}>Sun Effects</div>

              {/* Pulsing Glow */}
              <div style={{ marginBottom: 14 }}>
                <div style={toggleRowStyle}>
                  <span style={effectLabelStyle}>Pulsing Glow</span>
                  <DevSwitch
                    label="Toggle pulsing glow"
                    checked={sunAnimations.pulsingGlow.enabled}
                    onChange={(v) =>
                      updateAnimation("pulsingGlow", "enabled", v)
                    }
                  />
                </div>
                {sunAnimations.pulsingGlow.enabled && (
                  <>
                    <EffectSlider
                      label="Speed"
                      value={sunAnimations.pulsingGlow.speed}
                      min={0.1}
                      max={2}
                      step={0.1}
                      onChange={(v) =>
                        updateAnimation("pulsingGlow", "speed", v)
                      }
                    />
                    <EffectSlider
                      label="Intensity"
                      value={sunAnimations.pulsingGlow.intensity}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(v) =>
                        updateAnimation("pulsingGlow", "intensity", v)
                      }
                    />
                  </>
                )}
              </div>

              {/* Radiating Rings */}
              <div style={{ marginBottom: 14 }}>
                <div style={toggleRowStyle}>
                  <span style={effectLabelStyle}>Radiating Rings</span>
                  <DevSwitch
                    label="Toggle radiating rings"
                    checked={sunAnimations.radiatingRings.enabled}
                    onChange={(v) =>
                      updateAnimation("radiatingRings", "enabled", v)
                    }
                  />
                </div>
                {sunAnimations.radiatingRings.enabled && (
                  <>
                    <EffectSlider
                      label="Speed"
                      value={sunAnimations.radiatingRings.speed}
                      min={0.1}
                      max={2}
                      step={0.1}
                      onChange={(v) =>
                        updateAnimation("radiatingRings", "speed", v)
                      }
                    />
                    <EffectSlider
                      label="Intensity"
                      value={sunAnimations.radiatingRings.intensity}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(v) =>
                        updateAnimation("radiatingRings", "intensity", v)
                      }
                    />
                  </>
                )}
              </div>

              {/* Rotation */}
              <div style={{ marginBottom: 14 }}>
                <div style={toggleRowStyle}>
                  <span style={effectLabelStyle}>Rotation</span>
                  <DevSwitch
                    label="Toggle sun rotation"
                    checked={sunAnimations.rotation.enabled}
                    onChange={(v) => updateAnimation("rotation", "enabled", v)}
                  />
                </div>
                {sunAnimations.rotation.enabled && (
                  <EffectSlider
                    label="Speed"
                    value={sunAnimations.rotation.speed}
                    min={0.1}
                    max={2}
                    step={0.1}
                    onChange={(v) => updateAnimation("rotation", "speed", v)}
                  />
                )}
              </div>

              {/* Shimmer */}
              <div style={{ marginBottom: 14 }}>
                <div style={toggleRowStyle}>
                  <span style={effectLabelStyle}>Shimmer</span>
                  <DevSwitch
                    label="Toggle sun shimmer"
                    checked={sunAnimations.shimmer.enabled}
                    onChange={(v) => updateAnimation("shimmer", "enabled", v)}
                  />
                </div>
                {sunAnimations.shimmer.enabled && (
                  <EffectSlider
                    label="Density"
                    value={sunAnimations.shimmer.intensity}
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={(v) => updateAnimation("shimmer", "intensity", v)}
                  />
                )}
              </div>
            </div>
          </>
        )}

        <div style={dividerStyle} />

        {/* Settings Export */}
        <div>
          <div
            style={{
              ...sectionLabel,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Current Settings</span>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: copied
                  ? "rgba(180, 230, 180, 0.9)"
                  : "rgba(255, 255, 255, 0.4)",
                background: "rgba(255, 255, 255, 0.06)",
                border: "none",
                borderRadius: 4,
                padding: "2px 8px",
                cursor: "pointer",
                transition: "color 0.2s",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre
            style={{
              fontSize: 10,
              lineHeight: 1.4,
              color: "rgba(255, 255, 255, 0.5)",
              background: "rgba(0, 0, 0, 0.3)",
              borderRadius: 6,
              padding: "10px 12px",
              margin: 0,
              overflowX: "auto",
              whiteSpace: "pre",
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            }}
          >
            {settingsJson}
          </pre>
        </div>
      </div>
    </div>
  );
}
