// Generates the Ecosystem directory pages from ecosystem.projects.json.
// Re-run after editing the dataset:  node scripts/gen-ecosystem.mjs
import fs from 'node:fs';
import path from 'node:path';

const APP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DATA = path.join(APP, 'ecosystem.projects.json');
const OUT = path.join(APP, 'content', 'docs', 'ecosystem');

const TOOLS = new Set([
  'hashkit', 'hashkit-match', 'detectkit-test', 'csam-shield', 'promptshield',
  'hashstream', 'trainguard', 'cybertip-cli', 'evidencevault', 'c2pa-lite', 'safemod',
]);

const V = {
  'use': { label: 'Use', order: 0, blurb: 'recommend integrating alongside FightSAM' },
  'learn-from': { label: 'Learn from', order: 1, blurb: 'a leader or alternative on an axis we also build' },
  'reference': { label: 'Reference', order: 2, blurb: 'a dataset, benchmark, or knowledge resource' },
  'out-of-scope': { label: 'Out of scope', order: 3, blurb: 'an adjacent problem FightSAM deliberately does not address' },
};

// category label -> [filename, intro]
const CATS = [
  ['Perceptual hashing & matching', 'perceptual-hashing', 'Image and video perceptual hashing and matching — the axis hashkit, hashkit-match, and csam-shield build on. Meta’s PDQ / TMK / vPDQ are upstream of our hashing and our conformance source; we never claim to beat them.'],
  ['Classifiers & AI-safety models', 'classifiers', 'ML classifiers and LLM guardrails. FightSAM ships no general model — csam-shield is built to wrap the best of these as swappable detector backends, and promptshield focuses narrowly on CSAM-generation intent.'],
  ['Rules, decisioning & clustering', 'rules-decisioning', 'Rules engines and decisioning. FightSAM does not build a rules engine — we ship engines that feed yours. ROOST Osprey is the one we recommend and target with an adapter.'],
  ['Infrastructure, queues & review', 'infrastructure-review', 'Queues, abuse-management plumbing, and moderator review surfaces to depend on rather than rebuild.'],
  ['Red-teaming & evaluation', 'red-teaming', 'Adversarial testing harnesses. We recommend pairing promptshield with one of these, and plan to contribute the CSAM-intent probes the generalist harnesses deliberately omit.'],
  ['Privacy & user-safety', 'privacy-user-safety', 'PII detection and end-user / community-governance tooling. We wrap Presidio for PII in trainguard; most user-safety tools sit adjacent to a CSAM-detection pipeline.'],
  ['Investigation & signal-sharing', 'investigation', 'Threat-signal sharing and investigation tooling. Meta ThreatExchange / python-threatexchange set the bar for hashstream; disinformation and platform-observability work is deliberately out of our scope.'],
  ['Decentralized & Fediverse', 'decentralized-fediverse', 'AT-Protocol and Fediverse moderation — FightSAM’s #1 target. Our planned Bluesky adapter fills the perceptual-hash gap in hepa and emits to Ozone.'],
  ['Datasets & benchmarks', 'datasets', 'Training and evaluation datasets. We anchor promptshield’s evaluation to NVIDIA Aegis 2.0 and borrow Tattle / Uli annotation methodology; the rest are listed for reference.'],
];

