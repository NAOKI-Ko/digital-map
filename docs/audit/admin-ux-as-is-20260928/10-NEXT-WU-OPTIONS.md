# Future Work Unit options

No WU numbers assigned. These are systemic batches, not an implementation commitment.

| Suggested order | Candidate WU | Goal | Findings | Expected screens | Risk / dependencies |
|---|---|---|---|---|---|
| 1 | Persistence interaction standardization | Make draft, section save and immediate commit visibly predictable; protect real drafts | UX-001, 002, 004, 012 | Georeference, Settings, Fields, Organization, Spot translations, Decoration, assigned Spot Editor | High; decide save semantics before changing APIs; regression around beforeunload/route exits |
| 2 | Publication vocabulary and source ownership | Define Map/Spot/release/Paper terms and propagation explanations | UX-010 and part of 001 | Publish, Map Home, Spot, Paper New/Edit | Medium; product decision on canonical words and translated equivalents |
| 3 | Admin Visual Editor shell | Establish task classes, preview placement/sticky rules and responsive acceptance | UX-003, 009 | PIN, Paper, Decoration; Georeference as explicit exception | Medium/high; browser geometry at 390, 768, 1024, 1440 required |
| 4 | IA / navigation consistency | Choose primary parent and contextual return rules | UX-006, 007 | Categories, Fields, Floors, Editors, Revisions, child editors | Medium; preserve WU-41 role/URL model |
| 5 | Feedback and component consolidation | Harmonize interaction-critical actions and status placement | UX-005, 011 | Shared primitives plus pages using custom actions | Medium; do after persistence contract to avoid wrong abstraction |
| 6 | Spatial keyboard access | Provide operable alternative for georeference point selection | UX-008 | Georeference wizard | Medium; must retain two-point math and validate keyboard workflow |

Before any implementation WU, run an authenticated disposable-data browser pass for the unverified routes and tablet width. Historical screenshots are useful baselines but do not verify this audit session.
