export const revalidate = 3600; // 1 hour (matches cron frequency)

import { kv } from "#lib/kv";

export default async function AboutBlurb() {
  let blurb: string | null = null;

  try {
    blurb = await kv.get<string>("blurb");
  } catch (error) {
    console.error("Failed to fetch blurb from KV:", error);
  }

  return (
    <figure className="about-blurb frost-panel p-6 md:p-8">
      <p className="font-[family-name:var(--font-instrument-serif)] text-2xl italic leading-relaxed text-[var(--u-ink-strong)] md:text-3xl">
        {blurb ?? "Loading..."}
      </p>
      <figcaption className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--u-accent)]">
        Today, in brief
      </figcaption>
    </figure>
  );
}
