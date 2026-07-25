# DuelWords AV dictionary notices

DuelWords AV bundles compact five-letter word data for offline native play.
Generated app assets contain display/normalized words and auditable source
metadata. The CA/FR/DE generator is public in this repository; the reviewed
EN/ES curation pipeline remains in the private AVALSYS workspace.

## English — ESDB / SCOWL

- Source profile: American English ESDB / SCOWL.
- Pinned source revision: `1e5b7d3a72f47a71da5d28686c1dd4b397178485`.
- Bundled data: 8,734 normalized valid guesses from the reviewed fixture. The
  750 bundled targets are the intersection of this allowlist and the pinned
  Gaia English frequency ranking described below.
- The upstream copyright and component notices are reproduced in
  `licenses/ESDB-SCOWL-Copyright.txt`.

## Spanish — RLA-ES / hunspell-es

- Source profile: general international Spanish.
- Pinned source revision: `ea82c1214ead57740798acf66a1e18e5ac874c41` (tag `v2.9`).
- Selected license for the bundled dictionary data: MPL 1.1 or later.
- Bundled data: 7,571 normalized valid guesses (7,944 display variants in the
  source fixture). The 750 bundled targets are the intersection of this
  allowlist and the pinned Gaia Spanish frequency ranking described below.
- The selected license is reproduced in `licenses/RLA-ES-MPL-1.1.txt`.

Spanish normalization preserves `ñ` as a distinct letter and accepts omitted
vowel accents. These notices must remain with any distributed native build that
contains the generated dictionary assets.

## Catalan, French, and German — Mozilla Gaia Latin keyboard wordlists

- Source repository: `mozilla-b2g/gaia`, Latin keyboard dictionaries.
- Pinned source commit: `975a35c0f5010df341e96d6c5ec60217f5347412`.
- Selected license: Apache License 2.0. The upstream copyright/license notice is reproduced in
  `licenses/Mozilla-Gaia-Apache-2.0.txt`.
- Gaia attributes the Catalan list to Professor Kevin Scannell of Saint Louis
  University. Its dictionary README states that many other lists, including
  the French and German source paths used here, came from Android LatinIME.
- Pinned source SHA-256 values:
  - English (US): `bdd8bcbbb191971f7ffeaf2258df58ec78978eda396845d99fe8050fe40164b1`.
  - Spanish: `cd8473bfead9c47714c569355181f24a76194196c8f993dc097e2c78c2e58972`.
  - Catalan: `22384fb568fd549c84d7b7664ec950430ad572726f92fccc5bbca2e24dadb5c4`.
  - French: `7a7067c27b863510f6b6be3731a7737219773b5b1c37ec0f2b6470dd3aa80824`.
  - German: `33439c83ab4e87a40fa9c1722ce8887c2f24da8d531946080ccf7b8fed7002f0`.
- Bundled output:
  - English: 750 frequency-ranked targets intersected with the 8,734-word
    reviewed allowlist.
  - Spanish: 750 frequency-ranked targets intersected with the 7,571-word
    reviewed allowlist.
  - Catalan: 5,481 normalized valid guesses and 500 frequency-ranked targets.
  - French: 5,654 normalized valid guesses and 500 frequency-ranked targets.
  - German: 6,299 normalized valid guesses and 500 frequency-ranked targets.

The reproducible generator accepts only unflagged XML entries made of exactly
five Latin-script letters. Catalan and French title-case entries are excluded
because Gaia does not separately identify proper names; German title case is
retained because standard German capitalizes nouns. Accents and umlauts are
folded for keyboard-tolerant lookup. German sharp-s entries are excluded because
uppercasing or transliterating `ß` can expand one tile into two letters.
Normalized collisions retain the highest-frequency source spelling, with a
locale-aware lexical tie-break. The configured 750 EN/ES or 500 CA/FR/DE rows
by source frequency are targets after an auditable target-only exclusion set
removes explicit profanity and particularly sensitive identity/name
combinations; excluded rows remain valid guesses. Every remaining eligible row
is accepted only as a guess.

`wordfreq` was evaluated but is not a source for these assets. Its code is
Apache-2.0, while its bundled frequency data is CC BY-SA 4.0 and upstream
guidance explicitly rejects conversion to a separable flat-list format.
