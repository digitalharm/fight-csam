/**
 * Tool integration: DetectKit-Test (synthetic non-CSAM fixtures).
 *
 * Real package: `packages/detectkit-test` (Python) — generates deterministic
 * synthetic images with engineered hash properties so you can test a detection
 * pipeline in CI without ever touching real CSAM. That is exactly what we do
 * here: the "flagged" test image in this demo is a synthetic checkerboard PNG,
 * NOT real abusive content. Its hash is seeded into the HashStream snapshot so
 * uploading it triggers a (safe, synthetic) positive match.
 *
 * This module hard-codes a tiny deterministic PNG so the demo is self-contained
 * and byte-stable (the hash never drifts). In a fuller setup you would call
 * detectkit-test's `generate_image` at build time to produce the corpus.
 */

// A minimal valid 1x1 PNG, base64. Deterministic bytes → deterministic hash.
// This stands in for "a known-bad image" purely so the match fires; it is an
// ordinary synthetic pixel, nothing more.
const FLAGGED_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

let cached: Uint8Array | null = null;

/** Bytes of the synthetic flagged fixture (deterministic). */
export function knownBadFixtureBytes(): Uint8Array {
  if (cached) return cached;
  const bin = atob(FLAGGED_PNG_B64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  cached = out;
  return out;
}

/** A data: URL so the UI can preview the synthetic fixture. */
export function knownBadFixtureDataUrl(): string {
  return `data:image/png;base64,${FLAGGED_PNG_B64}`;
}
