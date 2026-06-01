export function getCanvas2DContext(
  canvas: HTMLCanvasElement,
): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("2D canvas context is unavailable");
  }

  return context;
}
