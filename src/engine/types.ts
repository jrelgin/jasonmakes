/** Shared types for the ukiyo-e seascape engine */

export type SkyMode = "day" | "night" | "dusk";

export interface Vec2 {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Palette {
  sky: string;
  skyHorizon: string;
  seaDeep: string;
  seaMid: string;
  seaLight: string;
  foam: string;
  silhouette: string;
  lineStroke: string;
}

export interface SceneConfig {
  seed: number;
  dimensions: Dimensions;
  horizonRatio: number; // 0-1, where the horizon sits vertically
  waveLineCount: number;
  waveSpeed: number;
  waveScale: number; // uniform multiplier for wave size (1 = default)
  renderScale: number;
  palette: Palette;
  skyMode: SkyMode;
}

export interface EntityConfig {
  id: string;
  type: "kaiju";
  position: Vec2; // normalized 0-1
  scale: number;
  depth: number; // 0 = far, 1 = near
  speed: Vec2;
  silhouettePath: Path2D | null;
}

/** Configuration for a concentric dot ring formation (sun or star) */
export interface DotCircleFormation {
  center: Vec2;
  ringCount: number;
  innerRadius: number;
  ringSpacing: number;
  dotSize: number;
  /** Multiplier applied to per-dot size (default 1). Used to render bolder dots
   *  on small viewports so the sun reads solid instead of washed-out. */
  dotScale?: number;
  colors: string[];
}

/** Configuration for a crescent moon dot formation */
export interface MoonCrescentConfig {
  center: Vec2;
  moonRadius: number;
  outerRadius: number; // = moonRadius for dusk (contained), full-sky distance for night
  shadowCenter: Vec2;
  shadowRadius: number;
  ringCount: number;
  ringSpacing: number;
  dotSize: number;
  colors: string[];
}

/** Configuration for the dot sky layer */
export interface DotSkyConfig {
  sun: DotCircleFormation;
  moon: MoonCrescentConfig;
  backgroundSeed: number;
}

/** Cached offscreen canvas for dot sky */
export interface DotSkyCache {
  canvas: HTMLCanvasElement;
  sunCanvas: HTMLCanvasElement;
  moonCanvas: HTMLCanvasElement;
  sunFormation: DotCircleFormation;
  moonConfig: MoonCrescentConfig;
  dimensions: Dimensions;
  horizonY: number;
  seed: number;
  paletteKey: string;
  skyMode: SkyMode;
}

export interface SunAnimationParams {
  pulsingGlow: { enabled: boolean; speed: number; intensity: number };
  radiatingRings: { enabled: boolean; speed: number; intensity: number };
  rotation: { enabled: boolean; speed: number };
  shimmer: { enabled: boolean; intensity: number };
}

export interface SunOverlayConfig {
  center: Vec2;
  innerRadius: number;
  glowRadius: number;
  horizonY: number;
  animations: SunAnimationParams;
}

export function createDefaultSunAnimationParams(): SunAnimationParams {
  return {
    pulsingGlow: { enabled: false, speed: 0.5, intensity: 0.5 },
    radiatingRings: { enabled: false, speed: 0.3, intensity: 0.5 },
    rotation: { enabled: false, speed: 0.5 },
    shimmer: { enabled: false, intensity: 0.5 },
  };
}

export interface GlitchParams {
  burstBase: number;
  burstThreshold: number;
  displacement: number;
  chromaticOffset: number;
  scanLines: number;
  blockCount: number;
  alienColors: number;
  edgeFringe: number;
}

export function createDefaultGlitchParams(): GlitchParams {
  return {
    burstBase: 0.15,
    burstThreshold: 0.35,
    displacement: 60,
    chromaticOffset: 30,
    scanLines: 0.65,
    blockCount: 14,
    alienColors: 0.5,
    edgeFringe: 0.5,
  };
}

export interface TentacleGlitchState {
  mask: Uint8Array;
  maskWidth: number;
  maskHeight: number;
  x: number;
  y: number;
  blockSeed: number;
  lastBlockUpdate: number;
  params: GlitchParams;
}

export interface SeaPatternCacheRow {
  tile: HTMLCanvasElement;
  centerX: number;
  centerY: number;
  tileWidth: number;
  tileHeight: number;
  radius: number;
  spacing: number;
  waveWidth: number;
  baseY: number;
  depthT: number;
}

export interface SeaPatternCache {
  baseCanvas: HTMLCanvasElement;
  rows: SeaPatternCacheRow[];
}

export interface SceneState {
  time: number;
  config: SceneConfig;
  entities: EntityConfig[];
  horizonPoints: number[];
  dotSkyCache: DotSkyCache | null;
  sunOverlayConfig: SunOverlayConfig | null;
  noiseCache: { noise2D: (x: number, y: number) => number } | null;
  paperTextureCache: HTMLCanvasElement | null;
  vignetteCache: HTMLCanvasElement | null;
  seaPatternCache: SeaPatternCache | null;
  tentacleGlitch: TentacleGlitchState | null;
}
