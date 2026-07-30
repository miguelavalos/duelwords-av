# DuelWords AV dictionary notices

DuelWords AV bundles compact five-, six-, and seven-letter word data for
offline native duel play. Daily and the original solo modes remain five-letter
games.
Generated app assets contain display/normalized words and auditable source
metadata. Broad accepted-guess lists remain separate from the stricter,
checked-in editorial solution decks.

## English — ESDB / SCOWL

- Source profile: American English ESDB / SCOWL.
- Pinned source revision: `1e5b7d3a72f47a71da5d28686c1dd4b397178485`.
- Reviewed base: 8,734 normalized valid guesses. The shipped five-letter
  allowlist is the deterministic union of this base and every eligible pinned
  Gaia row, for 9,354 valid guesses. The 750 existing targets are preserved.
- The upstream copyright and component notices are reproduced in
  `licenses/ESDB-SCOWL-Copyright.txt`.

## Spanish — RLA-ES / hunspell-es

- Source profile: general international Spanish.
- Pinned source revision: `ea82c1214ead57740798acf66a1e18e5ac874c41` (tag `v2.9`).
- Selected license for the bundled dictionary data: MPL 1.1 or later.
- Reviewed base: 7,571 normalized valid guesses (7,944 display variants in the
  source fixture). The shipped five-letter allowlist is the deterministic
  union of this base and every eligible pinned Gaia row, for 8,365 valid
  guesses. The 750 existing targets are preserved.
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
  - English: 9,354 five-letter, 10,050 six-letter, and 14,479 seven-letter
    normalized valid guesses. Each length has 750 targets.
  - Spanish: 8,365 five-letter, 11,216 six-letter, and 18,761 seven-letter
    normalized valid guesses. Each length has 750 targets.
  - Catalan: 5,481 five-letter, 9,501 six-letter, and 13,134 seven-letter
    normalized valid guesses. Each length has 750 curated targets.
  - French: 5,654 five-letter, 9,802 six-letter, and 14,035 seven-letter
    normalized valid guesses. Each length has 750 curated targets.
  - German: 6,299 five-letter, 9,225 six-letter, and 11,661 seven-letter
    normalized valid guesses. Each length has 750 curated targets.

The reproducible generator accepts only unflagged XML entries made of exactly
the requested five, six, or seven Latin-script letters. Catalan and French title-case entries are excluded
because Gaia does not separately identify proper names; German title case is
retained because standard German capitalizes nouns. Accents and umlauts are
folded for keyboard-tolerant lookup. German sharp-s entries are excluded because
uppercasing or transliterating `ß` can expand one tile into two letters.
Normalized collisions retain the highest-frequency source spelling, with a
locale-aware lexical tie-break. Gaia frequency orders candidates but does not
grant solution status. Every generated target is read from the versioned
editorial decks under `src/game/dictionaries/curated-targets/`, and each
generated asset records that deck's path and SHA-256. Across the 15
language/length combinations the app bundles 157,017 valid normalized words
and 11,250 targets. “Complete” here means every eligible accepted guess from
the pinned inputs after documented normalization—not every word that could
exist in a living language.

## Lexical sources used to curate solution decks

The following sources supplied lemma/category evidence for selecting common
nouns and adjectives. The app bundles only the resulting compact solution
decks, not these complete lexical databases.

- Open Multilingual Wordnet data commit
  `406bf83b3c507a3d1f26e88252d5d66893fd36bf`:
  - Princeton WordNet English data, SHA-256
    `d1409d88addcdb890b1606dd280b558cca4258b1f33bd580d54ed949daad1ede`,
    under the WordNet license reproduced in
    `licenses/Princeton-WordNet-License.txt`.
  - Multilingual Central Repository Spanish data, SHA-256
    `0ec37ce94ee2acc63ad6b120e1051f9841d172778cc24adc0023fb8dccf0a7cd`,
    and Catalan data, SHA-256
    `3c83c0c5298ed700a56dff9e9ea85dad2032162825778fec2c3df99fbccd3060`,
    by Aitor Gonzalez-Agirre, Egoitz Laparra, and German Rigau, under CC BY
    3.0; notice reproduced in `licenses/MCR-CC-BY-3.0.txt`.
  - WOLF French data, SHA-256
    `6effab15723bbb482f2922d42eb1db37c8586984ce7735ebfe0a096000b69f86`,
    by Benoît Sagot and Darja Fišer, under CeCILL-C; license reproduced in
    `licenses/WOLF-CeCILL-C.txt`.
- OdeNet commit `8ba741223048c28f67d4c38560ea4c0ee89568bb`, German
  WordNet SHA-256
  `7cd70a901b1104c084a398798981514cd0acdd0cc9824436d0b563cbdeb3bef4`,
  by Melanie Siegel and Francis Bond, under CC BY-SA 4.0; license reproduced in
  `licenses/OdeNet-CC-BY-SA-4.0.txt`.
- Wikidata lexicographical proper-noun data was consulted under CC0, and
  Apertium morphological analysis was used as a non-bundled editorial check.
Neither service is a runtime dependency.

To the extent the German curated target decks are adapted OdeNet material,
those data files are offered under CC BY-SA 4.0. The other source-specific
license and attribution obligations above continue to apply to their
respective lexical contributions; they do not replace the repository's license
for original application code.

The full selection policy and connected-runtime boundary are documented in
`docs/dictionary-solution-policy.md`.

`wordfreq` was evaluated but is not a source for these assets. Its code is
Apache-2.0, while its bundled frequency data is CC BY-SA 4.0 and upstream
guidance explicitly rejects conversion to a separable flat-list format.
