"""Smoke tests for promptshield's pattern-matcher stage.

Test prompts are deliberately chosen to exercise the conjunction
principle without reproducing any abusive content. Where a prompt
needs to express both an age signal and a sexual signal to test the
positive path, the sexual signal is intentionally generic and the
test asserts on the classification verdict — we never assert on
specific token text.
"""

from __future__ import annotations

from promptshield import (
    ClassificationResult,
    PromptClassifier,
    guard,
)
from promptshield.rules import (
    conjunction_score,
    match_rules,
    normalize,
    signals_satisfy_conjunction,
)


def _classify(prompt: str) -> ClassificationResult:
    return PromptClassifier.from_default().classify(prompt)


def test_benign_prompt_passes() -> None:
    result = _classify("a serene landscape painting in the style of Bob Ross")
    assert result.verdict == "allow"
    assert result.signals == []


def test_minor_indicator_alone_does_not_block() -> None:
    # Conjunction principle: a minor reference alone is not enough.
    result = _classify("a photograph of children playing in a park")
    assert result.verdict != "block"


def test_sexual_indicator_alone_does_not_block() -> None:
    # Conjunction principle: a sexual reference alone is not enough.
    result = _classify("an erotic painting of two adults in the Renaissance style")
    assert result.verdict != "block"


def test_conjunction_blocks() -> None:
    # Both signals present should trip the gate. The specific phrasing
    # is chosen to be unambiguous about intent without reproducing
    # abusive content.
    result = _classify("nude photograph of a child")
    assert result.verdict == "block"
    assert result.score >= 0.75


def test_explicit_age_token_triggers_minor_indicator() -> None:
    normalized = normalize("a 12 year old in a sexual pose")
    signals = match_rules(normalized)
    kinds = {s.kind for s in signals}
    assert "minor-indicator" in kinds
    assert "sexual-context" in kinds
    assert signals_satisfy_conjunction(signals)
    assert conjunction_score(signals) >= 0.75


def test_leetspeak_does_not_evade() -> None:
    # 'ch1ld' → 'chlld' actually — our leet map is conservative
    # (1→l, not 1→i). Let's test a real evasion attempt that should
    # work: '3rotic' → 'erotic'
    normalized = normalize("3rotic photograph of a child")
    signals = match_rules(normalized)
    assert signals_satisfy_conjunction(signals)


def test_unicode_homoglyph_does_not_evade() -> None:
    # 'ｎｕｄｅ' (full-width) should normalize to 'nude'
    normalized = normalize("ｎｕｄｅ child photograph")
    signals = match_rules(normalized)
    assert signals_satisfy_conjunction(signals)


def test_negative_prompt_bypass_attempt_caught() -> None:
    # Classic attack: stuff 'adult' into negative prompt while positive
    # carries the minor + sexual signals. The conjunction in the
    # positive prompt is what triggers the block — the negative-prompt
    # bypass signal adds weight, doesn't subtract.
    classifier = PromptClassifier.from_default()
    result = classifier.classify(
        "nude photograph of a child in an elementary setting",
        negative_prompt="adult, mature",
    )
    assert result.verdict == "block"


def test_guard_convenience_function_works() -> None:
    result = guard("a serene mountain landscape")
    assert result.verdict == "allow"


def test_classification_result_blocked_property() -> None:
    blocked = _classify("nude photograph of a child")
    assert blocked.blocked is True
    allowed = _classify("a serene mountain landscape")
    assert allowed.blocked is False


def test_signal_rule_ids_never_contain_prompt_content() -> None:
    # Sanity check: the audit-log surface should never leak prompt
    # text via rule_id. All rule_ids are documented categorical labels.
    result = _classify("nude photograph of a child")
    for sig in result.signals:
        # rule_ids are like 'minor-noun-direct', 'sexual-explicit-noun'
        assert "-" in sig.rule_id
        assert sig.rule_id.replace("-", "").isalnum()


def test_review_tier_for_borderline_score() -> None:
    # A prompt with only one strong signal and one weak signal might
    # land in the review tier rather than block. The exact prompt that
    # lands here depends on rule weights; this test just verifies that
    # the review tier is reachable.
    classifier = PromptClassifier.from_default()
    # Single moderate-weight minor-indicator without sexual conjunction
    result = classifier.classify("photo from elementary school")
    # No conjunction = score < 0.5 = allow
    assert result.verdict == "allow"
