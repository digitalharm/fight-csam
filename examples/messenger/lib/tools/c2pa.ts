/**
 * Tool integration: C2PA-Lite (content provenance for AI-generated media).
 *
 * Real package: `packages/c2pa-lite` (Rust) — at v0.5 it signs a deterministic
 * canonical manifest claim with **Ed25519** (RFC 8032) and verifies it; the
 * full C2PA JWS embedding lands behind its `upstream` feature. This uses the
 * exact same scheme via Node's built-in `crypto` (Ed25519), so the signature
 * here is real and verifiable — production swaps in the Rust crate (WASM) at
 * this seam for byte-identical canonicalization.
 *
 * C2PA is a label, not a defense: adversaries can strip it. Its value is letting
 * a downstream verifier confirm an asset came from a known producer and was
 * AI-generated as claimed. Use alongside (not instead of) hashing + classifiers.
 */

import { generateKeyPairSync, sign as edSign, verify as edVerify, type KeyObject } from "node:crypto";

export interface ManifestClaim {
  claimId: string;
  producer: string;
  aiGenerated: boolean;
  generator?: string;
}

export interface SignedAsset {
  claim: ManifestClaim;
  /** Ed25519 signature over the canonical form, hex. */
  signature: string;
  verified: boolean;
}

// Ephemeral producer key for the demo (one per warm instance). Production loads
// a stable operator key from a KMS.
let keypair: { privateKey: KeyObject; publicKey: KeyObject } | null = null;
function keys() {
  if (!keypair) keypair = generateKeyPairSync("ed25519");
  return keypair;
}

/** Deterministic canonical form used for signing (c2pa-lite `to_canonical`). */
function toCanonical(c: ManifestClaim): string {
  const lines = [
    `claim_id=${c.claimId}`,
    `producer=${c.producer}`,
    `ai_generated=${c.aiGenerated ? "true" : "false"}`,
  ];
  if (c.generator) lines.push(`generator=${c.generator}`);
  return lines.join("\n") + "\n";
}

/** Sign a claim with Ed25519 and confirm the signature verifies. */
export function signClaim(claim: ManifestClaim): SignedAsset {
  const { privateKey, publicKey } = keys();
  const data = Buffer.from(toCanonical(claim), "utf8");
  const sig = edSign(null, data, privateKey);
  const verified = edVerify(null, data, publicKey, sig);
  return { claim, signature: sig.toString("hex"), verified };
}
