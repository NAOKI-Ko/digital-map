# WU-77 persisted synthetic QA plan — preparation only

2026-10-05. No cluster, credential, account, persistent service, authenticated candidate, migration or seed below has been created/executed. This plan does not establish QA PASS. Source candidate remains9d2a1ec196a9bec33d78aaaf1e418b786cb7b21c.

## Existing entrypoint and boundary

Read-only inspection found existing Windows `common.ps1` only establishes known tool/runtime paths. `run-app.ps1` loads protected `runtime/secrets.ps1`, starts the existing DB, starts the release named by `runtime/release-path.txt`, and writes canonical `runtime/app.pid`. `start-app.ps1` starts the existing `DigitalMap-App` scheduled task only when3011 is unhealthy. They have no candidate-root/port/restore parameter. They must not be repurposed for this fixture.

Protected settings/credential values were not read. Ordinary SSH environment has no DATABASE_URL/session/PG configuration. Existing PostgreSQL binaries at `C:\DigitalMap\tools\pgsql\bin` report17.11. Read-only preflight found5433/3014 unused and proposed root absent. Saved PS1 execution is blocked by current ExecutionPolicy. Do not change policy, useBypass, run a blocked script through another interpreter, or inline a rejected runner.

The existing WU74 freshbackup/disposable-restore evidence is historical. A new actual-data backup/restore needs an approved opaque configuration entrypoint or an authorized operator. No synthetic result replaces this unexecuted condition.

## Reviewable operations

1. Recheck own root absent, no reparse ancestor,5433/3014 free, source/build manifest9d2a1ec, existing3011/SHA9403d32/ready unchanged. Use only `C:\DigitalMap\incoming\wu77-persisted-20261005`; all data/media/public/log/PID/secret files belong under it. Existing3013 remains the independent F1 API fixture.
2. Use existing trusted17.11 `initdb.exe` to initialize a fresh cluster under `postgres-data`, UTF8, explicitSCRAM authentication and a fresh opaque bootstrap password supplied through a private password file. Run as the existing user; no Windows service, scheduled task, OS account, firewall rule or existing role is created/changed. Do not use defaulttrust authentication or group-access flags. Secret values must not appear in commands, logs, Git, Asana or handoff.
3. Run only this cluster on127.0.0.1:5433 using the standard foreground process/owned-PID procedure. Create new `wu77_fixture_20261005` inside it and a separate non-superuser app role `wu77_qa_app` owning only that DB, with its own opaque credential. Reject any nonloopback host, other port/database, preexisting root/records, absent ownership marker or canonical target. Apply the exact existing Prisma migrations to this new empty database; schema files are unchanged. The bootstrap role is only for cluster setup, not app runtime.
4. Bootstrap only Tenant/User/TenantMemberOWNER (three rows) using existing schema and bcrypt cost12; email `owner@wu77.example.invalid`, IDs `wu77-qa-tenant`/`wu77-qa-owner`/`wu77-qa-owner-member`. Do not run the repository’s broad demo seed. Then use normal authenticated app/API paths for Map/Floor/Category/Spot/Placement design, upload and publication. No fabricated session, disabledrequireUser, permission bypass, changed role semantics or hidden production API is permitted. OWNER has access only to the new self-authored synthetic Workspace/data; no MapMember is needed under the existing OWNER contract.
5. F1 JSON is immutable. Its `__qa_arimatsu` slug is intentionally invalid for normal map authoring, and its SVG asset URLs are not normal managed upload inputs. Define a separate persisted derivative named `wu77-visitor-quality`, record IDs/slug/assets mapping and derivative hashes, keep the same36 names/positions/2floors/4categories/appearance values. Upload the existing floorPNG and same-artwork café/fishPNGs through the normal upload contract into empty own media roots. This derivative is not byte-identical to F1 JSON and does not change the locked benchmark.
6. Start the exact9d2a1ec production build only on127.0.0.1:3014, with fresh opaque session secret, fresh DB URL and own local media/public roots. Declared/effective Public/Admin origins must all equal the loopback candidate origin. Set DEPLOYMENT_ENV and NUXT_DEPLOYMENT_ENVIRONMENT toqa; exact host, origin, CSRF, CSP, rate limits and publication gates remain enabled. Do not enable trusted proxy or add wildcard hosts/origins.
7. Preserve production cookieSecure/HttpOnly/SameSite flags. Browser Secure-cookie behavior on loopback remainsOPEN. Installed nuxt-auth-utils0.5.30 source declares `runtimeConfig.session.name` (default `nuxt-session`); verify the corresponding runtime override and actualSet-Cookie uses the dedicated `wu77-qa-session-9d2a1ec` name before login. If normal authenticated browser requests fail, stop that gate and report the exact approved transport/environment needed; do not disableSecure. Cookies are not isolated by port; candidate cookie separation is mandatory.
8. Through normallogin, perform individual facility choice and Category default save, reload, explicit publication, Public and authenticatedLIVE comparison on the same saved state, draft changes versus old public release, republish, Detail/Floor/Category/collision/focus. READY release/manifest/current pointer and copied assets must exist; setting DBpublished flags alone is insufficient. Normal publication may create/update only the synthetic candidate's release pointer inside its owned public-snapshots root. Keep releaseID/mapVersion/canonicalSpotID/placementID and public DTO/asset hashes as evidence without credentials.
9. Run `audit:domain-foundation`, `audit:tenant-data-foundation`, `audit:image-spatial-migration` and `audit:paper-map-easy-builder` against only the new DB. Recheck live3011 SHA/ready/public snapshot hashes unchanged. Stop only owned processes by root/PID/port; keep recoverable evidence, dispose of test credentials/account/cluster through the approved disposable-fixture cleanup. Existing/canonical current junction, release pointers, tunnel and database remain untouched.

