export const revalidate = 3600; // 1 hour (matches cron frequency)

import { kv } from "#lib/kv";

export default async function AboutBlurb() {
  try {
    const blurb = await kv.get<string>("blurb");

    return (
      <div className="about-blurb my-6">
        <p className="prose max-w-xl text-xl italic leading-relaxed text-gray-900 dark:text-gray-100">
          {blurb ?? "Loading..."}
        </p>
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch blurb from KV:", error);
    return (
      <div className="about-blurb my-6">
        <p className="prose max-w-xl text-xl italic leading-relaxed text-gray-900 dark:text-gray-100">
          Loading...
        </p>
      </div>
    );
  }
}
