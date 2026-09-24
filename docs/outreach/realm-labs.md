# Realm Labs (OmniGuard): research + integration plan

> Research snapshot: 2026-09-24. Realm Labs' own site (`realmlabs.ai`) was not reachable from the research
> sandbox, so every claim below is sourced from third-party coverage (RSAC 2026 Innovation Sandbox profiles,
> investor pages, search snippets of realmlabs.ai). **Verify against the live site before any outreach or
> public claim.** Items marked _unverified_ could not be confirmed from a primary source.

## 1. Who they are

| Fact | Detail | Source |
|---|---|---|
| Company | Realm Labs, Sunnyvale CA, founded 2023 | RSAC 2026 sandbox profiles (Zeltser, Security Boulevard, NSFOCUS) |
| Founder / CEO | Saurabh Shintre — previously led AI-security research at Symantec and Splunk | same |
| Stage | RSAC 2026 Innovation Sandbox finalist; $5M from Crosspoint Capital Partners announced at RSAC 2026 | same; First Rays VC portfolio page |
| Named customer | Anthropic is cited as an early customer | Zeltser profile |
| Products | **OmniGuard** (AI firewall), **Prism** (LLM "internal observability"), **DataRealm** (data governance / DLP for AI) | same |

**What OmniGuard is** (their AI firewall, the product relevant to us):

- Blocks harmful content, jailbreaks and prompt injection on both **inputs and outputs**.
- **Multimodal**: text, audio, image, video; claims detection of both real and AI-generated harmful images/video.
- **50+ languages**; 20–100 ms latency for text, sub-100 ms for audio; streaming and non-streaming.
- **Deployment**: on-prem / in-VPC via Docker, NVIDIA Triton, or custom ML infra on AWS, GCP, Azure, Oracle;
  positioned as dropping into "AI applications, agentic frameworks and AI gateways" without app changes.
- **Policy model**: "define, enforce and adapt AI policies across models and applications" (their words). The
  exact policy/taxonomy surface is _unverified_.
- Differentiator (Prism, not OmniGuard): inspects attention patterns, chain-of-thought and token probabilities
  inside the model at inference time.

**What we could NOT find** (treat as gaps, not negatives):

- No public API reference, SDK, package, or GitHub org. Access appears to be sales-led.
- No CSAM-, NCMEC-, minor-safety- or hash-matching-specific claims anywhere in their published material.
  Their harm coverage is general "harmful content".
- Pricing. Assume enterprise contract.

**Name collision warning.** The arXiv paper "OMNIGUARD: An Efficient Approach for AI Safety Moderation Across
Languages and Modalities" (2505.23856, code at `github.com/vsahil/OmniGuard`) and a second "OmniGuard" omni-modal
guardrail paper (2512.02306) are **unrelated academic projects** by other authors. Do not cite either as Realm's
technology, and do not describe Realm's product using their numbers. A GitHub repo claiming OmniGuard implements
the "YouthSafe" taxonomy is also a third-party hobby project, not Realm Labs.

## 2. Where they fit FightCSAM

OmniGuard is an **enforcement choke point**, the same architectural slot as Guardrails AI (harness) and
OpenGuardrails (proxy gateway) in our directory, but multimodal, vendor-supported and self-hostable. It is
**not** a CSAM detector: it ships no hash matching, no known-material lists, no CyberTipline path, and no
published minor-safety taxonomy. So the relationship is complementary, not competitive:

| FightCSAM tool | Role next to OmniGuard | Direction |
|---|---|---|
| **promptshield** | The narrow CSAM-intent prompt gate (minor-indicator × sexual-context conjunction, evasion-aware) that a general firewall does not specialize in. Runs *as a policy inside* OmniGuard, or as a sidecar OmniGuard calls before the model. | We plug into them. |
| **csam-shield** | Orchestrates detectors. OmniGuard's image/video "harmful" verdict becomes one **custom detector backend** beside PDQ/hash-list matching and Content Safety API, so a novel-content signal sits next to known-material matching. | We wrap them. |
| **hashkit / hashkit-match** | Known-CSAM matching OmniGuard lacks. If OmniGuard exposes a pre/post-processing hook, hash matching runs there against an operator-supplied list. | They gain a capability. |
| **cybertip-cli / evidencevault** | When an OmniGuard-fronted app trips a CSAM signal, the legally load-bearing next step (preserve, report under 18 U.S.C. § 2258A) is ours. Verdict → evidencevault package → cybertip-cli report. | Downstream of them. |
| **detectkit-test** | Conformance/eval harness. Publish a "does your firewall + our gate catch this synthetic CSAM-intent suite" report, no real material ever. | Shared proof. |

Directory verdict: **use**, paired with promptshield, in "Classifiers & AI-safety models"
(`apps/fightsam-site/ecosystem.projects.json`, slug `realm-labs-omniguard`). The take states plainly that it is
closed/commercial and never replaces dedicated CSAM signals or hash matching.

## 3. Concrete integration designs (buildable without vendor access)

Everything here uses interfaces we already ship, so nothing blocks on Realm's SDK; once we have API access the
HTTP shape is filled in.

### 3a. csam-shield custom detector wrapping OmniGuard (Node)

`packages/csam-shield/node/src/detectors/custom.ts` already accepts any `scan(content, requestId)` returning
`{ matched, confidence?, reasoning? }`. A first adapter is a ~40-line file:

