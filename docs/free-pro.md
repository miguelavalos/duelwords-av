# DuelWords AV access tiers

The game stays fair at every tier. Practice, Play Avi, joining a human
challenge, the word lists, six attempts, timing, feedback and Settings never
change based on payment. DuelWords Pro adds capacity and choice, not gameplay
power. V1 has no advertising and Pro must not be described as removing ads.

| Capability | Guest | Free account | Pro account |
| --- | ---: | ---: | ---: |
| Official Daily | 1 total/day, Settings language | 1 total/day, Settings language | 1/language/day, picker in Daily |
| Human challenges created | 3/day | 6/day | 100/day |
| Local history available to statistics and Rivals | 25 | 100 | 1,000 |
| Statistics window | 7 days | 30 days | 365 days |
| Practice, Play Avi and joining challenges | Unlimited | Unlimited | Unlimited |

Official Daily is the explicit exception to `Guest < Free <<< Pro`: Guest and
Free both receive one total play each day. Changing Settings language does not
open another play. A started Daily always resumes in its original language.
Pro may start each supported language once per day.

Human-challenge creation and Daily participation are server-authoritative.
Guest identity is an opaque, device-stable session; a Free or Pro actor uses
the internal Apps AV user. Daily guesses, results and finished-game summaries
remain local to the device.

## Local game defaults

Settings keeps game-only choices separate from Account AV: the default game
language, Avi difficulty, and an optional DuelWords player name. They apply to
new Practice, Play Avi, and human-challenge flows on that device; each new game
also presents a setup screen where its language and, for Avi, difficulty can
be changed without changing the saved defaults. The optional player name is
only the room display name sent with a human challenge; it never edits the
shared Account AV profile.

Avi difficulty is available to every tier and never changes word rules:
Friendly retains fewer prior clues and cannot solve before its fourth attempt;
Balanced may solve from its third; Expert may solve from its second. Challenge
and Play Avi offer 5, 6, or 7 letters and 4, 6, or 8 attempts to every tier.
Daily, Practice, and Solo Practice keep their original five-letter rules. Pro
never changes dictionaries, feedback, attempts, or competitive rules.

## Subscription identity

- Product: `duelwordsav_pro_monthly`
- Entitlement: `pro`
- Offering: `default`
- Package: `$rc_monthly`
- Billing period: one month
- Launch base storefront price: EUR 2.99 in Spain
- Storefront coverage: all 175 current territories using Apple's automatic
  equivalents; signed build 16 displayed the localized USD 2.99 StoreKit offer
- Family Sharing: off

V1 is ad-free. The planned V2 Google AdMob model does not change the EUR 2.99
recommendation: Pro may become ad-free only when V2 actually ships ads, while
Free placements must stay outside active gameplay, lobby synchronization,
reactions, results, and rematch decisions. Do not raise the subscription price
at the V2 launch; review it only after representative conversion, retention,
churn, and realized ad-revenue data exists. A possible EUR 24.99 annual option
is a separate future product, not part of V1.

RevenueCat is configured only after Apps AV resolves an internal signed-in
user. Guest use never initializes the purchase SDK. Purchase and restore
return RevenueCat `CustomerInfo`; the client triggers Apps AV reconciliation
only when that snapshot contains the configured active `pro` entitlement. A
StoreKit transaction without that confirmation is reported honestly and does
not claim that Pro is still syncing or ask the user to purchase again. Only an
unsuccessful purchase response carries the anti-repurchase recovery copy; an
inactive or expired Restore instead states that no active subscription was
found and leaves Subscribe available. Only the Apps AV entitlement can unlock
Pro. The native iPhone/iPad paywall follows
the Tune AV visual hierarchy with
DuelWords copy and benefits. Its footer is exactly `Redeem code · Terms ·
Privacy`; Manage Apple subscriptions remains available to active Pro users.
Guest redemption routes to sign-in. Signed-in redemption uses the authenticated
app-scoped Apps AV promo endpoint, and the resulting grant still has to
reconcile through the Apps AV entitlement before Pro becomes active.

On web, Account AV sign-in and entitlement display are available, but Pro is
informational only. The browser does not initialize StoreKit/RevenueCat, sell
or restore a subscription, or redeem a code. Purchase, restore, and redemption
remain native-only operations. The physical iPhone build-16 purchase and
automatic same-account Pro hydration on physical iPad pass. Explicit Restore
Purchases with an active subscription and the remaining signed lifecycle
matrix are still release gates. Cancellation followed by accelerated Sandbox
expiry returned the physical iPhone to Free, and Restore after expiry safely
kept it Free. Build 16 used misleading purchase-recovery copy for that expired
Restore result; current source separates the two outcomes and therefore needs
a replacement signed candidate before review.
