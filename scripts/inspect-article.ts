import { createReader } from "@keystatic/core/reader";

import config from "../keystatic.config";

async function run() {
  const reader = createReader(process.cwd(), config);
  const items = await reader.collections.articles.all();
  for (const { slug, entry } of items) {
    console.log("slug:", slug);
    console.log("  typeof entry.slug:", typeof entry.slug);
    console.log("  entry.slug:", entry.slug);
    console.log("  typeof entry.content:", typeof entry.content);
    if (typeof entry.content === "function") {
      const resolved = await entry.content();
      console.log("  resolved content type:", typeof resolved);
      if (typeof resolved === "string") {
        console.log("  preview:", resolved.slice(0, 60));
      }
    }
    console.log("  keys:", Object.keys(entry));
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
