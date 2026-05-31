/**
 * Tool integration: PromptShield (AI-prompt CSAM-intent screening).
 *
 * Real package: `packages/promptshield` (Python) — a two-stage cascade whose
 * Stage 1 is a deterministic pattern matcher enforcing the **conjunction
 * principle**: a prompt is only blocked when BOTH a minor-indicator AND a
 * sexual-context signal are present; either alone is benign. This is a faithful
 * TS port of that Stage 1 (same principle, NFKC normalization, thresholds
 * block_at=0.75 / review_at=0.5). Production runs the real Python package
 * (which adds the Stage 2 baseline) as a serverless function at this seam.
 *
 * **No abusive content in this file.** Rules are documented by category and
 * intent, never by reproducing attack prompts.
 */

export type Verdict = "allow" | "review" | "block";

export interface Classification {
  verdict: Verdict;
  score: number;
  /** Human-readable, content-free reasoning. */
  reasoning: string;
}

const BLOCK_AT = 0.75;
const REVIEW_AT = 0.5;

// Minor-indicator signals (age tokens, child nouns, school context, euphemisms).
const MINOR = [
  /\b(?:[1-9]|1[0-7])\s*(?:yo|y\/o|years?\s*old|yr)\b/i,
  /\b(?:child|children|kid|kids|toddler|infant|baby|minor|minors|preteen|pre-?teen|tween)\b/i,
  /\b(?:elementary|kindergarten|preschool|daycare|schoolgirl|schoolboy|underage|under-?age)\b/i,
  /\b(?:loli(?:con)?|shota(?:con)?|jail\s?bait)\b/i,
];

// Sexual-context signals.
const SEXUAL = [
  /\b(?:nude|naked|nudity|porn|pornographic|sexual|erotic|explicit|nsfw)\b/i,
  /\b(?:sex|intercourse|penetration|orgasm|masturbat\w*|fellatio|genital\w*)\b/i,
  /\b(?:lingerie|undressed|topless|provocative|seductive|suggestive)\b/i,
];

// Obfuscation / jailbreak phrasing — raises suspicion, never blocks alone.
const OBFUSCATION = /\b(?:uncensored|no\s*filter|jailbreak|ignore (?:the )?(?:rules|policy|filter))\b/i;

function normalize(prompt: string): string {
  // NFKC folds homoglyphs / full-width forms; strip combining marks; collapse
  // whitespace; light leetspeak so '3rotic' → 'erotic'.
  const nfkc = prompt.normalize("NFKC").toLowerCase();
  const noMarks = nfkc.replace(/[̀-ͯ]/g, "");
  const collapsed = noMarks.replace(/\s+/g, " ").trim();
  return collapsed.replace(/[013457]/g, (d) => ({ "0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t" })[d] ?? d);
}

export function classifyPrompt(prompt: string): Classification {
  const norm = normalize(prompt);
  const hasMinor = MINOR.some((re) => re.test(norm));
  const hasSexual = SEXUAL.some((re) => re.test(norm));
  const hasObfuscation = OBFUSCATION.test(norm);

  // The conjunction principle: only the co-occurrence trips the gate.
  if (hasMinor && hasSexual) {
    return {
      verdict: "block",
      score: 0.95,
      reasoning: "Conjunction matched: a minor-indicator and a sexual-context signal co-occur. No image generated; no compute spent.",
    };
  }

  // Single-category or obfuscation only → low score, but obfuscation nudges
  // an otherwise-single-signal prompt into the review band.
  let score = 0;
  if (hasMinor) score += 0.3;
  if (hasSexual) score += 0.3;
  if (hasObfuscation) score += 0.2;

  if (score >= BLOCK_AT) return { verdict: "block", score, reasoning: "High combined signal." };
  if (score >= REVIEW_AT)
    return { verdict: "review", score, reasoning: "Single strong signal plus obfuscation — held for human review." };
  return { verdict: "allow", score, reasoning: hasMinor || hasSexual ? "Only one category present; benign by the conjunction principle." : "No signals matched." };
}
