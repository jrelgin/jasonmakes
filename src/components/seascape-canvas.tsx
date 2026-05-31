"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ControlSidebar } from "@/components/control-sidebar";
import type { ThemeKey } from "@/components/theme-switcher";
import { HOKUSAI, TWILIGHT } from "@/engine/palette";
import { renderScene } from "@/engine/renderer";
import { createScene, resizeScene, updateScene } from "@/engine/scene";
import { createSeaPatternCache } from "@/engine/sea";
import { createGlitchState, loadTentaclesImage } from "@/engine/tentacles";
import type {
  GlitchParams,
  Palette,
  SceneState,
  SkyMode,
  SunAnimationParams,
} from "@/engine/types";

type ThemePreference = "auto" | ThemeKey;

const THEME_STORAGE_KEY = "jasonmakes:home-theme";
const MAX_CANVAS_DPR = 2;
const IS_DEV = process.env.NODE_ENV === "development";

const THEME_PALETTES: Record<ThemeKey, Palette> = {
  hokusai: HOKUSAI,
  twilight: TWILIGHT,
};

const PRODUCTION_SETTINGS: Record<
  ThemeKey,
  {
    waveScale: number;
    sunAnimations: SunAnimationParams;
    glitchParams: GlitchParams;
  }
> = {
  hokusai: {
    waveScale: 1,
    sunAnimations: {
      pulsingGlow: {
        enabled: true,
        speed: 0.7,
        intensity: 0.95,
      },
      radiatingRings: {
        enabled: true,
        speed: 1.8,
        intensity: 0.85,
      },
      rotation: {
        enabled: false,
        speed: 0.1,
      },
      shimmer: {
        enabled: true,
        intensity: 1,
      },
    },
    glitchParams: {
      burstBase: 0.15,
      burstThreshold: 0.35,
      displacement: 60,
      chromaticOffset: 30,
      scanLines: 0.65,
      blockCount: 14,
      alienColors: 0.5,
      bleedTears: 0.5,
      skyStatic: 0.5,
      edgeFringe: 0.5,
    },
  },
  twilight: {
    waveScale: 1,
    sunAnimations: {
      pulsingGlow: {
        enabled: false,
        speed: 0.5,
        intensity: 0.5,
      },
      radiatingRings: {
        enabled: false,
        speed: 0.3,
        intensity: 0.5,
      },
      rotation: {
        enabled: false,
        speed: 0.5,
      },
      shimmer: {
        enabled: false,
        intensity: 0.5,
      },
    },
    glitchParams: {
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
    },
  },
};

function getCanvasDpr(): number {
  return Math.min(window.devicePixelRatio || 1, MAX_CANVAS_DPR);
}

function skyModeFromTheme(key: ThemeKey): SkyMode {
  return key === "twilight" ? "night" : "day";
}

function getSystemTheme(): ThemeKey {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "twilight";
  }

  return "hokusai";
}

function resolveTheme(preference: ThemePreference): ThemeKey {
  return preference === "auto" ? getSystemTheme() : preference;
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "auto" || value === "hokusai" || value === "twilight";
}

