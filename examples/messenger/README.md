# SafeMessenger — a CSAM-safe messenger boilerplate

An open-source reference messenger that wires in **all 10
[fight-csam](../../README.md) tools** at their natural integration points.
Fork it as a starting point for a platform that needs CSAM detection, blocking,
reporting, and prevention built in from day one rather than bolted on after an
incident.

> **Live demo:** https://digitalharm-messenger.vercel.app
>
> **It runs with zero external services.** `npm install && npm run dev` — no
> database, no API keys, no sidecars. State is in-memory (resets on restart);
> the seam to swap in Postgres/KV is a single small `Store` interface.

---

## Threat model — read this first

SafeMessenger is a **server-visible-content** messenger, like Discord, Slack, or
Telegram *cloud* chats: the server can see message and image content, so it can
hash and scan it. **It is deliberately NOT end-to-end encrypted.**

This matters, and it's the reason we did **not** fork Signal or Telegram:

- **Signal** is end-to-end encrypted. The server only ever sees ciphertext, and
  you cannot perceptually-hash ciphertext. Adding server-side scanning to an
  E2EE app means either breaking E2EE or moving to **client-side scanning** —
  the approach Apple proposed in 2021 and withdrew after a major backlash, and
  which much of the security community considers a mass-surveillance risk. That
  is a genuinely contested design space and is **out of scope** for this
  boilerplate.
- **Telegram** cloud chats *are* server-visible (scannable), but the server is
  closed-source and the clients are large native apps — there's no open server
  to integrate these tools into or run end-to-end.

So this is a small, honest, purpose-built demo whose threat model is exactly the
one these tools are designed for. If your product is E2EE, these server-side
tools are the wrong layer — start a different conversation about client-side
approaches and their trade-offs.

**Nothing here ships a hash list or real CSAM.** The single "flagged" test image
is a synthetic, non-CSAM fixture (a 1×1 PNG) whose hash is seeded into the demo
hash list purely so you can watch a positive match fire safely.

---

## The 10 tools, and where each one sits

| Tool | Role in this app | Integration seam (`lib/tools/…`) | This demo vs. production |
|---|---|---|---|
| **HashKit** | PDQ-style perceptual hash of every uploaded image | `hashkit.ts` | Deterministic TS digest mirroring `PdqHash`/`hamming`. Prod: the real Rust crate compiled to **WASM** at this exact call site (true perceptual robustness). |
| **hashkit-match** | Hamming match of the hash against the list | `hashkit.ts` (`PdqMatcher`) | Same `query`/threshold contract (default 31). Prod: WASM. |
| **DetectKit-Test** | The synthetic flagged fixture + its seeded hash | `detectkit.ts` | A deterministic synthetic PNG, standing in for the Python generator's corpus. |
| **HashStream** | Serves the versioned hash-list snapshot to match against | `hashstream.ts` | Seeded in-process snapshot mirroring the SDK's `Snapshot`. Prod: point the SDK at the running Go service. |
| **CSAM-Shield** | One call that scans an upload, runs the detector(s), applies the block policy | `shield.ts` (`scanImage`) | Mirrors `createShield` dispatch + `any-match` + **fail-closed**. Prod: `@digitalharm/csam-shield` with more detectors (PhotoDNA, Cloudflare, NCMEC). |
| **PromptShield** | Screens every AI-image prompt before any compute | `promptshield.ts` | Faithful TS port of Stage 1's **conjunction principle** (block needs a minor-indicator **and** a sexual-context signal). Prod: the Python package (adds the Stage 2 baseline) as a serverless fn. |
| **C2PA-Lite** | Signs allowed AI-generated images with provenance | `c2pa.ts` | **Real Ed25519** via `node:crypto`, same canonical-claim scheme as the crate. Prod: the Rust crate (WASM) for byte-identical canonicalization + the `upstream` C2PA JWS. |
| **TrainGuard** | Screens the "export messages for training" path | `trainguard.ts` | Faithful port of `scan_dataset` → signed `ComplianceReport`. Prod: the Python package reading real LAION/WebDataset manifests + HashStream snapshots. |
| **CyberTip CLI** | Files a sandbox NCMEC report whenever an upload is blocked | `cybertip.ts` | Mirrors the three-mode API; uses **sandbox** (build payload + curl-equivalent, **no network**). Production submission stays **blocked** pending counsel. |
| **EvidenceVault** | Tamper-evident custody record for every block | `evidencevault.ts` | Faithful port of the hash-chained custody log + `verify`; stores **hash + metadata, never the bytes**. Prod: the Go service with KMS + retention enforcement. |
| **SafeMod** | (deferred) moderator-wellbeing panel | Moderation tab stub | Deferred by design — GDPR special-category data is out of scope for the portfolio. Shown as a labelled stub. |

"Mirrors / port" means: this demo reimplements the tool's **public contract** in
TypeScript so the whole thing deploys to Vercel as one app with no sidecars. The
integration *seam* is the real one — each `lib/tools/*` file is where you drop in
the published package (or its WASM build / sidecar service) for production. The
two cryptographic claims — C2PA Ed25519 signing and the EvidenceVault custody
hash-chain — are **real**, not simulated.

---

## The flows you can try

1. **Clean upload** (Chat tab): attach any image → it's hashed, matched (no
   hit), and posted with a `scanned` badge.
2. **Blocked upload** (Chat tab → "Try a flagged test image"): posts the
   synthetic fixture → CSAM-Shield matches it → the message is **blocked**, the
   bytes are dropped, an EvidenceVault custody record opens, and a CyberTip
   **sandbox** report is filed. You'll see the curl-equivalent that *would* be
   sent (no real request).
3. **AI prompt screening** (AI Art tab): a benign prompt generates a sticker
   signed with verifiable C2PA provenance. A prompt with a single category
   signal is **allowed** (the conjunction principle); a prompt with both is
   **blocked** before any compute.
4. **Moderation queue** (Moderation tab): every block, its CyberTip ref, and its
   custody record with a live **chain-intact** check. Plus a one-click
   **TrainGuard** screen of the export corpus, producing a signed compliance
   report. The deferred **SafeMod** panel is shown as a stub.

---

## Run it

```bash
cd examples/messenger
npm install
npm run dev      # http://localhost:3000
# or: npm run build && npm run start
```

Optional env (`.env.local`):

```bash
# Where CyberTip sandbox curl-previews point. No default endpoint is real;
# this is operator-supplied. The demo never sends a request regardless.
NCMEC_SANDBOX_URL=https://sandbox.report.example/ncmec
```

## Taking it to production

1. Replace each `lib/tools/*` mirror with the published package or its
   WASM/sidecar deployment (HashKit/hashkit-match/C2PA-Lite → WASM;
   HashStream/EvidenceVault → the Go services; PromptShield/TrainGuard → Python
   serverless functions). The route handlers don't change — only the seam does.
2. Swap the in-memory `lib/store.ts` for a real database adapter.
3. Obtain hash-list access (NCMEC / IWF / Project Arachnid) and load it into
   HashStream. **Never commit a real hash list.**
4. Engage counsel before enabling any CyberTip **production** submission path —
   it stays blocked at the CLI by design until then.

## Safety

- No real CSAM, no real hash lists, no live reporting endpoints.
- Blocked image bytes are never persisted — only a hash and metadata.
- The repository safety guard (`scripts/safety-check.sh`) runs in CI across the
  monorepo and rejects committed hash-list filenames, image binaries outside the
  allowlist, and credentials.

Apache-2.0, like the rest of the portfolio.
