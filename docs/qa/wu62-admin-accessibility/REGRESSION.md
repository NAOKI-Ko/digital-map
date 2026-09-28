# Cross-phase regression

| Contract | Browser evidence | Result |
|---|---|---|
| WU-59 persistence | Settings, PIN, Paper, Decoration, Georeference dirty route/target guards; discard restored saved state | PASS |
| WU-60 visual editors | PIN selection, Paper edit, Decoration canvas and draft, Georeference two-canvas exception | PASS |
| WU-61 ownership | Floor child returned to Floors; Paper child to Paper list; Spot detail retained same-Map filtered list context | PASS |
| WU-61 publication | Public Map Publish showed visibility and editing/current release separately; Paper source options showed `編集中の内容` and `公開中の内容` | PASS |
| Responsive | 390, 768, 1024, 1440 px checks on Settings, PIN, Decoration, Georeference, Paper Edit, Publish; no document horizontal overflow; 1440 × 700 checked | PASS |

Georeference pointer selection and keyboard selection shared candidate state and existing Save. Decoration Enter selection was fixed after browser regression exposed a pointer-only target selection path. No route, API, schema, authorization, publication state-machine, Paper renderer, or public Map visual behavior was modified.

Technical gates: Nuxt typecheck PASS; full Vitest PASS (91 files passed, 3 skipped; 621 tests passed, 16 skipped); Nuxt production build PASS; Prisma validate PASS. All audits below ran read-only against `digital_map_wu62_qa`: default Spot fields PASS (six standard, one custom), IMAGE spatial migration PASS (zero unresolved exceptions), tenant data foundation PASS (zero anomalies), Paper Easy Builder PASS (one valid configuration, no orphan or invalid request).