export function SeascapeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sceneRef = useRef<SceneState | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const paletteRef = useRef<Palette>(HOKUSAI);
  const waveScaleRef = useRef<number>(PRODUCTION_SETTINGS.hokusai.waveScale);
  const sunAnimationsRef = useRef<SunAnimationParams>(
    PRODUCTION_SETTINGS.hokusai.sunAnimations,
  );
  const skyModeRef = useRef<SkyMode>("day");
  const tentaclesImgRef = useRef<HTMLImageElement | null>(null);
  const glitchParamsRef = useRef<GlitchParams>(
    PRODUCTION_SETTINGS.hokusai.glitchParams,
  );
  const [themePreference, setThemePreference] =
    useState<ThemePreference>("auto");
  const [activeTheme, setActiveTheme] = useState<ThemeKey>("hokusai");
  const [waveScale, setWaveScale] = useState(
    PRODUCTION_SETTINGS.hokusai.waveScale,
  );
  const [sunAnimations, setSunAnimations] = useState<SunAnimationParams>(
    PRODUCTION_SETTINGS.hokusai.sunAnimations,
  );
  const [glitchParams, setGlitchParams] = useState<GlitchParams>(
    PRODUCTION_SETTINGS.hokusai.glitchParams,
  );

  const attachTentacleGlitch = useCallback(() => {
    const scene = sceneRef.current;
    const img = tentaclesImgRef.current;
    if (!scene) return;

    if (!img || scene.config.skyMode !== "night") {
      scene.tentacleGlitch = null;
      return;
    }

    const { width, height } = scene.config.dimensions;
    const horizonBaseY = scene.config.horizonRatio * height;
    scene.tentacleGlitch = createGlitchState(img, width, height, horizonBaseY);
    scene.tentacleGlitch.params = glitchParamsRef.current;
  }, []);

  const preserveSunAnimations = useCallback(() => {
    if (sceneRef.current?.sunOverlayConfig) {
      sceneRef.current.sunOverlayConfig.animations = sunAnimationsRef.current;
    }
  }, []);

  const applyTheme = useCallback(
    (key: ThemeKey, keepSeed = true) => {
      const settings = PRODUCTION_SETTINGS[key];
      const palette = THEME_PALETTES[key];
      paletteRef.current = palette;
      skyModeRef.current = skyModeFromTheme(key);
      waveScaleRef.current = settings.waveScale;
      sunAnimationsRef.current = settings.sunAnimations;
      glitchParamsRef.current = settings.glitchParams;
      setActiveTheme(key);
      setWaveScale(settings.waveScale);
      setSunAnimations(settings.sunAnimations);
      setGlitchParams(settings.glitchParams);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const seed = keepSeed ? sceneRef.current?.config.seed : undefined;
      sceneRef.current = createScene(
        { width: rect.width, height: rect.height },
        seed,
        palette,
        settings.waveScale,
        skyModeRef.current,
        getCanvasDpr(),
      );
      preserveSunAnimations();
      attachTentacleGlitch();
    },
    [attachTentacleGlitch, preserveSunAnimations],
  );

  const initScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const dpr = getCanvasDpr();

    const nextWidth = Math.round(width * dpr);
    const nextHeight = Math.round(height * dpr);
    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    }

    const ctx =
      ctxRef.current ??
      canvas.getContext("2d", {
        alpha: false,
        willReadFrequently: true,
      });
    if (!ctx) return;
    ctxRef.current = ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (sceneRef.current) {
      sceneRef.current.config.renderScale = dpr;
      sceneRef.current = resizeScene(sceneRef.current, { width, height });
    } else {
      sceneRef.current = createScene(
        { width, height },
        undefined,
        paletteRef.current,
        waveScaleRef.current,
        skyModeRef.current,
        dpr,
      );
    }
    preserveSunAnimations();
    attachTentacleGlitch();
  }, [attachTentacleGlitch, preserveSunAnimations]);

  const handleThemePreferenceChange = useCallback(
    (preference: ThemePreference) => {
      setThemePreference(preference);
      window.localStorage.setItem(THEME_STORAGE_KEY, preference);
      applyTheme(resolveTheme(preference));
    },
    [applyTheme],
  );

  const handleThemeChange = useCallback(
    (_palette: Palette, key: ThemeKey) => {
      handleThemePreferenceChange(key);
    },
    [handleThemePreferenceChange],
  );

  const handleWaveScaleChange = useCallback((value: number) => {
    waveScaleRef.current = value;
    setWaveScale(value);
    if (sceneRef.current) {
      sceneRef.current.config.waveScale = value;
      const { dimensions, horizonRatio, palette } = sceneRef.current.config;
      const horizonBaseY = horizonRatio * dimensions.height;
      sceneRef.current.seaPatternCache = createSeaPatternCache(
        dimensions,
        horizonBaseY,
        palette,
        value,
        sceneRef.current.config.renderScale,
      );
    }
  }, []);

  const handleSunAnimationChange = useCallback((params: SunAnimationParams) => {
    sunAnimationsRef.current = params;
    setSunAnimations(params);
    if (sceneRef.current?.sunOverlayConfig) {
      sceneRef.current.sunOverlayConfig.animations = params;
    }
  }, []);

  const handleGlitchParamChange = useCallback((params: GlitchParams) => {
    glitchParamsRef.current = params;
    setGlitchParams(params);
    if (sceneRef.current?.tentacleGlitch) {
      sceneRef.current.tentacleGlitch.params = params;
    }
  }, []);

  useEffect(() => {
    loadTentaclesImage().then((img) => {
      tentaclesImgRef.current = img;
      attachTentacleGlitch();
    });
  }, [attachTentacleGlitch]);

  useEffect(() => {
    const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
    const nextPreference = isThemePreference(storedPreference)
      ? storedPreference
      : "auto";
    setThemePreference(nextPreference);
    applyTheme(resolveTheme(nextPreference), false);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      const storedThemePreference =
        window.localStorage.getItem(THEME_STORAGE_KEY);
      if (storedThemePreference && storedThemePreference !== "auto") return;
      applyTheme(getSystemTheme());
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [applyTheme]);

  useEffect(() => {
    initScene();

    const handleResize = () => {
      initScene();
    };

    window.addEventListener("resize", handleResize);

    const frameInterval = 1000 / 30;

    const animate = (timestamp: number) => {
      if (document.hidden) {
        lastTimeRef.current = timestamp;
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      if (
        lastTimeRef.current &&
        timestamp - lastTimeRef.current < frameInterval
      ) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const canvas = canvasRef.current;
      const scene = sceneRef.current;
      if (!canvas || !scene) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const ctx = ctxRef.current;
      if (!ctx) return;

      const deltaTime = lastTimeRef.current
        ? Math.min((timestamp - lastTimeRef.current) / 1000, 0.05)
        : 0.016;
      lastTimeRef.current = timestamp;

      updateScene(scene, deltaTime);

      const dpr = getCanvasDpr();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderScene(ctx, scene);

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [initScene]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-label="Animated ukiyo-e seascape"
        className="block h-full w-full cursor-default"
      />
      <HomeThemeToggle
        activeTheme={activeTheme}
        preference={themePreference}
        onPreferenceChange={handleThemePreferenceChange}
      />
      {IS_DEV && (
        <ControlSidebar
          activeTheme={activeTheme}
          onThemeChange={handleThemeChange}
          waveScale={waveScale}
          onWaveScaleChange={handleWaveScaleChange}
          sunAnimations={sunAnimations}
          onSunAnimationChange={handleSunAnimationChange}
          glitchParams={glitchParams}
          onGlitchParamChange={handleGlitchParamChange}
        />
      )}
    </>
  );
}

function HomeThemeToggle({
  activeTheme,
  preference,
  onPreferenceChange,
}: {
  activeTheme: ThemeKey;
  preference: ThemePreference;
  onPreferenceChange: (preference: ThemePreference) => void;
}) {
  const options: Array<{ value: ThemePreference; label: string }> = [
    { value: "auto", label: "Auto" },
    { value: "hokusai", label: "Day" },
    { value: "twilight", label: "Night" },
  ];

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex rounded border border-white/20 bg-slate-950/70 p-1 text-xs font-semibold uppercase text-white shadow-xl backdrop-blur-md"
      aria-label={`Homepage theme, currently ${activeTheme}`}
    >
      {options.map((option) => {
        const isActive = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onPreferenceChange(option.value)}
            className={`min-h-9 min-w-14 rounded px-3 transition ${
              isActive
                ? "bg-white text-slate-950"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
