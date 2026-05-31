"""CLI entry point.

    trainguard scan <jsonl-path> [--operator NAME]   Scan a JSONL dataset
    trainguard --version                              Print version
    trainguard --help                                 Show this help
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import sys

from . import __version__
from .pipeline import InMemoryHashListProvider, scan_dataset
from .readers import JsonlReader


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="trainguard",
        description="Pre-flight CSAM screening for AI training datasets.",
    )
    parser.add_argument("--version", action="version", version=f"trainguard {__version__}")
    sub = parser.add_subparsers(dest="cmd")

    scan = sub.add_parser("scan", help="Scan a dataset")
    scan.add_argument("dataset", help="Path to a JSONL dataset")
    scan.add_argument(
        "--operator",
        default="cli",
        help="Operator name for the chain-of-custody",
    )
    scan.add_argument(
        "--dataset-id",
        default=None,
        help="Dataset identifier (defaults to the file path)",
    )

    args = parser.parse_args(argv)

    if args.cmd == "scan":
        # Scaffold: no providers configured. Caller would normally pass
        # a hashstream URL; this stub returns a clean report.
        provider = InMemoryHashListProvider(
            source="local",
            snapshot_id="empty-scaffold",
            hashes=set(),
        )
        timestamp = _dt.datetime.now(_dt.timezone.utc).isoformat()
        report, matches = scan_dataset(
            dataset_id=args.dataset_id or args.dataset,
            entries=JsonlReader(args.dataset),
            providers=[provider],
            scanned_at_iso=timestamp,
            operator=args.operator,
        )
        print(
            json.dumps(
                {
                    "report_id": report.report_id,
                    "dataset_id": report.dataset_id,
                    "dataset_size": report.dataset_size,
                    "matches_total": report.matches_total,
                    "sources_consulted": report.sources_consulted,
                    "scanned_at_iso": report.scanned_at_iso,
                    "matches": [
                        {
                            "entry_id": m.entry_id,
                            "matched_against": m.matched_against,
                        }
                        for m in matches
                    ],
                },
                indent=2,
            )
        )
        return 1 if report.matches_total > 0 else 0

    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
