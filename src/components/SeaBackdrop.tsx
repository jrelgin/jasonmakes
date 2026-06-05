/**
 * SeaBackdrop — the fixed, static atmosphere behind every inner page in the
 * "Undertow" variation: a deep-sea gradient, a faint field of ukiyo-e foam
 * lines (masked to fade top and bottom), and two distant swells along the
 * bottom edge. Purely decorative and motionless — the only motion lives in
 * the masthead's drifting wave.
 */
export default function SeaBackdrop() {
  return (
    <div className="sea-backdrop" aria-hidden="true">
      <svg className="sea-backdrop__field" width="100%" height="100%">
        <title>Field of foam lines</title>
        <defs>
          <pattern
            id="undertow-foam"
            width="140"
            height="26"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 13 C 14 13 21 5 35 5 S 56 13 70 13 S 91 21 105 21 S 126 21 140 13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#undertow-foam)" />
      </svg>
      <svg
        className="sea-backdrop__swell"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <title>Distant swells</title>
        <path
          d="M0 130 C 240 70 480 70 720 130 S 1200 190 1440 130 L1440 320 L0 320 Z"
          fill="var(--u-swell-1)"
        />
        <path
          d="M0 190 C 300 130 560 230 820 190 S 1240 130 1440 190 L1440 320 L0 320 Z"
          fill="var(--u-swell-2)"
        />
      </svg>
    </div>
  );
}
