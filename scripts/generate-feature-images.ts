/**
 * Generate feature images for content that lacks a manually-set hero image.
 *
 * - Articles and hobby projects without a `heroImage` get a deterministic
 *   generative feature image at `public/images/<collection>/<slug>/generated.webp`.
 * - A fixed pool of fallback tiles for the homepage "Latest Reads" is written to
 *   `public/images/reads/fallback-NN.webp`.
 *
 * Runs headlessly via @napi-rs/canvas, driving the same engine the browser uses.
 * Idempotent (skips existing files) and deterministic (seeded by slug), so it is
 * safe to run on every build (wired as `prebuild`/`predev`). Case studies are
 * intentionally excluded.
 *
 * Run with: pnpm run generate:feature-images  (Node 20+)
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { createCanvas } from "@napi-rs/canvas";

import { listArticles, listHobbyProjects } from "../lib/data/content";
import {
  FEATURE_ART_HEIGHT,
  FEATURE_ART_WIDTH,
  READS_FALLBACK_POOL,
  renderFeatureArt,
  seedFromSlug,
} from "../src/engine/feature-art";
import { setOffscreenCanvasFactory } from "../src/engine/offscreen";

// Engine offscreen caches → @napi-rs/canvas instead of the browser DOM.
setOffscreenCanvasFactory(
  (w, h) => createCanvas(w, h) as unknown as HTMLCanvasElement,
);

const READS_W = 600;
const READS_H = 450; // 4:3, matches the Latest Reads thumbnail aspect

function renderToWebp(
  width: number,
  height: number,
  seed: number,
  quality = 90,
): Buffer {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;
  renderFeatureArt(ctx, { width, height, seed });
  return canvas.encodeSync("webp", quality);
}

function writeIfMissing(filePath: string, makeBuffer: () => Buffer): boolean {
  if (existsSync(filePath)) return false;
  mkdirSync(join(filePath, ".."), { recursive: true });
  writeFileSync(filePath, makeBuffer());
  return true;
}

async function main() {
  const root = process.cwd();
  const publicDir = join(root, "public", "images");
  let generated = 0;
  let skipped = 0;

  const collections: Array<{ dir: string; slugs: string[] }> = [
    {
      dir: "articles",
      slugs: (await listArticles())
        .filter((a) => !a.heroImage)
        .map((a) => a.slug),
    },
    {
      dir: "hobby-projects",
      slugs: (await listHobbyProjects())
        .filter((p) => !p.heroImage)
        .map((p) => p.slug),
    },
  ];

  for (const { dir, slugs } of collections) {
    for (const slug of slugs) {
      const out = join(publicDir, dir, slug, "generated.webp");
      const wrote = writeIfMissing(out, () =>
        renderToWebp(FEATURE_ART_WIDTH, FEATURE_ART_HEIGHT, seedFromSlug(slug)),
      );
      if (wrote) {
        generated++;
        console.log(`generated ${dir}/${slug}/generated.webp`);
      } else {
        skipped++;
      }
    }
  }

  // Latest Reads fallback tile pool.
  for (let i = 0; i < READS_FALLBACK_POOL; i++) {
    const name = `fallback-${String(i).padStart(2, "0")}.webp`;
    const out = join(publicDir, "reads", name);
    const wrote = writeIfMissing(out, () =>
      renderToWebp(READS_W, READS_H, seedFromSlug(`reads-${i}`)),
    );
    if (wrote) {
      generated++;
      console.log(`generated reads/${name}`);
    } else {
      skipped++;
    }
  }

  console.log(`feature-images: ${generated} generated, ${skipped} up-to-date`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
