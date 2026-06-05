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
    <figure className="about-blurb border-l-2 border-[var(--accent)] pl-5">
      <p className="text-xl italic leading-relaxed text-[var(--ink-strong)] md:text-2xl">
        {blurb ?? "Loading..."}
      </p>
      <figcaption className="mt-3 font-mono text-[0.68rem] uppercase tracking-wider text-[var(--ink-muted)]">
        Today, in brief
      </figcaption>
    </figure>
  );
}
