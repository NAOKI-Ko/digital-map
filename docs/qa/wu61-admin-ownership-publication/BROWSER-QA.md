# Browser QA

Date: 2026-09-28 JST. Authenticated local Nuxt server on a disposable `digital_map_wu61_qa` PostgreSQL clone. No canonical Arimatsu data or Production deployment was changed. The clone had legacy external demo photo URLs that failed existing release-asset validation; those URLs were cleared in the clone only before command testing.

## Publication state scenarios

| Scenario | Browser observation | Result |
|---|---|---|
| Never published, private | `非公開`, `編集中の内容を公開する`, `公開履歴なし`; Paper PUBLISHED choice unavailable | PASS |
| First publication | UI command created a ready release and made Map public | PASS |
| Current edits differ from visible release | Cloned Map name changed after first release; Map Home showed new editing name while public visitor route retained prior release name | PASS |
| Public with ready release | Publish showed `公開中`, `編集中の内容`, `公開中の内容`; Paper choices matched; current-edit publication created another release | PASS |
| Historical content | History action opened result-specific confirmation; selecting older release changed current public release | PASS |
| Unpublish | Publish showed `非公開`, `前回公開した内容`, explicit visitor-unavailable copy; public share panel reflected private state | PASS |
| Private with retained release | Paper PUBLISHED option was `前回公開した内容`, with private-state explanation; resume command was `前回公開した内容を再公開する` | PASS |
| Resume retained content | UI restored public visibility for retained release; share panel updated immediately | PASS |

Paper source selection was discarded after inspection; no Paper renderer or API semantics were changed. Existing internal values remained `LIVE` and `PUBLISHED`.

## Responsive and navigation

Browser widths 390, 768, 1024, and 1440 px were checked on Publish, Paper Edit, Spot list, PIN, Categories and Fields; `documentElement.scrollWidth - innerWidth = 0` at each sampled width. A 1440×700 short viewport was included. Updated links and controls remained accessible in the DOM and visible in normal document flow. The expanded Team sidebar showed `aria-current="page"` for Revisions; collapsed rail intentionally contains fewer destinations.

Direct entry verified named returns on Categories, Fields, Floors, Decoration, Georeference, Editors, Revisions, Paper list/New/Edit, and Spot New. Context entry verified PIN → Spot New Save (returned to same floor and selected new Spot), PIN → Georeference, filtered Spot list → detail, and Paper design request. Invalid Spot floor, external return URL, and invalid Paper item context fell back to canonical parents. No route moves were introduced. Existing WU-59 guards and browser history behavior were not changed by this WU; a separate browser dirty-guard/Back-Forward interaction was not re-run.
