/** Aboriginal dot art colors — used regardless of active theme */

export const DOT_EARTH_TONES = {
  /**
   * Sun concentric ring gradient — 28 colors from white/cream center to near-black-red outer edge.
   * Sampled from the reference aboriginal dot art painting.
   */
  sunRingGradient: [
    "#FFFFF0", // 0  — white core
    "#FFF8C4", // 1  — warm cream
    "#FFF3A0", // 2  — light cream-yellow
    "#FFE566", // 3  — pale yellow
    "#FFD233", // 4  — yellow
    "#F5C833", // 5  — warm yellow
    "#F5B42A", // 6  — golden yellow
    "#EDA020", // 7  — amber-gold
    "#E8941A", // 8  — amber
    "#E08518", // 9  — dark amber
    "#D97215", // 10 — orange-amber
    "#CC6010", // 11 — orange
    "#C04800", // 12 — deep orange
    "#B03A00", // 13 — orange-rust
    "#9C2E00", // 14 — rust
    "#882400", // 15 — dark rust
    "#741C00", // 16 — burnt sienna
    "#601400", // 17 — deep rust
    "#4E1000", // 18 — dark reddish-brown
    "#400D00", // 19
    "#340A00", // 20 — very dark rust
    "#2C0800", // 21 — darkest; outer rings fade out before reaching this
  ] as const,

  /**
   * Moon concentric ring gradient — silver-white core → gold → amber → deep gold.
   * Colors chosen to explain the golden light cast on TWILIGHT night waves.
   */
  moonGoldGradient: [
    "#FFFFFF", //  0 — pure white-silver core
    "#FFF8E8", //  1 — warm white
    "#FFF0D0", //  2 — cream-silver
    "#FFE8B0", //  3 — pale gold
    "#FFDC90", //  4 — light gold
    "#FFD070", //  5 — soft gold
    "#F5C450", //  6 — gold
    "#E8B438", //  7 — rich gold
    "#DCA428", //  8 — warm gold
    "#D09820", //  9 — amber gold (matches twilight foam)
    "#C08818", //  10 — deep gold
    "#B07810", //  11 — dark amber-gold
    "#A06A0A", //  12 — bronze
    "#905C08", //  13 — dark bronze
    "#805008", //  14 — deep bronze
    "#704408", //  15 — very dark bronze
    "#603808", //  16 — darkest bronze
    "#502E06", //  17 — near-black gold
    "#402404", //  18 — darkest; outer rings fade before reaching this
  ] as const,

  /**
   * River blue variants — day sky background dot field.
   */
  backgroundBlue: [
    "#5CA3C1", // primary river blue
    "#6DB5D2", // lighter blue
    "#4D8EAC", // darker blue
    "#74BFDC", // bright blue highlight
    "#5FA8C8", // mid blue
    "#509EBB", // cooler blue
  ] as const,

  /**
   * Dark blue-grey variants — dusk sky background dot field.
   * Matches the near-black Eraser palette aesthetic.
   */
  backgroundDusk: [
    "#2A3040", // primary dark blue-grey
    "#343848", // lighter
    "#202830", // darker
    "#3A4050", // highlight
    "#2E3444", // mid
    "#262C38", // cooler
  ] as const,
} as const;
