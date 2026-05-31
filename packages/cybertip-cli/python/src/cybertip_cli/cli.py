"""cybertip — NCMEC CyberTipline CLI.

    cybertip validate <report.json>
    cybertip dry-run  <report.json>                     validate + print wire payload (no network)
    cybertip submit   <report.json> [--mode MODE]       MODE = dry-run (default) | sandbox | production
        --mode sandbox --sandbox-url <URL>              emit the curl-equivalent (no network I/O;
                                                        URL also reads from NCMEC_SANDBOX_URL)
        --sandbox                                       shorthand for --mode sandbox
        --mode production                               BLOCKED — counsel sign-off required
"""

from __future__ import annotations

import json
import sys
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
from .submit import ProductionSubmitBlocked, SubmitMode, submit


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


def _parse_args(args: list[str]) -> tuple[list[str], dict[str, str | bool]]:
    positionals: list[str] = []
    flags: dict[str, str | bool] = {}
    i = 0
    while i < len(args):
        a = args[i]
        if a.startswith("--"):
            key = a[2:]
            if i + 1 < len(args) and not args[i + 1].startswith("--"):
                flags[key] = args[i + 1]
                i += 2
            else:
                flags[key] = True
                i += 1
        else:
            positionals.append(a)
            i += 1
    return positionals, flags


def _resolve_mode(flags: dict[str, str | bool]) -> SubmitMode:
    if flags.get("production"):
        return SubmitMode.PRODUCTION
    if flags.get("sandbox"):
        return SubmitMode.SANDBOX
    m = flags.get("mode")
    if m in ("dry-run", "sandbox", "production"):
        return SubmitMode(m)
    return SubmitMode.DRY_RUN


def main(argv: list[str] | None = None) -> int:
    raw_args = argv if argv is not None else sys.argv[1:]
    positionals, flags = _parse_args(raw_args)

    if not positionals or flags.get("help") or flags.get("h"):
        print(__doc__)
        return 0
    if flags.get("version") or flags.get("V"):
        print(f"cybertip-cli {__version__}")
        return 0

    if len(positionals) < 2:
        print(f"{positionals[0]}: report path required", file=sys.stderr)
        return 2

    cmd, path = positionals[0], positionals[1]

    if cmd == "validate":
        report = _load_report(path)
        errors = validate_report(report)
        if not errors:
            print("OK — report shape is valid")
            return 0
        for err in errors:
            print(f"ERROR: {err}", file=sys.stderr)
        return 1

    if cmd in ("dry-run", "submit"):
        mode = SubmitMode.DRY_RUN if cmd == "dry-run" else _resolve_mode(flags)
        sandbox_url = flags.get("sandbox-url")
        sandbox_url = sandbox_url if isinstance(sandbox_url, str) else None

        report = _load_report(path)
        try:
            result = submit(report, mode, sandbox_url)
        except ProductionSubmitBlocked as exc:
            print(f"submit: {exc}", file=sys.stderr)
            return 2

        for line in result.log_lines:
            print(line, file=sys.stderr)
        if result.curl_preview:
            print("# SIMULATED — no request was sent. Run this yourself with a real ESP credential:")
            print(result.curl_preview)
        else:
            print(
                json.dumps(
                    {
                        "ok": result.ok,
                        "mode": result.mode.value,
                        "errors": result.errors,
                        "wire_payload": result.wire_payload,
                    },
                    indent=2,
                    default=str,
                )
            )
        return 0 if result.ok else 1

    print(f"unknown command: {cmd}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