const esc = (s) => String(s ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
const escName = (s) => esc(s).replace(/[[\]]/g, '');
const yamlStr = (s) => '"' + String(s ?? '').replace(/"/g, "'").replace(/\s+/g, ' ').trim() + '"';

const all = JSON.parse(fs.readFileSync(DATA, 'utf8'));
fs.mkdirSync(OUT, { recursive: true });

const ATTR = '_Project descriptions are adapted from [awesome-safety-tools](https://github.com/roostorg/awesome-safety-tools) (maintained by [ROOST](https://roost.tools)); the verdicts and analysis are ours. Snapshot: June 2026 — a point-in-time view that complements, and does not replace, their living list._';

function entry(e) {
  const rel = TOOLS.has(e.relatedTool) ? ` · pairs with [${e.relatedTool}](/docs/${e.relatedTool})` : '';
  const by = e.by ? ` · by ${esc(e.by)}` : '';
  return [
    `### [${escName(e.name)}](${e.url})`,
    '',
    `**${V[e.verdict]?.label ?? e.verdict}**${by}${rel}`,
    '',
    esc(e.take),
    '',
    `> ${esc(e.blurb)}`,
    '',
  ].join('\n');
}

let pageList = ['index'];
for (const [cat, file, intro] of CATS) {
  const items = all.filter((e) => e.category === cat)
    .sort((a, b) => (V[a.verdict].order - V[b.verdict].order) || a.name.localeCompare(b.name));
  if (!items.length) continue;
  pageList.push(file);
  const counts = items.reduce((m, e) => (m[e.verdict] = (m[e.verdict] || 0) + 1, m), {});
  const countLine = Object.keys(V).filter((k) => counts[k]).map((k) => `${counts[k]} ${V[k].label.toLowerCase()}`).join(' · ');
  const body = [
    '---',
    `title: ${yamlStr(cat)}`,
    `description: ${yamlStr(intro.slice(0, 150))}`,
    '---',
    '',
    esc(intro),
    '',
    `**${items.length} projects** — ${countLine}.`,
    '',
    ATTR,
    '',
    ...items.map(entry),
  ].join('\n');
  fs.writeFileSync(path.join(OUT, file + '.mdx'), body + '\n');
}

// index
const total = all.length;
const vc = all.reduce((m, e) => (m[e.verdict] = (m[e.verdict] || 0) + 1, m), {});
const legend = Object.entries(V).map(([k, v]) => `- **${v.label}** — ${v.blurb} (${vc[k] || 0}).`).join('\n');
const catTable = CATS.filter(([c]) => all.some((e) => e.category === c))
  .map(([c, f]) => `| [${escName(c)}](/docs/ecosystem/${f}) | ${all.filter((e) => e.category === c).length} |`).join('\n');
const index = [
  '---',
  'title: Overview',
  'description: "A map of the open-source online-safety landscape, with our verdict on how each project fits a CSAM-safety pipeline."',
  '---',
  '',
  'A developer’s map of the open-source online-safety landscape — not just *what exists*, but **how each project fits (or doesn’t) a CSAM-safety pipeline** built around the FightSAM tools.',
  '',
  `It covers **${total} projects** across ${CATS.length} categories. For each, we give a verdict and a short take. Our own tools live in [Tools](/docs); this section is everything *around* them.`,
  '',
  '## How to read the verdicts',
  '',
  legend,
  '',
  '## Categories',
  '',
  '| Category | Projects |',
  '|---|---|',
  catTable,
  '',
  '## Credit & scope',
  '',
  'This directory is built on **[awesome-safety-tools](https://github.com/roostorg/awesome-safety-tools)**, the community-maintained list curated by [ROOST](https://roost.tools). They maintain the canonical, living catalogue; we add an opinionated layer on top — categorization, a build-vs-wrap verdict, and how each piece slots into a defensible CSAM-detection, reporting, and prevention pipeline.',
  '',
  'Like their list, **inclusion here is not an endorsement** — it is an attempt to map the landscape so a developer can choose well. Verdicts reflect FightSAM’s specific lens (un-gated, self-hostable CSAM safety) and are a **June 2026 snapshot**; projects move fast, so treat this as a starting point and check the source.',
  '',
  ATTR,
  '',
].join('\n');
fs.writeFileSync(path.join(OUT, 'index.mdx'), index + '\n');

// NOTE: no folder meta.json — the ecosystem pages are listed flat in the root
// content/docs/meta.json under a "---Ecosystem---" separator so the section
// renders like the tool sections (separator + flat pages), not a folder.

console.log('generated', pageList.length, 'ecosystem pages:', pageList.join(', '));
