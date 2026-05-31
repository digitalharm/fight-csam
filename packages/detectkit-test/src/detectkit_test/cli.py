"""Command-line interface for detectkit-test.

    detectkit-test generate --pattern <p> --out <path>   Generate one image fixture.
    detectkit-test --version                              Print version.

``generate`` writes a deterministic PNG for one of the supported patterns. Full
corpus generation (driven by a manifest, with recorded expected hashes) is a
later deliverable; this command implements the single-image happy path.
"""

from __future__ import annotations

import argparse
from collections.abc import Sequence
from pathlib import Path

from . import __version__
from .fixtures import SUPPORTED_PATTERNS, generate_image


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="detectkit-test",
        description="Generate deterministic synthetic fixtures for detectkit.",
    )
    parser.add_argument(
        "-V",
        "--version",
        action="version",
        version=f"detectkit-test {__version__}",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    gen = sub.add_parser("generate", help="Generate a single image fixture as PNG.")
    gen.add_argument(
        "--pattern",
        required=True,
        choices=SUPPORTED_PATTERNS,
        help="Fixture pattern to generate.",
    )
    gen.add_argument(
        "--out",
        required=True,
        type=Path,
        help="Path to write the PNG fixture to.",
    )
    gen.add_argument(
        "--identifier",
        default=None,
        help="Stable logical name (defaults to '<pattern>-<width>x<height>').",
    )
    gen.add_argument("--seed", type=int, default=0, help="Deterministic seed.")
    gen.add_argument("--width", type=int, default=512, help="Image width in pixels.")
    gen.add_argument("--height", type=int, default=512, help="Image height in pixels.")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    """Entry point. Returns a process exit code."""
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.command == "generate":
        identifier = args.identifier or f"{args.pattern}-{args.width}x{args.height}"
        image = generate_image(
            identifier=identifier,
            seed=args.seed,
            pattern=args.pattern,
            width=args.width,
            height=args.height,
        )
        out_path = Path(args.out)
        if out_path.parent != Path(""):
            out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_bytes(image.png_bytes)
        print(f"wrote {len(image.png_bytes)} bytes to {out_path} ({image.identifier})")
        return 0

    parser.error(f"unknown command: {args.command!r}")  # raises SystemExit
    return 2  # pragma: no cover


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
