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
            width="106"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0.00 12.00 L2.00 11.11 L4.00 10.24 L6.00 9.39 L8.00 8.58 L10.00 7.81 L12.00 7.10 L14.00 6.47 L16.00 5.91 L18.00 5.43 L20.00 5.05 L22.00 4.77 L24.00 4.58 L26.00 4.50 L28.00 4.53 L30.00 4.66 L32.00 4.90 L34.00 5.23 L36.00 5.66 L38.00 6.18 L40.00 6.78 L42.00 7.45 L44.00 8.19 L46.00 8.98 L48.00 9.81 L50.00 10.67 L52.00 11.56 L54.00 12.44 L56.00 13.33 L58.00 14.19 L60.00 15.02 L62.00 15.81 L64.00 16.55 L66.00 17.22 L68.00 17.82 L70.00 18.34 L72.00 18.77 L74.00 19.10 L76.00 19.34 L78.00 19.47 L80.00 19.50 L82.00 19.42 L84.00 19.23 L86.00 18.95 L88.00 18.57 L90.00 18.09 L92.00 17.53 L94.00 16.90 L96.00 16.19 L98.00 15.42 L100.00 14.61 L102.00 13.76 L104.00 12.89 L106.00 12.00"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
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
