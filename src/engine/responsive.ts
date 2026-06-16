/**
 * Shared responsive sizing for the seascape engine.
 *
 * The canvas engine is otherwise resolution-independent: it scales purely
 * proportionally to the canvas size. These helpers introduce a single mobile
 * breakpoint so a few compositional elements (the daytime sun, the night sea
 * monster) can be sized for small viewports without drifting on desktop.
 *
 * All engine entry points receive LOGICAL CSS pixels (canvas getBoundingClientRect
 * width/height); device pixel ratio is applied separately as renderScale. So the
 * width passed here is logical px and compares cleanly against the breakpoint.
 */

/** Logical-px width at/below which the seascape uses mobile sizing.
 *  Matches the theme `sm` breakpoint (--screen-sm: 640px in src/styles/theme.css). */
export const MOBILE_MAX_WIDTH = 640;

/** True when the logical canvas width is a mobile viewport. */
export function isMobileWidth(logicalWidth: number): boolean {
  return logicalWidth < MOBILE_MAX_WIDTH;
}
