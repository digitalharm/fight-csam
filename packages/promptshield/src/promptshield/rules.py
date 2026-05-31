"""Stage 1: deterministic pattern matcher.

The conjunction principle (learned from AI Horde's design): a positive
match requires BOTH a minor-indicator AND a sexual-context signal. Neither
alone trips the gate. This keeps false-positive rates manageable while
catching the obvious cases.

The rule set is intentionally small in the scaffold. Production-quality
lexicons are versioned artifacts pulled from Hugging Face Hub at runtime
(see classifier.py); this file holds the bootstrap rules so the package
is useful without network access.

**No literal abusive content in this file.** Rules are documented by
category and intent, not by reproducing the prompts attackers use.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from typing import Literal

from .types import MatchedSignal


SignalKind = Literal["minor-indicator", "sexual-context", "conjunction-bypass"]


@dataclass(frozen=True, slots=True)
class Rule:
    rule_id: str
    kind: SignalKind
    pattern: re.Pattern[str]
    weight: float


# Word-boundary-aware patterns covering the most common categories.
# Deliberately conservative; expansion happens in versioned lexicon
# artifacts, not by editing this file.
_BOOTSTRAP_RULES: tuple[Rule, ...] = (
    # Minor indicators — explicit age tokens
    Rule(
        rule_id="minor-explicit-age",
        kind="minor-indicator",
        pattern=re.compile(r"\b(?:[1-9]|1[0-7])\s*(?:year|yr|yo|years?)\s*old\b", re.IGNORECASE),
        weight=0.9,
    ),
    Rule(
        rule_id="minor-noun-direct",
        kind="minor-indicator",
        pattern=re.compile(
            r"\b(?:child|children|kid|kids|toddler|infant|baby|babies|"
            r"minor|minors|preteen|preteens|tween|tweens)\b",
            re.IGNORECASE,
        ),
        weight=0.6,
    ),
    Rule(
        rule_id="minor-context",
        kind="minor-indicator",
        pattern=re.compile(
            r"\b(?:elementary|kindergarten|preschool|daycare|nursery)\b",
            re.IGNORECASE,
        ),
        weight=0.5,
    ),
    # Sexual context — broad categories
    Rule(
        rule_id="sexual-explicit-noun",
        kind="sexual-context",
        pattern=re.compile(
            r"\b(?:nude|naked|nudity|porn|pornographic|sexual|erotic|explicit)\b",
            re.IGNORECASE,
        ),
        weight=0.7,
    ),
    Rule(
        rule_id="sexual-act-generic",
        kind="sexual-context",
        pattern=re.compile(
            r"\b(?:sex|intercourse|penetration|orgasm|masturbat\w*)\b",
            re.IGNORECASE,
        ),
        weight=0.8,
    ),
    Rule(
        rule_id="sexual-body-context",
        kind="sexual-context",
        pattern=re.compile(
            r"\b(?:undressed|stripped|disrobed|topless|bottomless|undressing)\b",
            re.IGNORECASE,
        ),
        weight=0.5,
    ),
    # Bypass attempts — negative-prompt stuffing patterns
    Rule(
        rule_id="bypass-negative-adult",
        kind="conjunction-bypass",
        pattern=re.compile(
            r"\b(?:not adult|not mature|youth|youthful|young looking)\b",
            re.IGNORECASE,
        ),
        weight=0.3,
    ),
)


def normalize(prompt: str) -> str:
    """Normalize a prompt for pattern matching.

    - Unicode NFKC compatibility decomposition (collapses homoglyphs,
      full-width forms, ligatures)
    - Strip combining marks
    - Collapse repeated whitespace
    - Lowercase (patterns use case-insensitive flags too, but this
      makes the normalized form predictable for hash-only audit logs)
    - Leetspeak basics: 0→o, 1→l/i, 3→e, 4→a, 5→s, 7→t. Conservative;
      pure-digit tokens (like ages, which we WANT to detect literally)
      are preserved by only substituting when a letter is adjacent.
    """
    decomposed = unicodedata.normalize("NFKC", prompt)
    no_marks = "".join(c for c in decomposed if not unicodedata.combining(c))
    collapsed = re.sub(r"\s+", " ", no_marks).strip().lower()
    return _leet_deobfuscate(collapsed)


_LEET_MAP = str.maketrans({"0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t"})


def _leet_deobfuscate(s: str) -> str:
    # Only substitute leetspeak chars that are adjacent to letters. This
    # preserves pure numeric tokens (like '13 yr old') so the explicit-age
    # rule still fires on them.
    result: list[str] = []
    chars = list(s)
    for i, ch in enumerate(chars):
        if ch not in "013457":
            result.append(ch)
            continue
        prev_is_alpha = i > 0 and chars[i - 1].isalpha()
        next_is_alpha = i + 1 < len(chars) and chars[i + 1].isalpha()
        if prev_is_alpha or next_is_alpha:
            result.append(ch.translate(_LEET_MAP))
        else:
            result.append(ch)
    return "".join(result)


def match_rules(normalized_prompt: str) -> list[MatchedSignal]:
    """Run all rules and return signals that matched."""
    signals: list[MatchedSignal] = []
    for rule in _BOOTSTRAP_RULES:
        if rule.pattern.search(normalized_prompt):
            signals.append(
                MatchedSignal(kind=rule.kind, weight=rule.weight, rule_id=rule.rule_id)
            )
    return signals


def signals_satisfy_conjunction(signals: list[MatchedSignal]) -> bool:
    """The conjunction principle: a positive requires BOTH a minor-indicator
    and a sexual-context signal. Bypass-attempt signals nudge the score but
    don't independently trip the gate.
    """
    kinds = {s.kind for s in signals}
    return "minor-indicator" in kinds and "sexual-context" in kinds


def conjunction_score(signals: list[MatchedSignal]) -> float:
    """Compute a calibrated 0-1 score from the matched signals.

    A simple weighted-sum capped at 1.0. Production deployments should
    use the neural classifier for calibrated scores; this is the
    pattern-matcher baseline.
    """
    if not signals_satisfy_conjunction(signals):
        # No conjunction = no positive, regardless of individual weights.
        return min(0.4, sum(s.weight for s in signals) * 0.3)
    minor_weights = [s.weight for s in signals if s.kind == "minor-indicator"]
    sexual_weights = [s.weight for s in signals if s.kind == "sexual-context"]
    bypass_weights = [s.weight for s in signals if s.kind == "conjunction-bypass"]
    minor_max = max(minor_weights) if minor_weights else 0
    sexual_max = max(sexual_weights) if sexual_weights else 0
    bypass_sum = sum(bypass_weights) * 0.2
    return min(1.0, 0.5 + 0.3 * minor_max + 0.3 * sexual_max + bypass_sum)
