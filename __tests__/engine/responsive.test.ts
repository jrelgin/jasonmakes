import { describe, expect, it } from "vitest";

import { MOBILE_MAX_WIDTH, isMobileWidth } from "../../src/engine/responsive";
import {
  MIN_CREATURE_WIDTH,
  getTentaclesRenderSize,
} from "../../src/engine/tentacles";

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

  it("never renders below the minimum width across breakpoints (issue #87)", () => {
    for (const width of [320, 360, 390, 640, 768, 1280]) {
      expect(getTentaclesRenderSize(width, canvasHeight).width).toBe(
        MIN_CREATURE_WIDTH,
      );
    }
  });

  it("grows past the minimum only on very large viewports", () => {
    const wide = 1920;
    const { width } = getTentaclesRenderSize(wide, canvasHeight);
    expect(width).toBe(Math.round(wide * 0.63));
    expect(width).toBeGreaterThan(MIN_CREATURE_WIDTH);
  });

  it("preserves the source aspect ratio (1024 / 1536)", () => {
    const { width, height } = getTentaclesRenderSize(1920, canvasHeight);
    // Within 1px — width/height are rounded independently from the raw target.
    expect(Math.abs(height - width * (1024 / 1536))).toBeLessThanOrEqual(1);
  });
});
