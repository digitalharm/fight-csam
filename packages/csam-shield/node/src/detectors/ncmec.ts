import type { DetectorResult, Scannable } from "../types.js";

export interface NCMECHashConfig {
  /** NCMEC Hash Sharing API endpoint (industry, law enforcement, or NPO). */
  environment: "industry" | "law-enforcement" | "npo";
  /** API credentials. */
  credentials: { username: string; password: string };
  /** Hash types to query against. Defaults to PDQ + MD5. */
  hashTypes?: Array<"md5" | "sha1" | "photodna" | "pdq" | "tmk-pdqf">;
}

/**
 * NCMEC Hash Sharing API detector.
 *
 * Matches caller-supplied hashes against the NCMEC industry hash list
 * (5M+ vetted CSAM hashes). Requires NCMEC ESP credentialing —
 * application-gated through https://www.missingkids.org.
 *
 * Scaffold stage. The wire protocol depends on the credentialed
 * relationship (see docs/sponsorship.md). Until that's in place,
 * this stub validates config and documents the wire-protocol
 * requirements.
 *
 * Note: this detector hashes content locally (via hashkit) and
 * queries NCMEC with the hash — never with the content. The hash
 * list itself is never downloaded to the caller's environment;
 * matching happens server-side.
 */
export async function runNCMECHash(
  config: Record<string, unknown>,
  _content: Scannable,
  _requestId: string,
): Promise<Omit<DetectorResult, "detector" | "durationMs">> {
  const typed = validate(config);
  void typed;
  throw new Error(
    "csam-shield: NCMEC Hash Sharing adapter is a scaffold stub. " +
      "Requires NCMEC ESP credentialing — see " +
      "https://github.com/digitalharm/digitalharm-oss/blob/main/docs/sponsorship.md " +
      "for the credential-brokering work this depends on.",
  );
}

function validate(config: Record<string, unknown>): NCMECHashConfig {
  const env = config.environment;
  if (env !== "industry" && env !== "law-enforcement" && env !== "npo") {
    throw new Error(
      "ncmec-hash config: environment must be 'industry', 'law-enforcement', or 'npo'",
    );
  }
  const creds = config.credentials as { username?: unknown; password?: unknown } | undefined;
  if (
    !creds ||
    typeof creds.username !== "string" ||
    typeof creds.password !== "string"
  ) {
    throw new Error("ncmec-hash config: credentials.{username,password} required");
  }
  return {
    environment: env,
    credentials: { username: creds.username, password: creds.password },
    ...(Array.isArray(config.hashTypes)
      ? { hashTypes: config.hashTypes as NCMECHashConfig["hashTypes"] }
      : {}),
  };
}
