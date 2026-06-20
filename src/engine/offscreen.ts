/**
 * Offscreen canvas factory.
 *
 * The engine pre-renders several layers (paper texture, vignette, sky/sun/moon,
 * sea base + wave tiles) onto offscreen canvases. In the browser these come from
 * `document.createElement("canvas")`. To run the exact same engine headlessly in
 * Node (to generate static feature images), callers swap the factory for one
 * backed by `@napi-rs/canvas` via {@link setOffscreenCanvasFactory}.
 *
 * The browser default is byte-for-byte equivalent to the previous inline
 * `document.createElement("canvas")` + width/height assignment, so the engine's
 * visual output (and the glitch fidelity lock) is unchanged.
 */
export type OffscreenCanvasFactory = (
  width: number,
  height: number,
) => HTMLCanvasElement;

const browserFactory: OffscreenCanvasFactory = (width, height) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

let factory: OffscreenCanvasFactory = browserFactory;

/** Override the factory (e.g. Node generators backed by @napi-rs/canvas). */
export function setOffscreenCanvasFactory(next: OffscreenCanvasFactory): void {
  factory = next;
}

/** Create an offscreen canvas sized `width`×`height` using the active factory. */
export function createOffscreenCanvas(
  width: number,
  height: number,
): HTMLCanvasElement {
  return factory(width, height);
}
