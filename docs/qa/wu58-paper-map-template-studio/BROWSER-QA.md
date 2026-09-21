# Browser QA

Authenticated browser QA ran against the disposable PostgreSQL database `digital_map_wu58_20260922`; the canonical database was not mutated. The fixture reused the repository's Arimatsu demo map and Spot content, marked the demo Spots published, and removed its synthetic external photo URLs so the no-photo fallback could be assessed honestly.

## Passed flows

- Template-first page renders all three templates and the deterministic recommendation.
- `map-classic`, `spot-guide`, and `photo-story` each create a paper map and route to the editor.
- Direct URL loads show the persisted template name.
- Preview slot clicks switch the inspector; the Spot inspector starts with a valid Spot selected.
- Paper Override add/save/reload/reset works; hiding and restoring a slot retains its content.
- Switching templates retains Paper Original and override data; Photo Story shows the expected no-photo fallback warning.
- Custom viewport uses visual and keyboard controls, has no raw numeric field, and survives save/reload.
- The editor and template picker have no horizontal overflow at 1440×900, 1280×800, 1024×768, 390×844, and 430×932. Primary heading, Preview, Save, and all three template actions remain available.
- A fresh browser tab reported no console warnings or errors after the final fixes.

## Browser limits

- The PDF button invokes the Blob-download path, but the in-app browser did not surface that programmatic download as a capturable download event. PDF generation is covered by passing renderer/API tests and inspected target PDFs.
- Destructive delete confirmation was not exercised in browser automation. Duplicate/delete contracts remain covered by the API test suite.
