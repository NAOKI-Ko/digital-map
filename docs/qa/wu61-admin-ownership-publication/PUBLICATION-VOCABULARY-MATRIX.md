# Publication vocabulary matrix

| Domain state | Internal state | Old visible wording | New visible wording | Screen |
|---|---|---|---|---|
| Map visible | `map.isPublished=true` | 公開中 | 公開中 | Map Home, Publish |
| Map private | `map.isPublished=false` | 下書き | 非公開 | Map Home, Publish |
| Editable Map data | `LIVE` | 現在の編集内容 / 最新内容 | 編集中の内容 | Publish, Paper New/Edit |
| Ready release, Map visible | `PUBLISHED`, current ready `PublicRelease` | 現在の公開版 | 公開中の内容 | Publish, Paper Edit |
| Ready release, Map private | `PUBLISHED`, retained ready `PublicRelease` | 公開停止中の版 / 現在の公開版 | 前回公開した内容 | Publish, Paper Edit |
| No ready release | no usable `PublicRelease` | ambiguous current release option | 公開履歴なし; Paper choice disabled | Publish, Paper Edit |
| First publication | private, no ready release | マップを公開する | 編集中の内容を公開する | Publish |
| Publish current edits | ready current release | 最新内容を公開する | 編集中の内容を公開する | Publish |
| Stop visibility | public Map | 下書きに戻す / マップを非公開にする | マップを非公開にする; visitors cannot view | Publish |
| Resume retained content | private, ready current release | 停止前の版を再公開する | 前回公開した内容を再公開する | Publish |
| Historical release | other ready `PublicRelease` | リリース / この版へ戻す | 公開履歴 / この内容を公開する | Publish |
| Spot eligibility enabled | `spot.isPublished=true` | 公開中 / 公開 | 公開対象; actual visibility still depends on Map and placement | Spot list/form, PIN, preview |
| Spot eligibility disabled | `spot.isPublished=false` | 下書き | 公開対象外 | Spot list/form, PIN, preview |

Internal `LIVE`, `PUBLISHED`, `PublicRelease`, `releaseId`, and `isPublished` values remain unchanged. Paper Preview/PDF source selection still sends the same API values.
