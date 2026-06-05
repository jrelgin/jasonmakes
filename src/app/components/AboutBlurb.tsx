export const revalidate = 3600; // 1 hour (matches cron frequency)

import { kv } from "#lib/kv";

export default async function AboutBlurb() {
  try {
    const blurb = await kv.get<string>("blurb");

    return (
      <div className="about-blurb">
        <p>{blurb ?? "Loading..."}</p>
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch blurb from KV:", error);
    return (
      <div className="about-blurb">
        <p>Loading...</p>
      </div>
    );
  }
}
