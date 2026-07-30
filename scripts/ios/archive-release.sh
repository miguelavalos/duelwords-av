#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
archive_path=""
enable_sentry_upload=0

usage() {
  cat <<'USAGE'
Usage:
  scripts/ios/archive-release.sh [--archive <DuelWordsAV.xcarchive>]
    [--sentry-upload]

Creates and validates DuelWords AV 0.1.0 (8) from the generated production
runtime. It never uploads to App Store Connect.

By default Sentry uploads remain disabled. --sentry-upload requires an ambient
SENTRY_AUTH_TOKEN and enables the official React Native source-map/debug-file
phases for this archive only. Never place the token in source or command text.
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --archive) archive_path="${2:-}"; shift 2 ;;
    --sentry-upload) enable_sentry_upload=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

workspace="$repo_root/ios/DuelWordsAV.xcworkspace"
local_config="$repo_root/ios/Config/Local.xcconfig"
derived_data="$repo_root/.DerivedData-duelwords-testflight"
development_team="935PM55U6R"
version_number="0.1.0"
build_number="8"
[ -d "$workspace" ] || { echo "Generated iOS workspace is missing." >&2; exit 1; }
[ -s "$local_config" ] || { echo "Generated production Local.xcconfig is missing." >&2; exit 1; }

timestamp="$(date '+%Y-%m-%d-%H%M%S')"
if [ -z "$archive_path" ]; then
  archive_path="$derived_data/Archives/DuelWordsAV-0.1.0-8-$timestamp.xcarchive"
fi
case "$archive_path" in *.xcarchive) ;; *) echo "--archive must end in .xcarchive" >&2; exit 2 ;; esac
build_log="$derived_data/Logs/archive-$timestamp.log"
mkdir -p "$(dirname "$archive_path")" "$(dirname "$build_log")"
: > "$build_log"
chmod 600 "$build_log"

if [ "$enable_sentry_upload" -eq 1 ]; then
  case "${SENTRY_AUTH_TOKEN:-}" in
    sntrys_*|sntryu_*) export SENTRY_DISABLE_AUTO_UPLOAD=false ;;
    *) echo "--sentry-upload requires an ambient SENTRY_AUTH_TOKEN." >&2; exit 1 ;;
  esac
else
  export SENTRY_DISABLE_AUTO_UPLOAD=true
fi

(cd "$repo_root" && pnpm run config:ios:generate:prod)
(cd "$repo_root" && pnpm run config:ios:runtime:prod)

if ! xcodebuild archive \
  -workspace "$workspace" \
  -scheme DuelWordsAV \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$archive_path" \
  -derivedDataPath "$derived_data" \
  -xcconfig "$local_config" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$development_team" \
  CODE_SIGN_STYLE=Automatic \
  MARKETING_VERSION="$version_number" \
  CURRENT_PROJECT_VERSION="$build_number" \
  > "$build_log" 2>&1; then
  echo "xcodebuild archive failed. Protected log: $build_log" >&2
  exit 1
fi

"$repo_root/scripts/ios/repair-release-archive-sentry-dsym.sh" \
  --archive "$archive_path"

"$repo_root/scripts/ios/check-release-archive.sh" \
  --archive "$archive_path" \
  --expected-build "$build_number" \
  --expected-version "$version_number"

cat <<REPORT

Verified archive is ready; App Store upload was not attempted.
  archive: $archive_path
  protected build log: $build_log
  Sentry upload: $([ "$enable_sentry_upload" -eq 1 ] && echo enabled || echo disabled)
REPORT
