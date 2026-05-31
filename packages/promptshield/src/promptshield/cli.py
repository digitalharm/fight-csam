"""CLI entry point.

    promptshield "<prompt>"             Classify a single prompt; exit 1 on block
    promptshield --batch < prompts.txt  Classify prompts from stdin (one per line)
    promptshield --version              Print version
"""

from __future__ import annotations

import json
import sys

from . import __version__
from .classifier import PromptClassifier


def main(argv: list[str] | None = None) -> int:
    args = argv if argv is not None else sys.argv[1:]

    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        return 0

    if args[0] in ("-V", "--version"):
        print(f"promptshield {__version__}")
        return 0

    classifier = PromptClassifier.from_default()

    if args[0] == "--batch":
        any_blocked = False
        for line in sys.stdin:
            prompt = line.rstrip("\n")
            if not prompt:
                continue
            result = classifier.classify(prompt)
            print(
                json.dumps(
                    {
                        "verdict": result.verdict,
                        "score": round(result.score, 3),
                        "source": result.source,
                        "signals": [
                            {"kind": s.kind, "rule_id": s.rule_id, "weight": s.weight}
                            for s in result.signals
                        ],
                    }
                )
            )
            if result.blocked:
                any_blocked = True
        return 1 if any_blocked else 0

    prompt = args[0]
    result = classifier.classify(prompt)
    print(
        json.dumps(
            {
                "verdict": result.verdict,
                "score": round(result.score, 3),
                "source": result.source,
                "signals": [
                    {"kind": s.kind, "rule_id": s.rule_id, "weight": s.weight}
                    for s in result.signals
                ],
            },
            indent=2,
        )
    )
    return 1 if result.blocked else 0


if __name__ == "__main__":
    sys.exit(main())
