# SafeMod

> An open-source moderator-wellness layer that wraps any review queue: blur-by-default media, hard exposure caps, and aggregate trauma-symptom reporting.

**Status:** see `STATUS` file. **License:** Apache 2.0. **Recommendation:** `ship-with-caveats`.

## Problem

CSAM and graphic-content moderators develop PTSD at rates comparable to first responders, and multi-million-dollar settlements at Meta ($52M) and ongoing TikTok litigation have turned protective tooling (blur, grayscale, mute, exposure limits, clinical screening) into a de-facto compliance floor. But these protections live only inside the proprietary internal tools of the largest platforms and BPO vendors; smaller platforms, NGOs, and the hotlines/NCMEC-adjacent orgs that review the worst material have no off-the-shelf, self-hostable way to provide them.

## Gap in ecosystem

OSS today covers the two ends of the pipeline but not the human in the middle: there are open classifiers (Hugging Face NSFW models, Meta PDQ) and open review queues (Bluesky Ozone, shug2k/content-review-tool, conversationai-moderator), yet none of them blur media, enforce per-shift exposure caps, rotate cases, or track wellbeing. The protective UI patterns are validated in published Facebook/AAAI research and are standard practice, but exist only as closed internal code or as human-services contracts (Zevo, Cogito, Concentrix). No project packages the wellness layer as adoptable, auditable middleware.

## Architecture

Two deployable units plus a spec. (1) A framework-agnostic embeddable web component, safemod-shroud (TypeScript/Lit, ships as an npm package and a single <script> UMD bundle), that intercepts media rendering in an existing review UI and applies client-side mutation — grayscale, gaussian blur, downscaled thumbnail, and tap/hold click-to-reveal with auto-re-shroud after N seconds — using CSS filters and an OffscreenCanvas so raw pixels are never auto-painted. (2) A sidecar service, safemod-core (Python/FastAPI + Postgres, packaged as a Docker image and Helm chart), exposing a small REST/Webhook API for exposure-event logging, per-shift cap enforcement (return 'rotate' or 'lockout' decisions), weighted case-rotation, and anonymized survey/symptom intake. Wellbeing data is segregated into a separate schema with k-anonymity enforced at query time (aggregates suppressed below a configurable cohort threshold, default k=5) so no individual's symptom scores are ever returned. Identity is delegated to the host platform via OIDC; SafeMod stores only an opaque salted moderator pseudonym. Integration is via thin adapters (Ozone, generic-webhook, content-review-tool) rather than forking any queue. A reference admin dashboard (Next.js) renders only aggregate cohort metrics.

## Existing tooling

Replacing nothing; layering above existing queues and integrating with classifiers. Closed/commercial: Meta, TikTok, and WebPurify build blur/grayscale into proprietary internal tools; Zevo Health, Cogito, and Concentrix sell clinically-led wellbeing programs with closed reporting dashboards (services + SaaS, not deployable code). OSS we build on but which lack any wellness layer: Bluesky Ozone (labeling/queue), shug2k/content-review-tool (Django/Next queue), conversationai-moderator (Jigsaw), and Jeremy Malcolm's Modtools Image. Detection tools SafeMod sits downstream of: Thorn Safer, Hive AI, Cloudflare CSAM Scanning Tool, Project Arachnid Shield, NCMEC hash sharing, and PDQ. The validated UI science exists in Karunakaran & Ramakrishan's Facebook/AAAI-HCOMP work but was never released as a component.

## v0.1 scope

- safemod-shroud web component: grayscale + blur + downscaled-thumbnail rendering with click-to-reveal, configurable auto-re-shroud timeout, and a keyboard-accessible reveal control; drop-in via npm or <script> tag.
- safemod-core sidecar: POST /exposure events, per-moderator per-shift exposure budget (count + cumulative reveal-seconds) with a /check endpoint returning allow / soft-warn / hard-lockout.
- Weighted automated case rotation: re-order or reassign the queue so no moderator gets a run of the most severe category beyond a configurable streak, exposed as a rotation hint the host queue can honor.
- Anonymized weekly wellbeing survey (configurable, ships with a validated short screener such as a PCL-derived item set) with opaque-pseudonym intake and k-anonymity-gated aggregate reporting.
- Admin dashboard showing only cohort-level trends (exposure distribution, cap breaches, survey trajectories); hard block on rendering any single moderator's wellbeing record.
- One reference adapter (Bluesky Ozone) plus a generic webhook adapter, with a documented integration contract.
- Self-host bundle: Docker Compose + Helm chart, OIDC config, and a SECURITY/THREAT-MODEL doc covering the segregated wellbeing schema and pixel-handling guarantees.

## APIs and specs

- Bluesky Ozone moderation service (integration target): https://github.com/bluesky-social/ozone
- shug2k content-review-tool (integration target): https://github.com/shug2k/content-review-tool
- Jigsaw conversationai-moderator (integration target): https://github.com/conversationai/conversationai-moderator
- Meta PDQ / ThreatExchange perceptual hashing (upstream detection): https://github.com/facebook/ThreatExchange
- NCMEC Hash Sharing / CyberTipline (reporting context SafeMod must not interfere with): https://report.cybertip.org and https://www.missingkids.org/theissues/csam
- Project Arachnid Shield API (upstream detection context): https://projectarachnid.ca/en/#shield
- C2PA content provenance spec (optional media-metadata handling): https://c2pa.org/specifications/
- Karunakaran & Ramakrishan, reducing emotional impact of moderation (UI evidence base), AAAI HCOMP: https://cdn.aaai.org/ojs/7461/7461-64-10811-1-2-20200924.pdf

## Funding model

Primary funding is mission-grant rather than license fees: child-safety and digital-rights funders (the End Violence Fund / Safe Online, which already funds Project Arachnid-class work; the Patrick J. McGovern Foundation; Omidyar) underwrite v0.x as public-interest infrastructure. Sustaining revenue from a hosted, audited SafeMod Cloud (the segregated wellbeing-data store as a managed, compliance-documented service) sold to the actual buyer who carries the liability: the Trust & Safety / People-Ops lead or Chief Compliance Officer at mid-size platforms and BPO moderation vendors who need Meta/TikTok-grade protections but cannot build them, and who will pay for SOC 2 + DPA-backed hosting and integration support rather than self-hosting sensitive mental-health data. Apache licensing deliberately invites Zevo/Cogito-type vendors to embed the OSS shroud layer, with paid certification/support as the upsell.

## Risks

The sharpest risk is the wellbeing data itself: aggregated trauma-symptom tracking can be weaponized by employers to manage out 'high-symptom' workers, inverting the tool's purpose — mitigated by k-anonymity, no individual readout, and worker-controlled opt-in, but governance, not code, is the real control and a hostile deployer can ignore it. Exposure caps and rotation can collide with rigid throughput quotas, so the tool risks being adopted as compliance theater while KPIs stay brutal. False sense of safety is real: client-side blur is an affect-reduction aid, not a security boundary, and must never be presented as preventing exposure or as a substitute for clinical care. Jurisdictional landmines: SafeMod must stay strictly upstream of detection/reporting and never touch, store, or hash CSAM itself (handling known CSAM has legal reporting duties under NCMEC/various national laws), and wellbeing data crosses GDPR special-category-health and EU-AI-Act lines. Scope creep toward becoming a full moderation queue or a classifier would dilute the wedge and pull the project into the regulated-detection blast radius it should avoid.

---

See [the full design spec in docs/tools/safemod.md](../../docs/tools/safemod.md) for the
extended workflow-synthesis context. The portfolio overview lives in the
[root README](../../README.md).
