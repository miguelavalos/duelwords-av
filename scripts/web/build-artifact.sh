#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

unset ACCOUNTAV_PUBLISHABLE_KEY
unset EXPO_PUBLIC_ACCOUNTAV_PUBLISHABLE_KEY
unset EXPO_PUBLIC_DUELWORDSAV_API_BASE_URL
unset EXPO_PUBLIC_DUELWORDSAV_API_DISABLED
unset EXPO_PUBLIC_DUELWORDSAV_CONVEX_URL
unset EXPO_PUBLIC_DUELWORDSAV_CONVEX_REALTIME_DISABLED
unset NO_COLOR

CI=1 FORCE_COLOR=0 pnpm exec expo export --platform web
node scripts/web/web-artifact.mjs --write

echo "Built one environment-neutral DuelWords AV web artifact."
