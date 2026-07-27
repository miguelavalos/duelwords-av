# App Store privacy contract

DuelWords AV V1 does not use advertising or tracking. Its iOS privacy manifest
declares the data collected by the app for Account AV and connected gameplay;
Sentry's bundled manifest declares its diagnostic categories.

## App Store Connect answers

| Data type | Linked | Tracking | Purpose |
| --- | --- | --- | --- |
| Name | Yes | No | App functionality |
| Email address | Yes | No | App functionality |
| User ID | Yes | No | App functionality |
| Gameplay content | Yes for signed users | No | App functionality |
| Coarse location | No | No | App diagnostics |
| Crash data | No | No | App diagnostics |
| Performance data | No | No | App diagnostics |
| Other diagnostic data | No | No | App diagnostics |

Do not declare advertising data, advertising identifiers, purchases, precise
location or tracking for the V1 binary. If advertising or real purchases are
added later, this contract, the public privacy policy, consent design, binary
audit and App Store Connect answers must all be reviewed again before release.

## Diagnostic boundary

Sentry may retain coarse location derived from a scrubbed network address. It
must not retain the raw IP address, a direct Account AV identifier, request
data, invitation tokens, room identifiers, words, guesses, answers or opponent
details. Coarse location is treated as not linked to identity, not used for
tracking and used only for app diagnostics.

## Account deletion

Deletion begins from the shared Account AV account screen. Before the external
identity is removed, the platform deletes DuelWords guesses, removes the
Account AV identifier and display name from durable player history, deletes
realtime room sessions and anonymizes any active player projection. Anonymous
match integrity may remain, but it must no longer identify the deleted user.

The executable iOS configuration check protects the app-level manifest. App
Store Connect must still be reviewed against the combined app and third-party
SDK inventory for every release candidate.
