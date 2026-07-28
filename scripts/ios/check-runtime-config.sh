#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
env_name=""
configuration=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --env) env_name="${2:-}"; shift 2 ;;
    --configuration) configuration="${2:-}"; shift 2 ;;
    *) echo "Usage: $0 --env dev|preview|prod [--configuration Debug|Release]" >&2; exit 2 ;;
  esac
done

case "$env_name" in
  dev)
    expected_bundle="com.avalsys.duelwordsav.dev"
    expected_variant="development"
    expected_api="https://api-account-av-preview.avalsys.com"
    expected_api_disabled="false"
    expected_realtime_disabled="false"
    configuration="${configuration:-Debug}"
    ;;
  preview)
    expected_bundle="com.avalsys.duelwordsav"
    expected_variant="release"
    expected_api="https://api-account-av-preview.avalsys.com"
    expected_api_disabled="false"
    expected_realtime_disabled="false"
    configuration="${configuration:-Release}"
    ;;
  prod)
    expected_bundle="com.avalsys.duelwordsav"
    expected_variant="release"
    expected_api="https://api-account-av.avalsys.com"
    expected_api_disabled="false"
    expected_realtime_disabled="false"
    configuration="${configuration:-Release}"
    ;;
  *) echo "--env must be dev, preview, or prod." >&2; exit 2 ;;
esac

local_config="$repo_root/ios/Config/Local.xcconfig"
workspace="$repo_root/ios/DuelWordsAV.xcworkspace"
if [ ! -s "$local_config" ] || [ ! -d "$workspace" ]; then
  echo "Generated iOS project and Local.xcconfig are required." >&2
  exit 1
fi

settings_file="$(mktemp)"
trap 'rm -f "$settings_file"' EXIT
xcodebuild \
  -workspace "$workspace" \
  -scheme DuelWordsAV \
  -configuration "$configuration" \
  -destination 'generic/platform=iOS Simulator' \
  -xcconfig "$local_config" \
  -showBuildSettings > "$settings_file"

setting() {
  local key="$1"
  awk -F= -v wanted="$key" '
    $1 ~ "^[[:space:]]*" wanted "[[:space:]]*$" {
      value=$2
      sub(/^[[:space:]]+/, "", value)
      sub(/[[:space:]]+$/, "", value)
      found=value
    }
    END { if (found != "") print found }
  ' "$settings_file"
}

failures=0
fail() { echo "FAIL $1" >&2; failures=$((failures + 1)); }

product_bundle="$(setting PRODUCT_BUNDLE_IDENTIFIER)"
runtime_environment="$(setting DUELWORDSAV_RUNTIME_ENVIRONMENT)"
build_variant="$(setting DUELWORDSAV_IOS_BUILD_VARIANT)"
publishable_key="$(setting ACCOUNTAV_PUBLISHABLE_KEY)"
keychain_service="$(setting ACCOUNTAV_KEYCHAIN_SERVICE)"
keychain_group="$(setting ACCOUNTAV_KEYCHAIN_ACCESS_GROUP)"
info_plist_relative="$(setting INFOPLIST_FILE)"
api_base_url="$(setting EXPO_PUBLIC_DUELWORDSAV_API_BASE_URL)"
api_disabled="$(setting EXPO_PUBLIC_DUELWORDSAV_API_DISABLED)"
convex_url="$(setting EXPO_PUBLIC_DUELWORDSAV_CONVEX_URL)"
convex_disabled="$(setting EXPO_PUBLIC_DUELWORDSAV_CONVEX_REALTIME_DISABLED)"
revenuecat_public_api_key="$(setting EXPO_PUBLIC_DUELWORDSAV_REVENUECAT_PUBLIC_API_KEY)"
revenuecat_offering_id="$(setting EXPO_PUBLIC_DUELWORDSAV_REVENUECAT_OFFERING_ID)"
revenuecat_monthly_package_id="$(setting EXPO_PUBLIC_DUELWORDSAV_REVENUECAT_MONTHLY_PACKAGE_ID)"

[ "$product_bundle" = "$expected_bundle" ] || fail "bundle identifier mismatch"
[ "$runtime_environment" = "$env_name" ] || fail "runtime environment mismatch"
[ "$build_variant" = "$expected_variant" ] || fail "build variant mismatch"
[ "$keychain_service" = "com.avalsys.duelwordsav.account" ] || fail "keychain service mismatch"
[ "$keychain_group" = "935PM55U6R.$expected_bundle" ] || fail "keychain access group mismatch"
if [ -z "$info_plist_relative" ] || [ ! -f "$repo_root/ios/$info_plist_relative" ]; then
  fail "generated Info.plist is missing"
else
  clerk_keychain_service="$(plutil -extract ClerkKeychainService raw -o - "$repo_root/ios/$info_plist_relative" 2>/dev/null || true)"
  [ "$clerk_keychain_service" = "$keychain_service" ] || fail "Clerk native and Account AV keychain services differ"
fi
[ "$api_base_url" = "$expected_api" ] || fail "Account AV API target mismatch"
[ "$api_disabled" = "$expected_api_disabled" ] || fail "Apps AV API enablement mismatch"
[ "$convex_disabled" = "$expected_realtime_disabled" ] || fail "Convex realtime enablement mismatch"
case "$convex_url" in https://*.convex.cloud) ;; *) fail "Convex URL must use convex.cloud" ;; esac
case "$publishable_key" in pk_test_*|pk_live_*) ;; *) fail "Account AV publishable key is missing or malformed" ;; esac
if [ "$env_name" = "prod" ] && [[ "$publishable_key" != pk_live_* ]]; then
  fail "production Account AV key must use pk_live_"
fi
case "$revenuecat_public_api_key" in appl_*) ;; *) fail "RevenueCat public SDK key is missing or malformed" ;; esac
[ "$revenuecat_offering_id" = "default" ] || fail "RevenueCat offering must be default"
[ "$revenuecat_monthly_package_id" = '$rc_monthly' ] || fail 'RevenueCat monthly package must be $rc_monthly'

if [ "$failures" -gt 0 ]; then
  exit 1
fi

echo "DuelWords AV effective iOS runtime config passed for $env_name ($configuration)."
