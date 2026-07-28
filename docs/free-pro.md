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

## Subscription identity

- Product: `duelwordsav_pro_monthly`
- Entitlement: `pro`
- Offering: `default`
- Package: `$rc_monthly`
- Billing period: one month
- Base storefront price: EUR 5.99
- Family Sharing: off

RevenueCat is configured only after Apps AV resolves an internal signed-in
user. Guest use never initializes the purchase SDK. Purchase and restore
results trigger an Apps AV refresh; only the Apps AV entitlement can unlock
Pro. The paywall includes Restore purchases, Manage Apple subscription, Terms,
Privacy and Support.
