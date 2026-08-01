#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
archive_path=""
expected_build="17"
expected_version="1.0.0"
expected_bundle_id="com.avalsys.duelwordsav"
expected_team_id="935PM55U6R"

usage() {
  cat <<'USAGE'
Usage:
  scripts/ios/check-release-archive.sh --archive <DuelWordsAV.xcarchive>
    [--expected-build <build>] [--expected-version <version>]

Validates a final DuelWords AV iOS archive without uploading it:
- version, build, production bundle id, signing team, and arm64;
- app dSYM and optional dynamic Sentry.framework dSYM UUIDs;
- Apple sign-in, Account AV keychain group, and Associated Domains;
- embedded Apple privacy manifest data declarations and required-reason APIs;
- embedded production Account AV, DuelWords realtime, and Sentry config.
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --archive) archive_path="${2:-}"; shift 2 ;;
    --expected-build) expected_build="${2:-}"; shift 2 ;;
    --expected-version) expected_version="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

fail() {
  echo "FAIL $*" >&2
  exit 1
}

plist_print() {
  /usr/libexec/PlistBuddy -c "Print :$2" "$1" 2>/dev/null || true
}

uuid_for() {
  /usr/bin/dwarfdump --uuid "$1" 2>/dev/null | awk '/UUID:/ {print $2; exit}'
}

[ -n "$archive_path" ] || fail "--archive is required"
case "$archive_path" in *.xcarchive) ;; *) fail "--archive must point to a .xcarchive bundle" ;; esac
[ -d "$archive_path" ] || fail "archive not found: $archive_path"
archive_path="$(cd "$(dirname "$archive_path")" && pwd)/$(basename "$archive_path")"

app_path="$archive_path/Products/Applications/DuelWordsAV.app"
app_info="$app_path/Info.plist"
[ -d "$app_path" ] || fail "archive app is missing"
[ -f "$app_info" ] || fail "archive app Info.plist is missing"
[ ! -d "$archive_path/Products/Users" ] || fail "archive contains installed intermediate products"

version="$(plist_print "$app_info" CFBundleShortVersionString)"
build="$(plist_print "$app_info" CFBundleVersion)"
bundle_id="$(plist_print "$app_info" CFBundleIdentifier)"
executable="$(plist_print "$app_info" CFBundleExecutable)"
archive_team="$(plist_print "$archive_path/Info.plist" ApplicationProperties:Team)"
architectures="$(plist_print "$archive_path/Info.plist" ApplicationProperties:Architectures)"
app_binary="$app_path/$executable"
privacy_manifest="$app_path/PrivacyInfo.xcprivacy"

[ "$version" = "$expected_version" ] || fail "version must be $expected_version, got ${version:-<missing>}"
[ "$build" = "$expected_build" ] || fail "build must be $expected_build, got ${build:-<missing>}"
[ "$bundle_id" = "$expected_bundle_id" ] || fail "bundle id must be $expected_bundle_id, got ${bundle_id:-<missing>}"
[ -f "$app_binary" ] || fail "app binary is missing"
[ -f "$privacy_manifest" ] || fail "top-level Apple privacy manifest is missing"
[ -n "$archive_team" ] || fail "archive signing team is missing"
[ "$archive_team" = "$expected_team_id" ] || fail "archive team must be $expected_team_id, got $archive_team"
echo "$architectures" | grep -q arm64 || fail "archive architectures must include arm64"

codesign_team="$(codesign -dv "$app_path" 2>&1 | awk -F= '/TeamIdentifier=/ {print $2; exit}')"
[ "$codesign_team" = "$expected_team_id" ] || fail "codesign team must be $expected_team_id, got ${codesign_team:-<missing>}"

app_dsym="$archive_path/dSYMs/$executable.app.dSYM"
[ -d "$app_dsym" ] || fail "app dSYM is missing"
app_uuid="$(uuid_for "$app_binary")"
app_dsym_uuid="$(uuid_for "$app_dsym")"
[ -n "$app_uuid" ] || fail "could not read app binary UUID"
[ "$app_uuid" = "$app_dsym_uuid" ] || fail "app dSYM UUID does not match app binary"

sentry_report="statically linked or not embedded"
sentry_binary="$app_path/Frameworks/Sentry.framework/Sentry"
if [ -f "$sentry_binary" ]; then
  sentry_dsym="$archive_path/dSYMs/Sentry.framework.dSYM"
  [ -d "$sentry_dsym" ] || fail "dynamic Sentry.framework dSYM is missing"
  sentry_uuid="$(uuid_for "$sentry_binary")"
  sentry_dsym_uuid="$(uuid_for "$sentry_dsym")"
  [ -n "$sentry_uuid" ] || fail "could not read Sentry framework UUID"
  [ "$sentry_uuid" = "$sentry_dsym_uuid" ] || fail "Sentry dSYM UUID does not match framework"
  sentry_report="$sentry_uuid"
fi

