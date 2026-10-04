# WU-73 Workspace Plans / Entitlements / Usage

2026-10-04. Asana WU-73 is the sole requirement source. Base dev: `06e010aa5bbfe247c6215f350c8cfc0b45adc18b`, exact WU-72 post-merge Verify [PASS](https://github.com/NAOKI-Ko/digital-map/actions/runs/37186066595). WU-71 Accepted Decision D and WU-72 Phase 1 remain unchanged.

## AS-IS and decision

Tenant is the existing Workspace identity. TenantMember controls Workspace membership/Owner rights; MapMember controls Map editing. Map has `isPublished`, optional currentRelease, and `archivedAt`. Activation and rollback select an immutable READY PublicRelease and set publication true. Unpublish keeps the current release pointer and sets publication false. Archive unpublishes but preserves the Map and canonical content. MediaAsset and MediaVariant each store fileSize. TenantMember joins User.isActive; pending invitations are separate records.

There is no current paid contract, price, subscription or quota assignment. Use the explicitly permitted static/mock minimum: code catalog + a Workspace-scoped contract provider returning Standard / beta + one entitlement resolver + DB-derived Usage. No schema/model/migration changes and no Usage snapshot table. No User plan or Organization/BillingAccount entity. Trial/beta/active is a contract status, never a tier.

A future assignment provider replaces `resolveWorkspaceContract(workspaceId)` without changing feature policy or Usage. A future billing integration may update a Workspace assignment after verified provider events, independently of membership authorization. Payment operations are outside this WU. Current Mock never persists or changes contracts.

## Catalog / entitlement matrix

| Product | Audience / boundary | Current beta entitlements | Future capabilities |
| --- | --- | --- | --- |
| Standard | Facilities, stores, small regional operators; Digital Map SaaS | Public Map, Illustration Map, basic Analytics, CSV import/export | Formal pricing and limits undecided |
| Tourism / Area | Municipalities, DMO, tourism associations, regional platforms; not a larger numeric Standard quota | Same existing beta capabilities | Regional multilingual operations, integrated Analytics, collaboration and tourism DX: planned, not offered as tier additions |
| Enterprise | Large / multi-facility organizations; consultation / individual contract | Same existing beta capabilities | SSO/API/SLA/dedicated support: unavailable, future candidates |

The only limit key is `maxPublishedMaps`. It is null for the beta catalog: **no enforced beta limit**, not a promise of unlimited future service. The numerical examples in the request are not adopted as product limits. No prices are invented. Feature code must read `resolveEntitlements`; plan code only identifies catalog entries. No unimplemented feature entitlement is issued.

## Usage definitions

All aggregates are scoped to the active, DB-authorized Workspace and read in a repeatable-read transaction. No cross-Workspace or per-Map editor content is exposed: all current members may see aggregate usage, even without Map assignments. This visibility grants no Map rights.

- publishedMaps: Map.archivedAt null, Map.isPublished true, currentRelease exists, currentRelease.mapId equals Map.id, and currentRelease.status READY. Not total Map count; old releases and BUILDING drafts do not count. This measures publication state, not delivery health / manifest availability. Legacy missing-manifest fixtures remain fail-closed and are not repaired by billing.
- retainedMaps: all retained Map rows including archived ones. Map archive does not pretend that storage was deleted.
- archivedMaps: rows with archivedAt set.
- draftMaps: non-archived retained Maps not meeting the publishedMaps definition. Includes an unpublished Map whose old release pointer remains.
- storageBytes: sum of each Workspace MediaAsset.fileSize plus its MediaVariant.fileSize once, even when referenced by multiple Maps/Spots. UI explicitly says **managed media**, excluding public-release copies, unregistered files, DB bytes and physical backup storage. Not a fabricated whole-disk billing number.
- memberCount: Workspace memberships whose User.isActive is true, each counted once. Includes Owner and Member, excludes pending invitations and inactive users. Map assignments are not counted again.

No Guest/Venue/Layer/Event usage exists. No snapshot tables or filesystem scans in the request path.

## Authorization and Mock

GET /api/organization/billing requires the current DB TenantMember after the existing active-user/authVersion gate. Response is private/no-store. Owner and members (including Map Editor) can view actual aggregate Usage and entitlements. Workspace profile/member mutations keep the existing Owner guard.

POST /api/organization/billing/simulate requires current DB Owner independently of entitlements, then validates a strict plan-code / test-limit body. Workspace/user/payment fields are rejected. Owner chooses any catalog tier with a clearly labelled **test-only** integer limit. Confirmation says beta/mock, no save, no charge and no change to current plan, data, publication or authorization. Tourism/Enterprise consultation is a non-sending informational Mock. Page reload resets the simulation.

## Downgrade / future enforcement points

Simulation and the pure entitlement policy are implemented. Current beta operations do not receive a new quota restriction. This is within WU-73's permitted minimal enforcement scope; no arbitrary active first-N Maps selection.

For a future real limit, require authorization separately, then within the Workspace's serialized publication activation transaction re-read current usage / assignment and apply the centralized policy to its delta:

- delta +1 (initial publish or reactivation of an unpublished Map): deny if usage +1 exceeds maxPublishedMaps.
- delta 0 (safe correction/new release of an already-public Map, pointer rollback of a public Map): allow even when already over quota.
- delta -1 (unpublish/archive/reduction): allow.
- rollback of an **unpublished** Map is a reactivation (+1), not a loophole.
- Map creation grows retainedMaps, not publishedMaps; no retained limit/enforcement is introduced here. Storage upload and member invitation likewise remain existing authorized operations, since no quota for these is defined.

A future concurrent publish gate must serialize by Workspace, not only Map, to avoid overshoot across Maps. Never delete Map/Spot/URL/Release/Audit/exportable data, revoke rights or stop existing public Maps on downgrade. Export stays available under the existing authorization contract.

## UI / regression / rollback

Preserve current admin IA and public visitor UX. Add an accessible Settings link strip (Workspace / Members for Owner, Plan & Billing for all current members, Account) on the existing settings/account and new billing page, and one discoverable rail link. Keep existing Workspace and Map pickers.

Current Plan / Beta copy, actual Usage with accurate scopes, product audience/comparison, feature availability and test-only Mock are rendered with headings, lists, description lists, labelled number input, status/errors and the existing accessible confirmation dialog. No new motion is introduced. Verify 390x844, 768x1024, 1024 desktop, 1440x900, keyboard/focus/dialog cancellation and axe semantics.

Rollback is an application-source/build rollback to the WU-72-compatible release; there are no schema changes to undo. Preserve DB/Media/Public and secrets/origin files, use verified backup/restore, and compare exact source/bundle and served assets. Windows candidate, review, exact Verify, dev merge, post-merge Verify and exact merged-SHA acceptance evidence is recorded on PR/Asana against the final SHA. Production/main untouched.
