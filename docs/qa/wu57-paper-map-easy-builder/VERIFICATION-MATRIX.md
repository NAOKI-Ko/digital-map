# WU-57 Verification Matrix

| Area | Verification | Result |
|---|---|---|
| Product | Purpose-first recommended create and configured create | PASS |
| Scope | Selection-only customization; no freeform canvas/Canva API | PASS |
| Data | Map 1:N PaperMap, versioned JSON config, optional design request | PASS |
| Migration | Existing DB upgrade | PASS |
| Migration | Empty DB, all 31 migrations | PASS |
| Layout | Shared page/layout/contain/viewport functions used by Preview and PDF | PASS |
| Layout | Letterbox regression, fit/full/custom and layout-family tests | PASS |
| UI | create, edit, reset, save/reload, dirty guard, duplicate, delete | PASS |
| UI | explicit category/spot choice and manual ordering controls | PASS |
| PDF | A4/A3, portrait/landscape and all three purposes | PASS |
| PDF | QR/label, logo fallback, photo mode, Japanese, overflow pages | PASS |
| Source | LIVE current public-visible data | PASS |
| Source | current immutable READY release, including stopped public display | PASS |
| Security | all new routes call `requireMapAccess`; record reads are map-scoped | PASS |
| Security | shared guard covers OWNER/Map EDITOR positive and unassigned/cross-Tenant denial | PASS |
| Browser | authenticated create → customize → save → reload → PDF | PASS |
| Responsive | stacked 842px viewport and desktop layout CSS | PASS |
| PostgreSQL | all 89 test files / 586 tests with `DATABASE_URL` | PASS |
| CI | PR Verify and initial post-merge dev Verify | PASS |
| Scope | `main` unchanged; Production unchanged | PASS |

P0: 0  
P1: 0  
Core P2: 0
