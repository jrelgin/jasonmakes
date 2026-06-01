import { Palette } from "./types";

/** Classic ukiyo-e indigo palette inspired by Hokusai's Great Wave */
export const HOKUSAI: Palette = {
  sky: "#1B2D4A",
  skyHorizon: "#2A4060",
  seaDeep: "#12203A",
  seaMid: "#1A3358",
  seaLight: "#264D75",
  foam: "#EDE2CA",
  silhouette: "#080D16",
  lineStroke: "#0C1828",
};

/** High-contrast dark palette inspired by The Eraser */
export const ERASER: Palette = {
  sky: "#101018",
  skyHorizon: "#0E1424",
  seaDeep: "#040610",
  seaMid: "#080C16",
  seaLight: "#10141E",
  foam: "#C0C0D4",
  silhouette: "#000000",
  lineStroke: "#5565A0",
};

/** Warm twilight palette */
export const TWILIGHT: Palette = {
  sky: "#1A0E22",
  skyHorizon: "#301628",
  seaDeep: "#08101C",
  seaMid: "#102034",
  seaLight: "#182C48",
  foam: "#D0985C",
  silhouette: "#040810",
  lineStroke: "#142040",
};

export const PALETTES = [HOKUSAI, ERASER, TWILIGHT];
