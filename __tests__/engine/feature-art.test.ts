import { createCanvas } from "@napi-rs/canvas";
import { describe, expect, it } from "vitest";

import { renderFeatureArt, seedFromSlug } from "../../src/engine/feature-art";

const W = 320;
const H = 180;

function pixels(seed: number): Buffer {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;
  renderFeatureArt(ctx, { width: W, height: H, seed });
  return Buffer.from(ctx.getImageData(0, 0, W, H).data);
}

describe("feature-art", () => {
  it("seedFromSlug is deterministic and slug-sensitive", () => {
    expect(seedFromSlug("hello-world")).toBe(seedFromSlug("hello-world"));
    expect(seedFromSlug("alpha")).not.toBe(seedFromSlug("beta"));
  });

  it("renders byte-identical output for the same seed", () => {
    const seed = seedFromSlug(
      "i-built-the-perfect-automated-planner-i-hate-it",
    );
    expect(pixels(seed).equals(pixels(seed))).toBe(true);
  });

  it("renders different output for different seeds", () => {
    expect(
      pixels(seedFromSlug("alpha")).equals(pixels(seedFromSlug("beta"))),
    ).toBe(false);
  });
});
