#!/usr/bin/env bash
set -euo pipefail

archive_path=""

usage() {
  cat <<'USAGE'
Usage:
  scripts/ios/repair-release-archive-sentry-dsym.sh --archive <DuelWordsAV.xcarchive>

Generates a matching dSYM when Xcode embeds a generated Sentry.framework
binary in the final DuelWords AV archive. Statically linked builds are left
unchanged.
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --archive) archive_path="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

[ -n "$archive_path" ] || { echo "--archive is required." >&2; exit 2; }
case "$archive_path" in *.xcarchive) ;; *) echo "--archive must end in .xcarchive" >&2; exit 2 ;; esac
[ -d "$archive_path" ] || { echo "Archive not found: $archive_path" >&2; exit 1; }
archive_path="$(cd "$(dirname "$archive_path")" && pwd)/$(basename "$archive_path")"

sentry_binary="$archive_path/Products/Applications/DuelWordsAV.app/Frameworks/Sentry.framework/Sentry"
sentry_dsym="$archive_path/dSYMs/Sentry.framework.dSYM"

if [ ! -f "$sentry_binary" ]; then
  echo "Sentry is statically linked or not embedded; no framework dSYM repair is needed."
  exit 0
fi

uuid_for() {
  /usr/bin/dwarfdump --uuid "$1" 2>/dev/null | awk '/UUID:/ {print $2; exit}'
}

binary_uuid="$(uuid_for "$sentry_binary")"
[ -n "$binary_uuid" ] || { echo "Could not read the Sentry framework UUID." >&2; exit 1; }

if [ -d "$sentry_dsym" ]; then
  dsym_uuid="$(uuid_for "$sentry_dsym")"
  if [ "$dsym_uuid" = "$binary_uuid" ]; then
    echo "Sentry.framework.dSYM already matches the embedded framework."
    exit 0
  fi
  rm -rf -- "$sentry_dsym"
fi

mkdir -p "$archive_path/dSYMs"
xcrun dsymutil "$sentry_binary" -o "$sentry_dsym" >/dev/null

dsym_uuid="$(uuid_for "$sentry_dsym")"
[ "$dsym_uuid" = "$binary_uuid" ] || {
  echo "Generated Sentry.framework.dSYM does not match the embedded framework." >&2
  exit 1
}

echo "Generated a matching Sentry.framework.dSYM."
