# UX pattern matrix and verification coverage

| Pattern | Current implementations | Common behavior | Deviation | Candidate reference |
|---|---|---|---|---|
| Visual Editor | PIN, Decoration, Paper Edit; Paper New is visual choice | Canvas reflects input | Orientation/sticky/save differ | PIN for long map inspector; Paper Edit for paper-first output |
| Form Editor | SpotForm, Map New, Organization, Spot Editor | Labelled fields + submit | SpotForm guard, other forms often no guard; Spot Editor submits revision | SpotForm for draft protection |
| List Management | Spots, Categories, Fields, Floors, Paper, Editors | Item action + status | Feedback and in-page dirty handling differ | Spot list for query/scroll restoration |
| Settings | Map settings, Organization | Sections; section commits | Hash subnav only on Map settings; no shared route guard | Map settings as section structure, pending persistence decision |
| Lifecycle | Publish, Revisions | Immediate state operations | Publication words cross Map/Paper/Spot boundaries | Publish for release states |
| Wizard | Setup, CSV, Georeference | Ordered steps | Georeference is two-map task; Setup saves per step | Georeference only for spatial alignment |
| Read/Dashboard | Dashboard, Map Home, Analytics, Audit | Status, links, error/empty states | Dashboard redirects for one Map | Map Home for current Map context |
| Specialized | Login, Signup, assigned Spot Editor, design request | Restricted task | Assigned Spot save creates approval revision, not direct update | Keep explicit exception |

## Responsive and browser evidence

- **Fresh browser coverage in this audit: none.** Detached source checkout has no `node_modules`, `.env`, or local Nuxt listener. Existing Docker PostgreSQL listener was not accessed. No auth or canonical data was used.
- Historical WU-56 QA (`docs/qa/wu56-pin-editor-sticky-map/VISUAL-QA.md`) covers PIN at 390, 430, 1024, 1280, 1440 and reports no horizontal overflow, sticky at desktop, normal flow on mobile.
- Historical Paper QA (`docs/qa/astra-paper-map-product-pass-v2/browser/results.json`, `docs/qa/paper-map-adoption-final/browser/`) covers Paper new/edit at 390, 1024, 1280, 1440; retained screenshots were visually inspected for this audit. Mobile edit displays preview first, then a long inspector and a fixed bottom action bar.
- **768 px, Decoration, Georeference, Spot detail, Settings, Publish, Map Home, Spot list:** source-only responsive assessment. The `lg` breakpoint layouts become stacked at tablet width. Actual overflow, focus and dialog behavior need a separate authenticated browser pass before implementation acceptance.

Accessibility observations are recorded in [findings](08-FINDINGS.md). This is a practical interaction review, not certification.

### Viewport-by-viewport status

| Width | Source expectation | Historical rendered evidence | Remaining gap |
|---|---|---|---|
| 390 px | Sidebar drawer; visual grids stack; Paper Edit preview first and fixed actions | WU-56 PIN and Paper screenshots/results | Other routes, keyboard focus, dialog coverage |
| 768 px | Below `lg`, visual grids stack; Settings local nav becomes `md` vertical | None in this audit | All priority screens need live render |
| 1024 px | `lg` sticky behavior activates for PIN/Paper; Decoration two columns | WU-56 PIN and Paper QA | Decoration/Georeference and long inspectors |
| 1440 px | Desktop sidebar and two-column visual workspaces | WU-56 PIN and Paper screenshots/results | Remaining eight priority screens |

No fresh screenshot was captured. Historical images are repository QA artifacts, not new audit captures.
