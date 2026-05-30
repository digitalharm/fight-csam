#!/usr/bin/env bash
# safety-check.sh: SCOPE/SAFETY pre-merge guard
#
# Best-effort heuristic guard that blocks four categories of dangerous commits:
#   1. Filenames that look like CSAM hash list distributions
#   2. Image or video binaries in non-allowlisted directories
#   3. Strings that look like NCMEC / IWF / PhotoDNA / Arachnid credentials
#   4. Large binary files outside the allowlist
#
# This is NOT airtight. The real protection is people not committing this material
# in the first place. The CI guard catches accidents.
#
# Designed to run in two modes:
#   - GitHub Actions PR: compares against origin/${GITHUB_BASE_REF}
#   - Local pre-commit:  compares against HEAD~1 (or staged files if --staged)
#
# Exit codes:
#   0  - clean
#   1  - violations detected (PR should fail)
#   2  - script error

set -euo pipefail

# --------- Setup --------- #

FAIL=0
WARN=0

# Determine base ref. GITHUB_BASE_REF is set by GitHub Actions to the target branch
# of a PR; it cannot contain shell metacharacters per git ref-name rules but we
# validate it anyway and use it only as a single argument to git.
validate_ref() {
  # Allowlist: alphanumerics, slashes, dashes, dots, underscores. No shell metas.
  case "$1" in
    *[!a-zA-Z0-9/_.-]*) return 1 ;;
    "") return 1 ;;
    *) return 0 ;;
  esac
}

MODE="branch"
if [ "${1:-}" = "--staged" ]; then
  MODE="staged"
elif [ -n "${GITHUB_BASE_REF:-}" ]; then
  if validate_ref "${GITHUB_BASE_REF}"; then
    git fetch --quiet origin "${GITHUB_BASE_REF}" 2>/dev/null || true
    BASE="origin/${GITHUB_BASE_REF}"
  else
    echo "safety-check: rejecting suspicious GITHUB_BASE_REF" >&2
    exit 2
  fi
else
  BASE="HEAD~1"
fi

# Build the diff. Pass BASE as a positional arg, not via interpolation into a
# command string, so any shell metacharacters in BASE are treated as literal git
# arguments rather than executed.
if [ "$MODE" = "staged" ]; then
  FILES=$(git diff --name-only --cached --diff-filter=AM)
  diff_content() { git diff --cached --diff-filter=AM; }
else
  FILES=$(git diff --name-only --diff-filter=AM "$BASE" HEAD 2>/dev/null || git diff --name-only --cached --diff-filter=AM)
  diff_content() { git diff --diff-filter=AM "$BASE" HEAD; }
fi

if [ -z "$FILES" ]; then
  echo "safety-check: no added/modified files in diff, nothing to check"
  exit 0
fi

echo "safety-check: scanning $(echo "$FILES" | wc -l | tr -d ' ') file(s)"

# --------- Helpers --------- #

fail() {
  local file="$1"
  local msg="$2"
  if [ -n "${GITHUB_ACTIONS:-}" ]; then
    echo "::error file=${file}::${msg}"
  else
    echo "FAIL  ${file}: ${msg}"
  fi
  FAIL=$((FAIL + 1))
}

warn() {
  local file="$1"
  local msg="$2"
  if [ -n "${GITHUB_ACTIONS:-}" ]; then
    echo "::warning file=${file}::${msg}"
  else
    echo "WARN  ${file}: ${msg}"
  fi
  WARN=$((WARN + 1))
}

# --------- Check 1: CSAM hash list filename patterns --------- #
# Block any filename that looks like a hash list distribution. These should never
# be committed; they live in credentialed services like NCMEC and IWF.

HASH_LIST_PATTERN='(ncmec|iwf|arachnid|photodna).*hash|hash.*list|csam.*hash|known.*csam|ncmec.*api.*response|iwf.*list|arachnid.*list'

while IFS= read -r f; do
  [ -z "$f" ] && continue
  if echo "$f" | grep -iE "$HASH_LIST_PATTERN" >/dev/null 2>&1; then
    # Allow docs to discuss these concepts
    case "$f" in
      docs/*|*.md|README*|*/STATUS) continue ;;
    esac
    fail "$f" "Filename matches CSAM hash-list pattern. Hash lists must never be committed; they live in NCMEC / IWF / Project Arachnid."
  fi
done <<< "$FILES"

