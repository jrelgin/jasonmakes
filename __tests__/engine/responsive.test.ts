import { describe, expect, it } from "vitest";

import { MOBILE_MAX_WIDTH, isMobileWidth } from "../../src/engine/responsive";
import { getTentaclesRenderSize } from "../../src/engine/tentacles";

describe("isMobileWidth", () => {
  it("treats widths below the breakpoint as mobile", () => {
    expect(isMobileWidth(320)).toBe(true);
    expect(isMobileWidth(390)).toBe(true);
    expect(isMobileWidth(MOBILE_MAX_WIDTH - 1)).toBe(true);
  });

  it("treats the breakpoint and above as desktop", () => {
    expect(isMobileWidth(MOBILE_MAX_WIDTH)).toBe(false);
    expect(isMobileWidth(768)).toBe(false);
    expect(isMobileWidth(1280)).toBe(false);
  });
});

describe("getTentaclesRenderSize", () => {
  const canvasHeight = 844;

  it("oversizes the creature past the viewport on mobile (issue #87)", () => {
    const mobileWidth = 390;
    const { width } = getTentaclesRenderSize(mobileWidth, canvasHeight);
    expect(width).toBe(Math.round(mobileWidth * 1.1));
    // Wider than the viewport so it bleeds off-canvas when right-anchored.
    expect(width).toBeGreaterThan(mobileWidth);
  });

  it("leaves desktop sizing unchanged at 0.63 of the canvas width", () => {
    const desktopWidth = 1280;
    const { width } = getTentaclesRenderSize(desktopWidth, canvasHeight);
    expect(width).toBe(Math.round(desktopWidth * 0.63));
    expect(width).toBeLessThan(desktopWidth);
  });

  it("preserves the source aspect ratio (1024 / 1536)", () => {
    const { width, height } = getTentaclesRenderSize(1280, canvasHeight);
    // Within 1px — width/height are rounded independently from the raw target.
    expect(Math.abs(height - width * (1024 / 1536))).toBeLessThanOrEqual(1);
  });
});
