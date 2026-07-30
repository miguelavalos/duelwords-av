#!/usr/bin/env bash
set -euo pipefail

environment="${1:-}"
mode="${2:-}"
case "$environment" in
  preview)
    profile="local"
    api_base_url="https://api-account-av-preview.avalsys.com"
    config_name="wrangler.preview.jsonc"
    expected_key_prefix="pk_test_"
    ;;
  production)
    profile="production"
    api_base_url="https://api-account-av.avalsys.com"
    config_name="wrangler.production.jsonc"
    expected_key_prefix="pk_live_"
    ;;
  *)
    echo "Usage: deploy-artifact.sh preview|production [--dry-run]" >&2
    exit 2
    ;;
esac
if [ -n "$mode" ] && [ "$mode" != "--dry-run" ]; then
  echo "Only --dry-run is supported as the optional second argument." >&2
  exit 2
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
workspace_root="$(cd "$repo_root/../.." && pwd)"
suite_root="${AVALSYS_SUITE_DIR:-$workspace_root/private/avalsys-suite}"
varlock_bin="$suite_root/node_modules/.bin/varlock"
bootstrap="$suite_root/scripts/resolve-infisical-bootstrap-env.sh"
wrangler_account="$suite_root/scripts/wrangler-account.sh"

if [ ! -x "$varlock_bin" ] || [ ! -x "$bootstrap" ] || [ ! -f "$wrangler_account" ]; then
  echo "Private read-only Infisical and Cloudflare wrappers are unavailable." >&2
  exit 1
fi

cd "$repo_root"
node scripts/web/web-artifact.mjs --verify
eval "$("$bootstrap" "$profile")"

read_varlock_value() {
  local path="$1"
  local name="$2"
  "$varlock_bin" printenv --path "$path" "$name" 2>/dev/null || true
}

publishable_key="${ACCOUNTAV_PUBLISHABLE_KEY:-${VITE_ACCOUNTAV_PUBLISHABLE_KEY:-}}"
if [ -z "$publishable_key" ]; then
  publishable_key="$(read_varlock_value "$suite_root/apps/account-av" VITE_ACCOUNTAV_PUBLISHABLE_KEY)"
fi
convex_url="${DUELWORDSAV_CONVEX_URL:-}"
if [ -z "$convex_url" ]; then
  convex_url="$(read_varlock_value "$suite_root/services/api" DUELWORDSAV_CONVEX_URL)"
fi

case "$publishable_key" in
  "$expected_key_prefix"*) ;;
  *) echo "Account AV publishable key has the wrong class for $environment." >&2; exit 1 ;;
esac
case "$convex_url" in
  https://*.convex.cloud) ;;
  *) echo "DuelWords Convex URL is missing or malformed for $environment." >&2; exit 1 ;;
esac

export ACCOUNTAV_PUBLISHABLE_KEY="$publishable_key"
export ACCOUNTAV_API_BASE_URL="$api_base_url"
export DUELWORDSAV_API_BASE_URL="$api_base_url"
export DUELWORDSAV_CONVEX_URL="$convex_url"
export ENVIRONMENT="$environment"

umask 077
runtime_config="$(mktemp "$repo_root/app-host/.wrangler-runtime.XXXXXX.json")"
trap 'rm -f "$runtime_config"' EXIT
node scripts/web/create-runtime-wrangler-config.mjs \
  "$repo_root/app-host/$config_name" \
  "$runtime_config"

args=(deploy --config "$runtime_config")
if [ "$mode" = "--dry-run" ]; then
  args+=(--dry-run)
fi
bash "$wrangler_account" "${args[@]}"
