# WU-41 Astra — Autonomous Visual Redesign

Date: 2026-09-15 (Asia/Tokyo)

## Status and source

**WU-41 ASTRA REDESIGN BLOCKED** — implementation and available local checks are complete; the full acceptance run is not complete. Automatic approval review refused local role-fixture creation and a subsequent local unpublish action. No production or Windows QA changes were made.

- Base / final committed HEAD: `902cdb795f03d0b37122f6fb16cea89d14ccc4c2`
- Branch: `feat/wu41-astra-redesign-20260915`
- Worktree: `/Users/naoki/Documents/Codex/2026-09-15/files-mentioned-by-the-user-digital-2/work/digital-map`
- Source worktree was clean. This worktree contains uncommitted implementation and evidence; no commit, push, merge, or deployment.
- Initial inspection: the actual existing Cloudflare QA browser tab, settings → Home → spots → publish → analytics. The remote application was inspected without changing its data. Its tab was returned to Settings.
- Implementation and subsequent QA: isolated localhost:3041 application and Docker PostgreSQL on loopback port 55441. Existing migrations and the repository seed were applied only to this new DB; no migration was added.

## Design principles and system

Use a quiet neutral navigation surface, clear typographic hierarchy, and separators in preference to repeated cards. Retain the existing restrained terracotta accent for navigation selection and primary actions. White remains useful for inputs and data workspaces, rather than becoming a box around every paragraph.

The shell stays 72px collapsed / 256px expanded, with the existing responsive drawer. Navigation uses stone-100, stone-200 separators, and a pale terracotta active state. Controls generally retain 44px target heights. Titles remain 24–30px, section titles 16–18px, body 14–16px, supporting text 12px. Control radii are about 6–8px; large container rounding and shadows are reduced. Existing motion-reduction behavior is retained.

Japanese navigation labels replace mixed Organization, Current Map, Category, Analytics and Spot labels. Remaining internal operation codes are retained where traceability matters, especially Audit. No role, route, API, or data contract is replaced by a translated label.

## Screen decisions / Before → After

| Screen | Before / problem | Decision and result |
| --- | --- | --- |
| Navigation | Dominant black surface, bright white active rectangles; expanded footer consumed height | Light neutral rail, tinted active state, account disclosure. More height is available for working destinations. Context selectors and role-aware navigation remain. |
| Organization dashboard | Tall repeated cards | Compact map tiles with state, floor count, update date and direct open action. Japanese eyebrow. Grid remains appropriate for a small workspace selector. |
| Map Home | Four separate KPI cards and two large lower cards | Shared metric strip and two flat operational lists. Zero counts now have accurate supporting text. Mobile uses two metric columns. |
| Settings | Endless mixed settings, duplicated image pickers and navigation cards | Desktop section navigation + one active settings panel. Mobile horizontal section navigation. Hash-backed links preserve Back/Forward and reload. Panels use v-show to retain inputs. Sections: basic, public header, languages, SEO/share, editors, danger. Existing permission checks still determine team/danger visibility. |
| Settings media | Image libraries always visible | Native details reveal logo/share-image pickers. Explicit labels keep the controls discoverable. Upload/select/remove behavior is unchanged. |
| Spot list | Four competing CTAs, three filter rows, inactive bulk actions, results below fold | New Spot is primary; map placement secondary; CSV and review remain in route subnavigation. Main filters share a compact bar, advanced filters disclose. Bulk actions appear only with selection. Both detail links preserve returnTo query context. |
| Spot edit | Name below classification controls; repeated explanation sections and large cards | Name first, compact main form, consolidated explanatory text. Photo and pin-design sections have named disclosures; publication remains separate. Existing independent save operations remain independent. |
| Floors | New-floor form dominates before existing floors | Named Add Floor disclosure (open for zero floors), followed by operational floor list. Existing image, georeference and decoration operations retained. |
| Categories | New-item form and translation inputs dominate scanning | Add disclosure and flat rows; optional English names in per-row disclosures. Reorder/edit/delete remain adjacent to each category. |
| Spot Fields | Raw field-type enum labels | Japanese type names, accessible labels for creation controls, existing definitions and save semantics retained. Populated field rows still need fixture-based follow-up. |
| Publish | Release IDs primary; large cards | Japanese publication-ready time first, textual current-version state, IDs under technical details. Share and PDF are side by side on wide layouts, stacked on mobile. Their inner layouts were corrected to avoid narrow URL/selector fields. Actor attribution was not invented: the existing release API does not provide it. |
| Analytics | A number and dated text rows with little visual hierarchy | Date toolbar, compact total, daily bar plot and ranked Spot list. Missing UTC days are expanded to zero without compressing calendar gaps. Empty data is clearly distinguished. A table provides accessible exact daily values. No chart dependency or API additions. |
| Map editor / pin placement | Strong map workspace, oversized heading area | Map remains dominant; smaller heading, lighter shell. Existing resize event and ResizeObserver logic retained and visually verified on sidebar expansion. |
| Revisions | Technical heading and raw payload review | Japanese heading and consistent shell; existing decision controls and payload remain. Populated proposal review is **not accepted yet**: no assigned-role fixtures were permitted, and raw payload presentation remains a known follow-up. |
| Map editors | Oversized container around sparse membership content | Flatter assignment section and explicit select label. No membership changed. |
| Organization / members | Large settings card and always-open logo uploader | Flat settings and membership sections, named logo disclosure, accessible invitation labels. No invitation was sent and no membership changed. |
| Audit | Metadata always visible | Traceable event rows with technical metadata under an explicit disclosure. Audit authorization and data unchanged. |
| Spot Editor | Mixed heading; no browser title | Japanese heading/title. Empty assigned list inspected. Assigned-user submission and approval flow remain blocked pending local fixtures. |

