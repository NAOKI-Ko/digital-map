# Candidate admin UX contracts — for product decision

These are hypotheses derived **after** the AS-IS analysis. They are not changes to the product.

| Candidate contract | Evidence | Applies to | Explicit exceptions | Migration risk |
|---|---|---|---|---|
| Visual Editor | PIN demonstrates a stable live Map beside long controls; Decoration/Paper differ | Long canvas-plus-inspector editing | Georeference paired spatial canvases; Paper New design choice; Paper Edit may preserve paper-first priority | Medium: changing orientation may disrupt learned workflow and sticky geometry |
| Persistence/dirty | Draft PIN/Paper, immediate Decoration, per-section Settings | Every editable screen | Immediate management/lifecycle operations; PDF-from-draft disclosure | High: making immediate operations draft-based changes server contract; prefer labeling first |
| Form Editor | SpotForm combines validation, actions, guard | Spot, Map, workspace and settings drafts | Approval submission remains revision creation | Medium: guards must account for per-section saved snapshots |
| Page header/back | WU-41 hierarchy and contextual Spot/Georef returns | Child routes and deep links | Auth, modal task, embedded wizard | Low/medium: returnTo query trust and role access must remain safe |
| Feedback | `SaveFeedback`, toast and inline status have overlapping jobs | Save/commit actions | Destructive lifecycle confirmation and transient bulk feedback | Low/medium: avoid duplicate announcements |
| Publication vocabulary | Publish and Paper expose release/source distinctions | Map, Spot, Paper source/PDF | Technical release ID remains in details | Medium: translation and operator documentation must align |
| Responsive visual shell | Existing PIN WU-56 and Paper QA cover 390/1024/1440 | Visual workspaces | Large print preview and paired maps | Medium: sticky preview may exceed viewport; test 768 and keyboard focus |

Decisions needed: (1) whether Paper Edit intentionally keeps the preview on the right at desktop; (2) which operations are visibly immediate; (3) qualified terms for Spot publish eligibility, Map visibility, release snapshot and Paper source. Do not infer a universal left-preview rule from PIN alone.