```ts
import type { CustomConfig } from "@digitalharm/csam-shield";

export function omniGuardDetector(opts: { endpoint: string; apiKey: string; threshold?: number }): CustomConfig {
  const threshold = opts.threshold ?? 0.8;
  return {
    displayName: "realm-omniguard",
    scan: async (content, requestId) => {
      if (content.kind !== "image-bytes" && content.kind !== "video-bytes") {
        return { matched: false, reasoning: "omniguard: stream inputs not supported by this adapter yet" };
      }
      // Wire shape is a placeholder until Realm's API reference is in hand.
      const res = await fetch(`${opts.endpoint}/v1/scan`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${opts.apiKey}`,
          "content-type": content.contentType,
          "x-request-id": requestId,
        },
        body: content.data, // Scannable image-bytes / video-bytes; csam-shield never logs content
      });
      const verdict = (await res.json()) as { score: number; category?: string };
      return {
        matched: verdict.score >= threshold,
        confidence: verdict.score,
        reasoning: verdict.category ? `omniguard:${verdict.category}` : undefined,
      };
    },
  };
}
```

Registered as `{ detector: "custom", ...omniGuardDetector(cfg) }` next to a PDQ list detector. csam-shield's
timeout/retry/error containment applies unchanged. Promote to a first-class `realm` detector (like
`photodna.ts`, `cloudflare.ts`) only once the wire protocol is verified.

### 3b. promptshield as an OmniGuard policy / pre-model hook (Python)

`promptshield.adapters.vllm.vllm_guard()` already returns an async `prompt -> refusal | None` callable. The same
shape serves any gateway hook OmniGuard exposes:

```python
from promptshield.adapters.vllm import vllm_guard
guard = vllm_guard()  # CSAM-intent only; allow/block/review with calibrated score

async def omniguard_pre_request(prompt: str) -> str | None:
    return await guard(prompt)  # None = let OmniGuard's own policies continue
```

If OmniGuard supports custom policy plugins, the promptshield FastAPI sidecar (Docker) is the zero-code path:
OmniGuard calls the sidecar, sidecar returns `{verdict, score, matched_signals, policy_version}`.

### 3c. Report path

`csam-shield` verdict (`matched: true` from any detector) → `evidencevault` sealed package →
`cybertip-cli` submission. This is the piece no AI firewall vendor ships and the reason a T&S buyer running
OmniGuard still needs FightCSAM. Document it as the "OmniGuard + FightCSAM reference stack" once 3a/3b run
against a real endpoint.

## 4. Outreach (governed by the anti-spam protocol in `docs/gtm/ecosystem-outreach-tracker.md`)

Realm is a **vendor, not an OSS repo**, so the "merged PR first" channel does not exist. This is a
design-partner conversation, which is allowed under Tier 1 only when we lead with value and never the word
"partner" without written sign-off.

- **Gate**: after `v0.1` publish makes `install → quickstart` resolve from a clean machine (protocol §1). Do
  not send before.
- **Channel**: founder / BD email or LinkedIn (Saurabh Shintre). One contact, logged in the gitignored ledger.
- **Value led with**: (1) directory listing already live; (2) a working 3a adapter and 3b hook we can demo with
  synthetic fixtures; (3) the reporting path their customers lack.
- **Asks, in order**: did we describe OmniGuard correctly → API access for a reference integration → a joint
  "OmniGuard + FightCSAM" integration note on both sites. No logo or quote without written sign-off.
- **Never say**: "compliant", "certified", "beats X". Say "helps you take defensible, documented steps; consult
  counsel".

### Draft opener

> Subject: OmniGuard in the FightCSAM ecosystem directory — did we describe it correctly?
>
> Hello Saurabh,
>
> I maintain FightCSAM (fightcsam.org), an Apache-2.0 toolkit for CSAM detection, reporting and prevention:
> conformance-tested PDQ/TMK hashing, a CSAM-intent prompt gate, a CyberTipline reporting CLI, and an
> orchestration layer that wraps third-party detectors.
>
> We list OmniGuard in our ecosystem directory as the multimodal enforcement layer a narrow CSAM-intent gate
> plugs into (fightcsam.org/docs/ecosystem/classifiers). Two things would help: could you check we characterized
> OmniGuard accurately, and would a reference integration be useful to your customers? Concretely, promptshield
> running as a pre-model policy inside OmniGuard, and csam-shield wrapping OmniGuard's image/video verdict as a
> detector beside known-material hash matching, so a firewall trip can flow into the evidence-preservation and
> NCMEC reporting path that no AI firewall ships today. Everything on our side is open source and runs on
> synthetic fixtures only.
>
> No ask beyond a correction and a yes/no on whether an API reference could be shared for that work.
>
> Thanks,
> [name]

## 5. Sources

- https://www.realmlabs.ai/ (unreachable from sandbox; primary source to verify against)
- https://www.realmlabs.ai/product-realm-omniguard and https://www.realmlabs.ai/platform (search snippets only)
- https://zeltser.com/media/rsac-2026-sandbox/realm-labs
- https://securityboulevard.com/2026/03/rsac-innovation-sandbox-2026-realm-labs/
- https://nsfocusglobal.com/rsac-innovation-sandbox-2026-realm-labs/
- https://www.firstraysvc.com/portfolio-companies/realmlabs
- https://www.crunchbase.com/organization/realm-labs-832e
- Unrelated name collisions: https://arxiv.org/abs/2505.23856 (vsahil/OmniGuard), https://arxiv.org/abs/2512.02306
