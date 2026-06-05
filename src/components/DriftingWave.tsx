/**
 * DriftingWave — the single animated flourish of the "Undertow" variation.
 *
 * A theme-aware foam line that drifts slowly sideways, echoing the homepage's
 * motion in one quiet gesture. Implemented as a CSS-masked element (see
 * `.drift-wave` in pages.css), so it needs no JavaScript and pauses under
 * prefers-reduced-motion.
 */
export default function DriftingWave({ className }: { className?: string }) {
  const classes = className ? `drift-wave ${className}` : "drift-wave";
  return <div className={classes} aria-hidden="true" />;
}