Normal route sequence: `/admin/login` and `POST /api/auth/login`; `POST /api/maps`; upload/floor/category/Spot APIs; `PATCH /api/maps/{mapId}/spots/{spotId}/design`, category pin-default and Spot publish; `POST /api/maps/{mapId}/publish`; `/admin/maps/{mapId}/preview` plus authenticated `/api/maps/{mapId}/visitor-preview`; `/wu77-visitor-quality` plus `/api/public/wu77-visitor-quality`. Save currentversion/expectedVersion on every relevant write. For field-compatible rendering, add one normal `single_line_text` custom field 利用時間; standardhours is not the same fieldtype. A source-only concern about nested categories/customValues versus deferred schemaMapId setup should be tested in the isolated DB and reported if it fails; it is not yet a confirmed product Finding. Ordinary two-step Spot create→versionedPATCH can populate the fixture without disabling its guard.

## Candidate-only runtime values

| Setting | Planned value |
| --- | --- |
| NODE_ENV | production |
| HOST / NITRO_HOST | 127.0.0.1 |
| PORT / NITRO_PORT | 3014 |
| DEPLOYMENT_ENV / NUXT_DEPLOYMENT_ENVIRONMENT | qa |
| PUBLIC_BASE_URL / ADMIN_BASE_URL / NUXT_PUBLIC_PUBLIC_BASE_URL / NUXT_ADMIN_BASE_URL | http://127.0.0.1:3014 |
| NUXT_TRUSTED_HOSTS | 127.0.0.1:3014 |
| NUXT_TRUSTED_ORIGINS | http://127.0.0.1:3014 |
| NUXT_TRUST_PROXY | false |
| DATABASE_URL | Opaque fresh app-role URL to127.0.0.1:5433/wu77_fixture_20261005; never output |
| NUXT_UPLOAD_DIR | ownroot/uploads |
| PUBLIC_STORAGE_DRIVER / PUBLIC_STORAGE_ROOT | local / ownroot/public-snapshots |
| NUXT_SESSION_PASSWORD | fresh opaque value; never output |
| NUXT_SESSION_NAME | wu77-qa-session-9d2a1ec, conditional on runtime header verification |

No cookie-security override, protected environment import or Resend credential is part of this table. Signup/invitation/reset/mail delivery is outside this fixture sequence.

## Action approval and remaining conditions

Fresh DB, session key and test-onlyOWNER credentials create access only to newly authored synthetic data. They do not extend access to existing private/user data or change production permissions. Each mutation still goes through the normal action review with exact root/port/data boundaries; a rejection is a blocker to report, not permission to bypass. This document is not approval to expose the candidate publicly, reuse existing credentials, create a persistent system runner, change security gates or alter canonical data. Parent requested plan-stage preparation; no dependent mutation proceeds yet.

Windows functional work can use the approved light parallel slot. Mac browser/performance testing waits for the parent’s DTP/Calendar allocation. Independent competitive QA, physical device/AT coverage and actual-data restore remain separate acceptance conditions.

PostgreSQL command semantics checked against the official [17 initdb documentation](https://www.postgresql.org/docs/17/app-initdb.html) and [17 pg_ctl documentation](https://www.postgresql.org/docs/17/app-pg-ctl.html). The fresh cluster configuration and password-file approach follow these standard tools; no security setting on the existing cluster is involved.