## Responsive behavior

390×844 mobile QA covered Home, drawer, Settings and Spot list. Settings uses horizontal route-backed subnavigation and horizontal section navigation; forms retain full-width inputs. The Spot list uses two filter columns with a full-width search field, with details and search actions below. Bulk actions wrap only when present. Home operations stack while metrics remain in two columns.

The drawer traps focus, closes on Escape, and returns focus to its trigger. After adding account disclosure, screenshot and keyboard review found that closed details descendants still reported client rects in Chromium. The focus filter now excludes descendants of closed details, while including the summary itself. Verified: first close button → Shift+Tab → Account summary → Tab → close button; Escape returns to the menu trigger.

## Corrections after initial implementation

1. The first Spot toolbar still pushed results too low. Removed redundant back/helper text, combined details/search controls, and moved Select All beside the result heading.
2. Sharing's old nested desktop grid compressed the URL input inside the new two-column layout. Changed it to a full-width URL area with a compact QR preview; PDF controls now use two columns.
3. Initial chart minimum bar widths pushed the last populated date outside the visible area. Corrected flex sizing; the actual local view count now renders at the correct calendar position.
4. The first drawer account disclosure exposed hidden links to the focus trap. Corrected closed-details filtering and verified both directions and Escape.
5. Live browser warnings revealed pre-existing unresolved `UnsavedChangesGuard`, `SaveFeedback`, and dialog/component references. Added explicit imports in the affected admin files. Before the fix the Map name field could leave without a guard; afterward the confirmation displayed and Keep Editing preserved the value.
6. Map Home zero-count hints no longer say that work is required when none exists.
7. Settings hash navigation initially referenced missing fragment IDs; each section now has a matching ID.

## Implementation scope

Key components: AdminNavigation, AdminSubnavigation, AdminMetricCard, admin layout, MapNameForm, SpotForm, PublicSharePanel and PaperExportPanel. Major page changes cover Settings, Home, spots, publish, analytics, floors, categories and organization. Other admin pages receive explicit imports or small copy/accessibility corrections.

New helper: `app/utils/analytics-series.ts`; new tests cover UTC leap-day/month boundaries, single-day selection and invalid or excessive ranges. Existing reusable primitives were refined; no general-purpose abstraction was added solely for styling.

No API additions, server behavior changes, Prisma schema changes, auth policy changes, or persisted-domain changes. Public-map source and MapLibre implementation remain unchanged.

## Evidence and validation

