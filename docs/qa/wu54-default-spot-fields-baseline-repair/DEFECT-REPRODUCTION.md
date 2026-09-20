# WU-54 defect reproduction

## Root cause

The normal `POST /api/maps` path initialized `defaultSpotFieldDefinitions`, but the WU-53 baseline builder created each Map directly with Prisma and omitted those child rows. The settings page and `GET /api/maps/[mapId]/spot-fields` correctly read persisted definitions only, so the three accepted WU-53 Maps displayed no Spot fields.

## Confirmed Local state before repair

The active Local WU-53 database was inspected before any mutation. All three Maps had zero definitions; this was not inferred from the UI.

| Map slug | Total definitions | Standard keys | Custom count |
|---|---:|---|---:|
| `arimatsu-fon` | 0 | none | 0 |
| `arimatsu-tama` | 0 | none | 0 |
| `arimatsu-nau` | 0 | none | 0 |

The repair command rejected an incorrect confirmation token without changing data. The correctly guarded run added the six missing defaults to each Map. A second correctly guarded run created no rows, proving idempotence.

## Structural correction

- Normal Map creation and the WU-53 builder now call the same helper.
- The helper adds only missing defaults and preserves every existing row.
- The invariant audit detects missing, duplicate, null, or unexpected standard semantic keys while ignoring legal custom definitions.
- No GET handler performs self-healing or any other mutation.