# --------- Check 2: image/video binaries outside allowlist --------- #
# Synthetic test fixtures live in packages/detectkit-test/fixtures/ or
# fixtures/synthetic/. Anything else is suspect.

while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    docs/images/*) continue ;;
    packages/detectkit-test/fixtures/*) continue ;;
    fixtures/synthetic/*) continue ;;
    *.svg) continue ;;  # SVGs are text and safe
  esac
  case "$f" in
    *.jpg|*.jpeg|*.png|*.webp|*.gif|*.heic|*.heif|*.mp4|*.mov|*.avi|*.webm|*.mkv|*.flv|*.tiff|*.bmp)
      fail "$f" "Binary image/video outside allowlist. Place in docs/images/, packages/detectkit-test/fixtures/, or fixtures/synthetic/. If this is a real synthetic fixture, document its generation."
      ;;
  esac
done <<< "$FILES"

# --------- Check 3: credential / API key patterns --------- #
# Look for added lines (lines starting with +) containing key-like patterns
# associated with the credentialed CSAM detection services.

CRED_PATTERNS=(
  'ncmec[[:space:]_-]*api[[:space:]_-]*key[[:space:]]*[=:][[:space:]]*[a-zA-Z0-9]'
  'ncmec[[:space:]_-]*esp[[:space:]_-]*token[[:space:]]*[=:][[:space:]]*[a-zA-Z0-9]'
  'iwf[[:space:]_-]*(api|hash)[[:space:]_-]*(key|token)[[:space:]]*[=:][[:space:]]*[a-zA-Z0-9]'
  'arachnid[[:space:]_-]*shield[[:space:]_-]*(key|token)[[:space:]]*[=:][[:space:]]*[a-zA-Z0-9]'
  'photodna[[:space:]_-]*(api|service)[[:space:]_-]*key[[:space:]]*[=:][[:space:]]*[a-zA-Z0-9]'
  'hive[[:space:]_-]*ai[[:space:]_-]*key[[:space:]]*[=:][[:space:]]*[a-zA-Z0-9]'
  'thorn[[:space:]_-]*safer[[:space:]_-]*(key|token)[[:space:]]*[=:][[:space:]]*[a-zA-Z0-9]'
  'aws[[:space:]_-]*secret[[:space:]_-]*access[[:space:]_-]*key[[:space:]]*[=:][[:space:]]*[a-zA-Z0-9]{20,}'
)

DIFF_CONTENT=$(diff_content 2>/dev/null || true)
for pat in "${CRED_PATTERNS[@]}"; do
  matches=$(echo "$DIFF_CONTENT" | grep -iE "^\+.*${pat}" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    # Allow examples and tests that use placeholder values
    if echo "$matches" | grep -iE 'example|placeholder|your-key-here|xxx|test-?key|fake|dummy|<.*>' >/dev/null 2>&1; then
      continue
    fi
    if [ -n "${GITHUB_ACTIONS:-}" ]; then
      echo "::error::Suspected credential pattern: ${pat}"
    else
      echo "FAIL  credential pattern detected: ${pat}"
      echo "${matches}" | head -3 | sed 's/^/        /'
    fi
    FAIL=$((FAIL + 1))
  fi
done

# --------- Check 4: large binary files --------- #
# Anything over 1MB outside the allowlist deserves a second look. This is a warning,
# not a hard fail.

while IFS= read -r f; do
  [ -z "$f" ] && continue
  [ ! -f "$f" ] && continue
  size=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f" 2>/dev/null || echo 0)
  if [ "$size" -gt 1048576 ]; then
    case "$f" in
      docs/*|*.lock|pnpm-lock.yaml|package-lock.json|Cargo.lock|poetry.lock) continue ;;
    esac
    warn "$f" "Large file ($((size / 1024))KB). Consider Git LFS or document why this is committed."
  fi
done <<< "$FILES"

# --------- Summary --------- #

echo ""
if [ "$FAIL" -gt 0 ]; then
  echo "safety-check: ${FAIL} violation(s), ${WARN} warning(s)"
  echo ""
  echo "See docs/safety-policy.md for policy and remediation."
  echo "If you believe this is a false positive, document it in your PR description"
  echo "and tag the maintainers for review."
  exit 1
fi

if [ "$WARN" -gt 0 ]; then
  echo "safety-check: clean (${WARN} warning(s))"
else
  echo "safety-check: clean"
fi
exit 0
