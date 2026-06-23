import type { Metadata } from "next";
import WaveLab from "./WaveLab";

export const metadata: Metadata = {
  title: "Wave Variations | Jason Makes",
  description:
    "Scratch page for experimenting with the inner-page wave line and foam-field background.",
  robots: { index: false, follow: false },
};

/**
 * /variations — a temporary, URL-only experimentation page (not linked in the
 * nav) for dialing in a new wave treatment. It deliberately does NOT use
 * PageShell/SeaBackdrop, since the foam-field background itself is one of the
 * things being explored; instead it lays its own theme-token gradient ground so
 * previews sit in the right palette. All the interactive work lives in the
 * client component <WaveLab />. Nothing here touches the live DriftingWave /
 * SeaBackdrop components.
 */
export default function VariationsPage() {
  return (
    <main
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, var(--u-bg-0) 0%, var(--u-bg-1) 55%, var(--u-bg-1) 100%)",
        color: "var(--u-ink)",
      }}
    >
      <WaveLab />
    </main>
  );
}
