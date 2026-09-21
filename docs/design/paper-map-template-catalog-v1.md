# Paper template catalog v1

| ID/version | Name | Map ratio | Intended source | Fallback |
|---|---|---:|---|---|
| `map-classic@1` | 地図を主役に | 70% | 5–40 Spots; photos optional | omit logo/photos; compact/overflow guide |
| `spot-guide@1` | スポットガイド | 55% | 5–24 Spots | missing summary becomes name/category; overflow page |
| `photo-story@1` | 写真でめぐる | 45% | 3–12 Spots with ≥3 photos and ≥40% coverage | missing photos become text cards; warning; no placeholder image |

Suitability is deterministic: choose `photo-story` for at most 12 Spots with at least 3 photos and 40% coverage; otherwise `spot-guide` for at most 24 Spots; otherwise `map-classic`. Saved configs always resolve the exact ID/version.
