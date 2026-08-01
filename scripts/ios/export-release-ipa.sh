#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
archive_path=""
export_path=""
expected_version="1.0.0"
expected_build="19"
expected_bundle_id="com.avalsys.duelwordsav"
expected_team_id="935PM55U6R"
expected_profile_name="DuelWords AV App Store"

usage() {
  cat <<'USAGE'
Usage:
  scripts/ios/export-release-ipa.sh --archive <DuelWordsAV.xcarchive>
    --export-path <new-directory>

Exports an App Store-signed IPA locally with destination=export, then validates
its distribution signature and entitlements. It never uploads to App Store
Connect and refuses to reuse an existing export directory.
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --archive) archive_path="${2:-}"; shift 2 ;;
    --export-path) export_path="${2:-}"; shift 2 ;;
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

[ -n "$archive_path" ] || fail "--archive is required"
[ -n "$export_path" ] || fail "--export-path is required"
case "$archive_path" in *.xcarchive) ;; *) fail "--archive must point to a .xcarchive bundle" ;; esac
[ -d "$archive_path" ] || fail "archive not found: $archive_path"
[ ! -e "$export_path" ] || fail "export path already exists: $export_path"

archive_path="$(cd "$(dirname "$archive_path")" && pwd)/$(basename "$archive_path")"
mkdir -p "$(dirname "$export_path")"
export_parent="$(cd "$(dirname "$export_path")" && pwd)"
export_path="$export_parent/$(basename "$export_path")"
timestamp="$(date '+%Y-%m-%d-%H%M%S')"
export_log="$repo_root/.DerivedData-duelwords-testflight/Logs/export-$timestamp.log"
options_plist="$(mktemp)"
inspection_dir="$(mktemp -d)"
trap 'rm -f "$options_plist"; rm -rf "$inspection_dir"' EXIT

cat > "$options_plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "https://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>destination</key>
  <string>export</string>
  <key>manageAppVersionAndBuildNumber</key>
  <false/>
  <key>method</key>
  <string>app-store-connect</string>
  <key>provisioningProfiles</key>
  <dict>
    <key>$expected_bundle_id</key>
    <string>$expected_profile_name</string>
  </dict>
  <key>signingCertificate</key>
  <string>Apple Distribution</string>
  <key>signingStyle</key>
  <string>manual</string>
  <key>stripSwiftSymbols</key>
  <true/>
  <key>teamID</key>
  <string>$expected_team_id</string>
  <key>uploadSymbols</key>
  <false/>
</dict>
</plist>
EOF

mkdir -p "$export_path" "$(dirname "$export_log")"
: > "$export_log"
chmod 600 "$export_log"

"$repo_root/scripts/ios/check-release-archive.sh" \
  --archive "$archive_path" \
  --expected-build "$expected_build" \
  --expected-version "$expected_version"

if ! xcodebuild -exportArchive \
  -archivePath "$archive_path" \
  -exportPath "$export_path" \
  -exportOptionsPlist "$options_plist" \
  > "$export_log" 2>&1; then
  echo "xcodebuild local export failed. Protected log: $export_log" >&2
  exit 1
fi

ipa_path="$export_path/DuelWordsAV.ipa"
[ -f "$ipa_path" ] || fail "exported DuelWordsAV.ipa is missing"
ditto -x -k "$ipa_path" "$inspection_dir"
app_path="$inspection_dir/Payload/DuelWordsAV.app"
app_info="$app_path/Info.plist"
profile_path="$app_path/embedded.mobileprovision"
[ -d "$app_path" ] || fail "exported app is missing"
[ -f "$profile_path" ] || fail "exported provisioning profile is missing"

profile_plist="$inspection_dir/profile.plist"
security cms -D -i "$profile_path" > "$profile_plist" 2>/dev/null
version="$(plist_print "$app_info" CFBundleShortVersionString)"
build="$(plist_print "$app_info" CFBundleVersion)"
bundle_id="$(plist_print "$app_info" CFBundleIdentifier)"
profile_name="$(plist_print "$profile_plist" Name)"
profile_uuid="$(plist_print "$profile_plist" UUID)"
profile_application_id="$(plist_print "$profile_plist" Entitlements:application-identifier)"
get_task_allow="$(plist_print "$profile_plist" Entitlements:get-task-allow)"
authority="$(codesign -dvv "$app_path" 2>&1 | awk -F= '/^Authority=/ && !found {print $2; found=1}')"
codesign_team="$(codesign -dvv "$app_path" 2>&1 | awk -F= '/^TeamIdentifier=/ && !found {print $2; found=1}')"

[ "$version" = "$expected_version" ] || fail "version must be $expected_version, got ${version:-<missing>}"
[ "$build" = "$expected_build" ] || fail "build must be $expected_build, got ${build:-<missing>}"
[ "$bundle_id" = "$expected_bundle_id" ] || fail "bundle id must be $expected_bundle_id, got ${bundle_id:-<missing>}"
[ "$profile_name" = "$expected_profile_name" ] || fail "App Store profile mismatch: ${profile_name:-<missing>}"
[ "$profile_application_id" = "$expected_team_id.$expected_bundle_id" ] || fail "profile application identifier mismatch"
[ "$get_task_allow" = "false" ] || fail "App Store profile must set get-task-allow=false"
case "$authority" in "Apple Distribution:"*) ;; *) fail "Apple Distribution signature is missing" ;; esac
[ "$codesign_team" = "$expected_team_id" ] || fail "codesign team mismatch"
codesign --verify --deep --strict "$app_path"
node "$repo_root/scripts/ios/check-built-account-config.mjs" "$app_path" prod

entitlements="$inspection_dir/entitlements.plist"
codesign -d --entitlements :- "$app_path" > "$entitlements" 2>/dev/null
keychain_group="$(plist_print "$entitlements" keychain-access-groups:0)"
apple_sign_in="$(plist_print "$entitlements" com.apple.developer.applesignin:0)"
associated_domains="$(plist_print "$entitlements" com.apple.developer.associated-domains)"
[ "$keychain_group" = "$expected_team_id.$expected_bundle_id" ] || fail "Account AV keychain group entitlement mismatch"
[ "$apple_sign_in" = "Default" ] || fail "Sign in with Apple entitlement mismatch"
echo "$associated_domains" | grep -Fq 'applinks:app.duelwords-av.avalsys.com' || fail "production Associated Domain is missing"
echo "$associated_domains" | grep -Fq 'applinks:app.duelwords-av-preview.avalsys.com' || fail "preview Associated Domain is missing"

ipa_sha256="$(shasum -a 256 "$ipa_path" | awk '{print $1}')"
ipa_size="$(stat -f '%z' "$ipa_path")"

cat <<REPORT
DuelWords AV local App Store IPA export passed.
  IPA: $ipa_path
  version/build: $version ($build)
  bundle/team: $bundle_id / $codesign_team
  profile: $profile_name ($profile_uuid)
  signature: $authority
  size: $ipa_size bytes
  SHA-256: $ipa_sha256
  protected export log: $export_log
  App Store upload: not attempted
REPORT
