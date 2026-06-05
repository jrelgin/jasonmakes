/**
 * WaveRule — a seamless, theme-aware hairline of ukiyo-e foam crests.
 *
 * A quiet reuse of the homepage's wave language as a static divider. The
 * stroke follows `currentColor` (set to `--wave-stroke` via the `.wave-rule`
 * class), so it adapts to the active Hokusai / Twilight theme. The path is a
 * single 120px period that returns to its baseline, so it tiles cleanly.
 */
export default function WaveRule({ className }: { className?: string }) {
  const classes = className ? `wave-rule ${className}` : "wave-rule";

  return (
    <svg
      className={classes}
      width="100%"
      height="16"
      fill="none"
      role="presentation"
      aria-hidden="true"
    >
      <title>Decorative wave</title>
      <defs>
        <pattern
          id="wave-rule-foam"
          width="120"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 8 C 12 8 18 4 30 4 S 48 4 60 8 S 78 12 90 12 S 108 12 120 8"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </pattern>
      </defs>
      <rect width="100%" height="16" fill="url(#wave-rule-foam)" />
    </svg>
  );
}
