import { createNoise2D, createNoise3D } from "simplex-noise";

/**
 * Seeded pseudo-random number generator (mulberry32)
 */
export function createSeededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create noise functions from a seed
 */
export function createNoiseGenerators(seed: number) {
  const rng = createSeededRandom(seed);
  const noise2D = createNoise2D(rng);
  const noise3D = createNoise3D(rng);
  return { noise2D, noise3D, rng };
}
