# WU74 AS-IS and difference design

2026-10-04. Base dev / initial Windows: `91bfe21fd09207da5d4e3b228e1f4ee4e5ffd30e`. Existing open PRs: none. WU73 completed=true re-read. Verify [37192630570](https://github.com/NAOKI-Ko/digital-map/actions/runs/37192630570) success. main remains `a58b4353bd108e6586f329080c772f69b8aaffda`.

## Existing functions retained

| Requirement | Existing implementation | Difference |
|---|---|---|
| J1 signup / legal / verify / login | WU38 signup intents and auth sessions, WU63 normal homepage | Expose existing resend API and used-link login recovery |
| J2 zero Map / first Map | dashboard, maps/new, setup; WU72 create/default fields | Explain Workspace/Map; always show exact active context |
| J3 Standard beta | WU73 Billing / static contract / simulation | Guidance only; no Mock prerequisite |
| J4 Floor/Category/Spot/PIN | MediaPicker, floors, SpotForm, placement editor | Saved-data guidance; Floor and setup dirty guards; preserve existing storage paths |
| J5 Preview/publication/URL/QR | Authenticated LIVE renderer, immutable releases, PublicSharePanel | Link guidance; actual QR decode verification |
| J6 revisit | existing Login / dashboard / draft / explicit publication | Prevent logout before unsaved confirmation; preserve saved work |
| J7 two Maps | WU72 multi-Map and consumer invariant | Explain and measure tenant/name unique; no schema change |
| J8 invitations / memberships | invitations accept and organizations/active | Login return link for existing account; strict safe internal return |

## Observed friction

- F01: invalid/expired/used verification screen only links to Signup. Resend exists server-side but has no UI. Expose resend and existing login without a new account.
- F02: setup has no complete connection to PIN, LIVE Preview and publication; standard fields are described as done without checking current state. Add saved-data guidance and direct existing links; remove unsupported current-state assertion.
- F03: Floor name edit → Home silently loses unsaved text. Reproduced against Windows base with original `1F QA` and unsaved `1F 未保存 QA`; no dialog. Floor create/selected file/rename need protection. Delete copy incorrectly claims canonical Spot/photo deletion after WU72.
- F04: logout API clears session before route-leave guards can cancel. Intercept logout with existing confirmation before any mutation.
- F05: existing invitation says login first but has no login return link. Add allowlisted invitation return, keep token/role validation unchanged.
- F06: collapsed navigation hides active Workspace/Map on generic pages. Display names from authorized existing lists and link to normal switch screens.
- F07: second-Map category create returns a generic duplicate name error. Explain existing Workspace name uniqueness and current sharing restriction without leaking another Map name.

## Initial normal UI run

Homepage → Signup legal checkboxes → fake-mail development link → verification → Login → first Map → opt-in 3 Categories → synthetic floor upload → Spot with optional fields empty → PIN placement → public-target toggle → optional photo dialog. No SQL/API writes or URL rewrite in this principal path. QA identity/workspace are explicitly WU74 synthetic. Fake-mail development link is a documented auxiliary operation, not proof of external email delivery.

## State / recovery matrix

| State | Normal action | Data / boundary |
|---|---|---|
| Guest new owner | Signup + legal + mail verification | new Workspace only on verified intent |
| Existing user | Login; invitation return if invited | existing account and password retained |
| Verification expired / used | resend pending intent / existing Login | no forced duplicate Workspace |
| Workspace with 0 Maps Owner | create first Map | no Billing simulation prerequisite |
| Member without assigned Map | ask existing Owner for assignment | no automatic elevation / new account |
| 1 / 2+ Maps | authorized dashboard selection | route Map authoritative |
| Draft / saved partial | reopen normal Home / existing edit screens | progress derives from persisted data |
| Unplaced / target off / no photo | placement / public-target / optional photo links | independent states; optional photos do not block |
| Dirty / logout / Map switch | keep editing or explicit discard | session cleared only after consent |
| Published + edited LIVE | Preview → explicit latest publish | existing public snapshot stays immutable |
| Lost permission / archived old tab | existing server guard rejects; return Home | no security relaxation |

Desktop/tablet are primary for map creation/placement; mobile is used for entry, recovery, inspection and public visitor UI. Required viewport checks and touch-vs-emulation reporting remain explicit final gates.
