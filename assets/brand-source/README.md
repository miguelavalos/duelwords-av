# DuelWords AV brand masters

The visual system follows the Apps AV family established by Tune AV and Series
AV: warm paper, engraved navy ink, restrained AVALSYS green, product-specific
editorial objects, and the shared Avi V2 character.

## Deterministic masters

- `duelwords-wordmark.svg`: product wordmark without the duel icon.
- `duelwords-logo-lockup.svg`: duel icon plus product wordmark.
- `duelwords-wordmark-dark.svg` and `duelwords-logo-lockup-dark.svg`: the
  contrast-safe dark-appearance variants; never tint the light PNG at runtime.
- `duelwords-symbol.svg`: transparent product symbol for splash and adaptive icons.
- `duelwords-symbol-monochrome.svg`: Android themed-icon mask.

The checked-in PNGs under `assets/images/brand` are rendered from these SVGs so
Expo does not depend on runtime SVG rendering.

## Generated illustration masters

The app icon, splash hero, and onboarding hero were generated on 2026-07-24
with the built-in image generation tool, using the shipped Tune AV and Series AV
assets as style references. Prompts required ivory fibrous paper, vintage navy
engraving, restrained green, generous safe areas, no readable words, and no
modern flat or glossy treatment. The onboarding art received a second edit to
remove target and weapon motifs and replace them with a friendly connection and
completion mark.

Generated outputs are normalized into:

- `assets/images/icon.png`
- `assets/images/brand/duelwords-splash-hero.png`
- `assets/images/brand/duelwords-onboarding-hero.png`

Do not regenerate these assets independently from the Apps AV references. Any
future revision must compare the full icon, splash, onboarding, header, and
footer family together. The family was promoted into the private canonical
brand-system folder on 2026-07-24 as an owner-directed V1 candidate; final
pixel-level owner sign-off remains part of the next TestFlight gate.
