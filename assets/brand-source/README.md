# DuelWords AV brand masters

The visual system follows the Apps AV family established by Tune AV and Series
AV: warm paper, engraved navy ink, restrained AVALSYS green, product-specific
editorial objects, and the shared Avi V2 character.

## Promoted masters

- `duelwords-wordmark.png`: transparent product wordmark without the duel icon.
- `duelwords-logo-lockup.png`: transparent duel icon plus product wordmark.
- `duelwords-wordmark-dark.png` and `duelwords-logo-lockup-dark.png`: the
  contrast-safe dark-appearance variants; never tint the light PNG at runtime.
- `duelwords-symbol.png`: transparent product symbol for splash and adaptive
  icons.
- `duelwords-symbol-monochrome.png`: simplified Android themed-icon mask.

The 2026-07-28 family uses reviewed high-resolution PNG masters because its
engraved hatch detail and hand-lettering came from the approved visual
generation pass. The dark variants preserve the exact light alpha geometry,
retain the restrained green, and replace navy/paper detail with contrast-safe
ivory and dark ink. The product symbol is derived from the left-hand
opposing-board-and-pen mark in the full lockup. Runtime files are byte-identical
copies of these masters.

The superseded 2026-07-24 flat SVG family remains in `legacy-flat/` for
provenance only. It is not a valid runtime or regeneration source.

## Generated illustration masters

The app icon and onboarding hero were generated on 2026-07-24 with the built-in
image generation tool, using the shipped Tune AV and Series AV assets as style
references. The splash hero was revised and promoted on 2026-07-28. The edit
preserved its ivory paper, opposing word boards, pen, and upper safe area while
removing headphones, music notes, and sound-wave cues; Avi now has the canonical
side ears and reads as a word-game guide. The onboarding art remains the
non-violent connection/completion scene from the earlier pass.

Generated outputs are normalized into:

- `assets/images/icon.png`
- `assets/images/brand/duelwords-splash-hero.png`
- `assets/images/brand/duelwords-onboarding-hero.png`

Do not regenerate these assets independently from the Apps AV references. Any
future revision must compare the full icon, splash, onboarding, header, and
footer family together. The logo, wordmark, mark, and revised splash were
promoted into the private canonical brand-system folder on 2026-07-28 by owner
direction. Signed-device crop review remains part of the next TestFlight gate.
