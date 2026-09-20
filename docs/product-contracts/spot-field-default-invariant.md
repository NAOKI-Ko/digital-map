# Default Spot Field invariant

Date: 2026-09-20

Every Map owns exactly one standard `SpotFieldDefinition` for each semantic key: `description`, `address`, `hours`, `holiday`, `website`, and `phone`. New Maps and direct baseline builders must establish this invariant through the shared `ensureDefaultSpotFieldDefinitions` helper.

The canonical defaults are:

| Semantic key | Initial label | Type | Initial state |
|---|---|---|---|
| `description` | 紹介文 | `multiline_text` | enabled, public |
| `address` | 住所 | `single_line_text` | enabled, public |
| `hours` | 営業時間 | `multiline_text` | enabled, public |
| `holiday` | 定休日 | `multiline_text` | enabled, public |
| `website` | Webサイト | `url` | enabled, public |
| `phone` | 電話番号 | `single_line_text` | disabled, non-public |

These values are creation defaults, not an ongoing normalization rule. A Map owner may customize an existing definition's label, enabled/public state, required state, translations, and order. Repair therefore adds only missing semantic keys and never overwrites existing standard definitions, values, or custom fields.

When a Map has no definitions, canonical orders 0 through 5 are used. If a missing default's canonical order collides with an existing definition, all missing defaults are appended after the current maximum order. Existing rows are never reordered.

The invariant is established only in explicit write paths. Read endpoints return persisted rows and must not create or update definitions. Operational repair requires the explicit QA environment and confirmation guards, refuses Production, and is safe to run repeatedly.
