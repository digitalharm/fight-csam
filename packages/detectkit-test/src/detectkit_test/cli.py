"""Command-line entry point.

    detectkit-test generate       Regenerate the entire fixture corpus from manifest.
    detectkit-test verify         Verify the corpus matches the recorded expected hashes.
    detectkit-test --version      Print version.
"""

from __future__ import annotations

import sys

from . import __version__


def main(argv: list[str] | None = None) -> int:
    """Entry point. Returns an exit code."""
    args = argv if argv is not None else sys.argv[1:]

    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        return 0

    if args[0] in ("-V", "--version"):
        print(f"detectkit-test {__version__}")
        return 0

    if args[0] == "generate":
        print("scaffold: corpus generation not yet implemented", file=sys.stderr)
        return 2

    if args[0] == "verify":
        print("scaffold: corpus verification not yet implemented", file=sys.stderr)
        return 2

    print(f"unknown command: {args[0]}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
