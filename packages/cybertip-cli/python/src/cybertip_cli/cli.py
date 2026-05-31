"""cybertip — NCMEC CyberTipline CLI.

    cybertip validate <report.json>
    cybertip dry-run  <report.json>
    cybertip submit   <report.json>     BLOCKED in scaffold (counsel review required)
"""

from __future__ import annotations

import json
import sys
from dataclasses import asdict
from pathlib import Path

from . import __version__
from .model import (
    CyberTipReport,
    IncidentDetails,
    ReportingPerson,
    SuspectInfo,
    VictimInfo,
    validate_report,
)
from .submit import submit_dry_run


def _load_report(path: str) -> CyberTipReport:
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    rp = raw["reporting_person"]
    inc = raw["incident"]
    suspect_raw = raw.get("suspect")
    victim_raw = raw.get("victim")
    return CyberTipReport(
        client_reference=raw["client_reference"],
        reporting_person=ReportingPerson(
            org_name=rp["org_name"],
            esp_id=rp["esp_id"],
            contact_email=rp["contact_email"],
            contact_name=rp.get("contact_name"),
        ),
        incident=IncidentDetails(
            incident_type=inc["incident_type"],
            incident_datetime_iso=inc["incident_datetime_iso"],
            description=inc["description"],
            severity=inc["severity"],
            evidence_refs=list(inc["evidence_refs"]),
        ),
        suspect=SuspectInfo(**suspect_raw) if suspect_raw else None,
        victim=VictimInfo(**victim_raw) if victim_raw else None,
        operator_metadata=raw.get("operator_metadata", {}),
    )


def main(argv: list[str] | None = None) -> int:
    args = argv if argv is not None else sys.argv[1:]

    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    if args[0] in ("-V", "--version"):
        print(f"cybertip-cli {__version__}")
        return 0

    if len(args) < 2:
        print(f"{args[0]}: report path required", file=sys.stderr)
        return 2

    cmd, path = args[0], args[1]

    if cmd == "validate":
        report = _load_report(path)
        errors = validate_report(report)
        if not errors:
            print("OK — report shape is valid")
            return 0
        for err in errors:
            print(f"ERROR: {err}", file=sys.stderr)
        return 1

    if cmd == "dry-run":
        report = _load_report(path)
        result = submit_dry_run(report)
        print(json.dumps(asdict(result), indent=2, default=str))
        return 0 if result.ok else 1

    if cmd == "submit":
        print(
            "submit: BLOCKED in scaffold. The production submission path is gated on outside-counsel review of\n"
            "  packages/cybertip-cli/docs/counsel-scope-brief.md\n"
            "and an active NCMEC ESP credential. See\n"
            "  https://github.com/digitalharm/digitalharm-oss/blob/main/docs/roadmap.md",
            file=sys.stderr,
        )
        return 2

    print(f"unknown command: {cmd}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