entitlements="$(mktemp)"
trap 'rm -f "$entitlements"' EXIT
codesign -d --entitlements :- "$app_path" > "$entitlements" 2>/dev/null
application_id="$(plist_print "$entitlements" application-identifier)"
keychain_group="$(plist_print "$entitlements" keychain-access-groups:0)"
apple_sign_in="$(plist_print "$entitlements" com.apple.developer.applesignin:0)"
associated_domains="$(plist_print "$entitlements" com.apple.developer.associated-domains)"
[ "$application_id" = "$expected_team_id.$expected_bundle_id" ] || fail "application identifier entitlement mismatch"
[ "$keychain_group" = "$expected_team_id.$expected_bundle_id" ] || fail "Account AV keychain group entitlement mismatch"
[ "$apple_sign_in" = "Default" ] || fail "Sign in with Apple entitlement mismatch"
echo "$associated_domains" | grep -Fq 'applinks:app.duelwords-av.avalsys.com' || fail "production Associated Domain is missing"
echo "$associated_domains" | grep -Fq 'applinks:app.duelwords-av-preview.avalsys.com' || fail "preview Associated Domain is missing"

node "$repo_root/scripts/ios/check-built-account-config.mjs" "$app_path" prod

privacy_json="$(mktemp)"
trap 'rm -f "$entitlements" "$privacy_json"' EXIT
/usr/bin/plutil -convert json -o "$privacy_json" "$privacy_manifest"
node - "$privacy_json" <<'NODE'
const fs = require("node:fs");

const manifest = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const fail = (message) => {
  console.error(`FAIL Apple privacy manifest ${message}`);
  process.exit(1);
};

if (manifest.NSPrivacyTracking !== false) {
  fail("must declare tracking=false");
}
if (!Array.isArray(manifest.NSPrivacyTrackingDomains) || manifest.NSPrivacyTrackingDomains.length !== 0) {
  fail("must not declare tracking domains");
}

const expectedCollectedData = new Map([
  ["NSPrivacyCollectedDataTypeName", true],
  ["NSPrivacyCollectedDataTypeEmailAddress", true],
  ["NSPrivacyCollectedDataTypeUserID", true],
  ["NSPrivacyCollectedDataTypeGameplayContent", true],
  ["NSPrivacyCollectedDataTypePurchases", true],
  ["NSPrivacyCollectedDataTypeCoarseLocation", false],
]);
const collectedData = manifest.NSPrivacyCollectedDataTypes;
if (!Array.isArray(collectedData) || collectedData.length !== expectedCollectedData.size) {
  fail(`must contain exactly ${expectedCollectedData.size} collected-data declarations`);
}
for (const entry of collectedData) {
  const type = entry.NSPrivacyCollectedDataType;
  if (!expectedCollectedData.has(type)) {
    fail(`contains unexpected collected-data type ${type ?? "<missing>"}`);
  }
  if (entry.NSPrivacyCollectedDataTypeLinked !== expectedCollectedData.get(type)) {
    fail(`${type} linkage does not match the App Store privacy inventory`);
  }
  if (entry.NSPrivacyCollectedDataTypeTracking !== false) {
    fail(`${type} must declare tracking=false`);
  }
  const purposes = entry.NSPrivacyCollectedDataTypePurposes;
  if (
    !Array.isArray(purposes) ||
    purposes.length !== 1 ||
    purposes[0] !== "NSPrivacyCollectedDataTypePurposeAppFunctionality"
  ) {
    fail(`${type} must be used only for app functionality`);
  }
  expectedCollectedData.delete(type);
}
if (expectedCollectedData.size !== 0) {
  fail(`is missing collected-data types: ${[...expectedCollectedData.keys()].join(", ")}`);
}

const expectedAccessedApis = new Map([
  ["NSPrivacyAccessedAPICategoryFileTimestamp", "C617.1"],
  ["NSPrivacyAccessedAPICategoryUserDefaults", "CA92.1"],
  ["NSPrivacyAccessedAPICategorySystemBootTime", "35F9.1"],
]);
const accessedApis = manifest.NSPrivacyAccessedAPITypes;
if (!Array.isArray(accessedApis) || accessedApis.length !== expectedAccessedApis.size) {
  fail(`must contain exactly ${expectedAccessedApis.size} required-reason API declarations`);
}
for (const entry of accessedApis) {
  const type = entry.NSPrivacyAccessedAPIType;
  const expectedReason = expectedAccessedApis.get(type);
  if (!expectedReason) {
    fail(`contains unexpected required-reason API ${type ?? "<missing>"}`);
  }
  const reasons = entry.NSPrivacyAccessedAPITypeReasons;
  if (!Array.isArray(reasons) || reasons.length !== 1 || reasons[0] !== expectedReason) {
    fail(`${type} must declare reason ${expectedReason}`);
  }
  expectedAccessedApis.delete(type);
}
if (expectedAccessedApis.size !== 0) {
  fail(`is missing required-reason APIs: ${[...expectedAccessedApis.keys()].join(", ")}`);
}
NODE

cat <<REPORT
DuelWords AV iOS release archive passed.
  archive: $archive_path
  version/build: $version ($build)
  bundle id: $bundle_id
  team id: $codesign_team
  app UUID: $app_uuid
  Sentry UUID: $sentry_report
  Apple privacy manifest: passed
REPORT
