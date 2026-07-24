# DuelWords AV dictionary notices

DuelWords AV bundles compact five-letter word data for offline native play.
Generated app assets contain only display/normalized words; source metadata and
the reproducible fixture pipeline remain in the private AVALSYS workspace.

## English — ESDB / SCOWL

- Source profile: American English ESDB / SCOWL.
- Pinned source revision: `1e5b7d3a72f47a71da5d28686c1dd4b397178485`.
- Bundled data: 8,734 normalized valid guesses and 589 reviewed targets.
- The upstream copyright and component notices are reproduced in
  `licenses/ESDB-SCOWL-Copyright.txt`.

## Spanish — RLA-ES / hunspell-es

- Source profile: general international Spanish.
- Pinned source revision: `ea82c1214ead57740798acf66a1e18e5ac874c41` (tag `v2.9`).
- Selected license for the bundled dictionary data: MPL 1.1 or later.
- Bundled data: 7,571 normalized valid guesses (7,944 display variants in the
  source fixture) and 731 reviewed targets.
- The selected license is reproduced in `licenses/RLA-ES-MPL-1.1.txt`.

Spanish normalization preserves `ñ` as a distinct letter and accepts omitted
vowel accents. These notices must remain with any distributed native build that
contains the generated dictionary assets.