Evidence: `docs/qa/wu41-astra-visual-redesign-20260915/`, grouped as `before/desktop`, `after/desktop`, `after/mobile`. Desktop browser viewport was 1470×646 during most final captures (the initial external browser was taller); full-page captures extend vertically. Mobile viewport: 390×844, reset afterward.

Before screenshots show the existing QA dataset; after screenshots show a fresh local seed. Counts, names and publication histories are therefore not expected to be identical. Analytics evidence contains the real one-view count generated by visiting the local public map, not invented metrics. Existing deeper-screen reference evidence is also available under `docs/qa/evidence/wu40-stageb/` and is historical, not a new passing run.

Verified on this implementation:

- Full suite: 66 test files / 430 tests passed.
- Typecheck: passed.
- Prisma validate: passed.
- Production build: passed; existing large-chunk advisory remains.
- Git diff whitespace check: passed.
- Actual local login, Home, Settings, list and deep-page rendering.
- Settings section switching, browser Back and input retention.
- Dirty guard: leave confirmation, Keep Editing and retained value after import correction.
- Search query URL, filtered result and reload persistence.
- Selection-only bulk action display and one local Spot publication update.
- Local Map publication, human-readable release row, QR display.
- Local public map displays its illustration and the one published Spot; drafts remain excluded in this check.
- Analytics reads the local public visit and renders the dated bar.
- MapLibre sidebar expansion reflows the map without losing markers.
- PDF: generated `map-A4-landscape.pdf`, 1,993,353 bytes; parsed as one A4 landscape page (841.89×595.28 pt). Browser download-event notification timed out, but the downloaded file was independently verified. No visual PDF certification is claimed.
- Exported rendered-HTML axe check: nine sampled admin pages, no serious/critical findings. This is an offline markup check with color/geometry checks excluded, not a full live-browser WCAG audit. The Spot edit snapshot had moderate main-landmark/heading findings in the offline parse; screenshots show those elements, so this remains a snapshot-check limitation requiring a live audit.

Not completed / cannot claim PASS:

- Local OWNER / Map EDITOR / Spot Editor / cross-Tenant end-to-end regression: fixture account and permission creation was rejected by automatic approval review.
- Unpublish, republish and rollback end-to-end test: local unpublish was rejected by automatic approval review. No workaround was attempted.
- Assigned Spot Editor submission / populated revision approval review and populated field management.
- Full CSV round-trip, i18n editing and media upload flows in this local run. Their automated tests pass; this is not equivalent to full UI acceptance.
- External OpenStreetMap tiles produced network fetch errors in this environment; illustration and markers rendered, but underlying online tile availability was not established.

## Known issues and acceptance decision

No new P0 or P1 was observed in completed checks. This is not an assurance over the untested permission and mutation flows. The pre-existing broken dirty guard was treated as P1 and corrected with live confirmation.

P2 / acceptance gaps: populated revision payload remains technical and has not received the required operator-focused validation; restricted-role, rollback, full CSV/i18n/media UI acceptance remains outstanding. Network availability limits online MapLibre tile coverage. P3: remaining mixed terminology in deeper tools and the small-screen metric-strip separator polish can be refined in the final acceptance pass.

**WU-41 ASTRA REDESIGN BLOCKED**

## Git and external-system safety

No Jira use, no Asana message/update, no push, no main merge, no Windows QA deployment, no production access/change. Local seeded DB and generated publication storage are test artifacts, excluded from the source patch. Original source worktree remains clean.

## Exact approval needed for the remaining acceptance run

Only the dedicated local DB/application above:

1. Run the existing `scripts/qa/stageb-fixtures.ts` to create six synthetic `@qa.invalid` identities (Owner A, Map Editor A, two Spot Editors, an invitee fixture and Owner B), their local Tenant/Map assignments, a second test Tenant/Map, and duplicate-Spot fixtures. No real person receives access and no email is sent.
2. On local `demo-arimatsu-map`, perform regression-only unpublish, republish and release rollback, plus test Spot revision submission/approval using those identities. This changes the isolated test DB only and cannot publish the user's Windows QA or production site.

The automatic approval review explicitly rejected account/permission creation for lack of named-scope approval and local unpublish for lack of explicit state-change approval. User confirmation is therefore required to resume those actions.
