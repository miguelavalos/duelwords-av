# DuelWords solution-deck policy

Status: active source contract for bundled local dictionaries. Connected
Challenge adoption remains a separate backend rollout gate.

## Standard

Every supported game language has exactly 750 possible solutions at each
supported duel length:

| Language | 5 letters | 6 letters | 7 letters | Total solutions |
| --- | ---: | ---: | ---: | ---: |
| English | 750 | 750 | 750 | 2,250 |
| Spanish | 750 | 750 | 750 | 2,250 |
| Catalan | 750 | 750 | 750 | 2,250 |
| French | 750 | 750 | 750 | 2,250 |
| German | 750 | 750 | 750 | 2,250 |
| **Total** | **3,750** | **3,750** | **3,750** | **11,250** |

The valid-guess allowlist stays deliberately broader. A word may therefore be
accepted as a guess without ever being selected as the hidden solution.

## Solution criteria

The checked-in solution decks prioritize familiar common nouns and adjectives.
They exclude known proper names, verbal conjugations and infinitives presented
as verbs, abbreviations, malformed spellings, explicit profanity, slurs, and
particularly sensitive or poor-fit terms. Source frequency orders the remaining
eligible candidates; frequency alone never grants solution status.

The policy is intentionally stricter than accepted-guess validation. Ambiguous
forms are kept only when the exact displayed spelling has a normal noun or
adjective reading. German noun capitalization is preserved and is not treated
as proof of a proper name.

## Sources and audit method

- Mozilla Gaia's pinned Latin keyboard dictionaries remain the accepted-word
  source and frequency signal.
- Princeton WordNet, the Multilingual Central Repository (Spanish and Catalan),
  and WOLF (French) supplied noun/adjective lemma evidence from pinned Open
  Multilingual Wordnet data.
- OdeNet supplied the corresponding German common-noun/adjective evidence.
- Wikidata proper-noun lexemes and Apertium morphological analyses were used as
  negative editorial checks. They are not bundled runtime dependencies.
- Explicit exclusions cover known source ambiguities and sensitive terms that
  automated lexical categories do not reliably identify.

Exact revisions, hashes, attributions, and licenses are recorded in
`THIRD_PARTY_NOTICES.md`.

## Reproducibility and gates

The authoritative editorial files are
`src/game/dictionaries/curated-targets/<language>-<length>.json`. The Gaia
generator validates that every entry is an exact eligible source row, is not in
the explicit exclusion set, is unique, and produces exactly 750 solutions. It
embeds the editorial file path and SHA-256 in every generated dictionary.

`src/game/dictionaries/curated-targets.test.ts` requires byte-hash agreement
between those editorial files and all generated assets. The local fixture gate
also verifies counts, uniqueness, target membership, word length, and known
bad-form regressions such as Spanish `habrían`, French `étaient`, Catalan
`tenia`, and German `wurde`.

Changing a solution requires editing the editorial deck, regenerating all
affected assets, and passing both gates. The generator never silently replaces
the editorial list with a new frequency ranking.

## Connected rollout boundary

The public bundled decks are immediately available to local modes after a new
client build. Connected Challenge remains server-authoritative. Its prepared,
not-deployed immutable release is `curated-5-7-20260730-003`, containing
157,017 accepted-word rows and 11,250 targets with import-contract SHA-256
`fb4c23234615a6597d160f094874aa39b2e799bc4905d6816e818e106f4eac6c`.
Applying that import to preview or production requires a separate deploy
preflight, explicit authorization, ordered verification, and lifecycle smoke.

No lexical source is perfect. Future player reports should change the small
editorial decks and exclusion tests, not shrink the broad accepted-guess lists.
