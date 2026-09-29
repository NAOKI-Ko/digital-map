# Aquarium Acceptance — 2026-09-29

Windows exact SHA `4a90be0186666a0e2007029da85e5a0846539e2a`, after PR #23 and post-merge Verify. Existing public fixture: https://eyes-retention-judgment-neural.trycloudflare.com/nagoya-aquarium-uat-20260928

## AQUA-007 — CLOSED

Chrome CUA browser viewport 390×844. Screenshots visually inspected for complete illustration, active Floor, controls and PINs; marker DOM bounding rectangles independently measured. No explicit overview button needed between Floors.

| Floor | Before: PINs within viewport | Windows after | Result |
|---|---|---|---|
| 北館 2F | 3/11 | 11/11 | PASS |
| 北館 3F | 1/4 | 4/4 | PASS |
| 南館 1F | 1/6 | 6/6 | PASS |
| 南館 2F | 2/9 | 9/9 | PASS |
| 南館 3F | 1/7 | 7/7 | PASS |

Whole artwork contains the building/Floor heading, all four exhibit zones and facility row. At 390 the square artwork fits 342px width. Its small embedded prose and dense facility markers remain artwork/content/readability debt; no claim of production illustration quality.

Zoom + drag South3, open penguin detail, Escape: marker transforms identical before/after close and focus returned to penguin PIN. Switch to North2 then shows 11/11 without recovery. Category overflow→トイレ・設備 shows two PINs and result count; barrier-free toilet detail opens correctly. All category assignments and placements preserved by database/public snapshot comparison. Same-floor selection and passive updates use existing non-refit behavior; dedicated camera unit tests also cover prior bearing/pitch and passive resize.

## Responsive / keyboard

Windows Public tested 768×1024, 1024×768, 1440×900 and 1440×700. Each: initial North2 11/11, no horizontal page overflow, Floor→South3→penguin detail→Escape succeeds. Full-width stage uses available height below 56px header, complete artwork and clear legend retained. Landscape side space is the expected square aspect-ratio result.

Floor focus returns to trigger. Info Shift+Tab remains trapped; Escape restores Info button. Detail focuses heading and returns to PIN. Selected states and 44px controls verified, no final browser error/warn. Viewport override reset after tests.

## Parity and test limits

Public route and authenticated LIVE Preview route import the same VisitorMapExperience. The new visitorOverview camera option is inside that component; no Preview-specific appearance patch. Preview remains auth protected and analytics disabled; existing regression suite passes. Thus the shared-renderer AC is PASS. Manual authenticated Aquarium Preview was not exercised: original UAT account password was deliberately not persisted, current session redirects to login, and user login was requested without creating/resetting/bypassing credentials. This is a remaining manual parity check, not evidence of a known mismatch.

Pointer drag/zoom, Floor/Category and touch-sized targets are verified. Physical touch/pinch/rotation is NOT RUN; current CUA exposes viewport size and pointer/keyboard, not multitouch. Touch-specific AC is PARTIAL. No unsupported PASS claim.

## Illustration readiness

Production-quality Floor Illustration work may begin against this verified visitor container, preserving actual Floor aspect ratio and safe rectangle. Require real topology/building continuity and readable labels as illustration acceptance; this schematic UAT content is not safe real-wayfinding evidence. This is not Production release approval. Competitive superiority remains unproven.
## Official benchmark recheck

Same official Web/April 2026 leaflet/live digital Desktop sources as 01-OFFICIAL-BENCHMARK.md. No official design, illustration or icons copied or traced. Ratings address the complete Aquarium experience, so better viewport behavior does not erase schematic-art limitations.

| Dimension | Before | After | Reason |
|---|---|---|---|
| floor recognition | BELOW | COMPARABLE | building + full Floor name and whole image immediately visible |
| building recognition | BELOW | BELOW | name is clear; real north/south relationship not represented |
| exhibit discovery | BELOW | BELOW | all PINs now accessible; dense unnamed default markers and schematic exhibits remain |
| toilet/facility discovery | BELOW | COMPARABLE | facilities visible in overview, category filter and named detail directly reachable; real locations require artwork work |
| category discovery | BELOW | COMPARABLE | explicit overflow navigation and selected/result feedback |
| spatial orientation | BELOW | BELOW | UI retains camera context, but diagram is not true corridor/topology data |
| viewport utilization | BELOW | COMPARABLE | complete floor within actual chrome-safe rectangle at all requested sizes |
| visual hierarchy | BELOW | BELOW | active Floor and controls clearer; artwork information hierarchy still weaker |
| marker readability | BELOW | BELOW | full coverage restored; facility row density and unlabeled exhibit circles remain |
| information density | BELOW | BELOW | schematic layout lacks official real spatial detail |
| mobile usability | BELOW | NOT-YET-COMPARABLE | own 390 flow improved; official mobile and physical multitouch not equivalently tested |
| desktop usability | BELOW | COMPARABLE | primary map, floor/category/detail and recovery operable without clipped legend; artwork debt scored separately |
| interaction cost | BELOW | NOT-YET-COMPARABLE | eliminated per-floor overview recovery; no matched timed official task trial |
| current-location support | NOT-YET-COMPARABLE | NOT-YET-COMPARABLE | Aquarium ungeoreferenced; official positioning not field-tested |
| route guidance | BELOW | BELOW | official route UI exists, ours out of scope |
| multilingual capability | BELOW | BELOW | official languages; Aquarium fixture Japanese-only |

No ABOVE claim. Mobile/filter/interactive discovery being clearly superior remains an unproven competitive goal, not a completed claim. Route guidance, positioning, language architecture, actual wayfinding topology and professional artwork remain separate follow-ups.
