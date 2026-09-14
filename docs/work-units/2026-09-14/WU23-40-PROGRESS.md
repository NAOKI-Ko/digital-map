# WU-23〜WU-40 実装進捗

- Baseline: `3f373e6ae576b06fe386af544834b8fb7dc989b7`
- Branch: `feat/wu23-40-phase15-full-20260914`
- Worktree: `/Users/naoki/Documents/Codex/2026-09-14/digital-map-wu-23-through-wu/work/digital-map`
- Browser / Human UAT: WU-40 まで意図的に保留

| WU | Jira | Start SHA | Commit SHA | Schema / migration | Focused tests | Full tests | Typecheck | Prisma | Build | External | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WU-23 | KAN-56 | `3f373e6` | `6ab5eb3` | `20260914010000_auth_lifecycle` | 2 files / 12 tests PASS | 44 files / 312 tests PASS | PASS | validate + generate PASS | phase boundary pending | Email delivery deferred to WU-26 | PASS |
| WU-24 | KAN-53 | `6ab5eb3` | `1db0dc0` | `20260914020000_spot_editor_revisions` | 4 files / 19 tests PASS | 45 files / 317 tests PASS | PASS | validate + generate PASS | PASS | Email delivery deferred to WU-26 | PASS |
| WU-25 | KAN-54 | `1db0dc0` | `b6e72d3` | `20260914030000_audit_events` | 3 files / 14 tests PASS | 46 files / 321 tests PASS | PASS | validate + generate PASS | not required | none | PASS |
| WU-26 | KAN-69 | `b6e72d3` | `6638d40` | `20260914040000_mail_delivery` | 3 files / 11 tests PASS | 47 files / 325 tests PASS | PASS | validate + generate PASS | PASS | Resend credentials pending; fake provider PASS | PASS |
| WU-27 | KAN-66 | `6638d40` | `38be3d2` | `20260914050000_security_rate_limits` | 4 files / 20 tests PASS | 48 files / 330 tests PASS | PASS | validate + generate PASS | not required | Final audit: 0 Critical/Moderate/Low; 1 High Prisma transitive risk recorded | PASS |
| WU-28 | KAN-67 | `38be3d2` | `1b0fd3c` | none | 2 files / 9 tests PASS | 49 files / 334 tests PASS | PASS | validate PASS | PASS | Alert webhook pending; logs active | PASS |
| WU-29 | KAN-65 | `1b0fd3c` | `c607b5d` | none | 1 file / 3 tests PASS | 50 files / 337 tests PASS | PASS | validate PASS | not required | Disposable DB backup/upgrade and Windows QA DB+Media backup verified | PASS |
| WU-30 | KAN-60 | `c607b5d` | `3529701` | `20260914060000_ja_en_translations` | 3 files / 20 tests PASS | 51 files / 343 tests PASS | PASS | validate + generate PASS | PASS | none | PASS |
| WU-31 | KAN-64 | `3529701` | `e63d79a` | `20260914070000_media_variants` | 3 files / 14 tests PASS | 52 files / 347 tests PASS | PASS | validate + generate PASS | phase boundary pending | none | PASS |
| WU-32 | KAN-57 | `e63d79a` | `6d383b0` | `20260914080000_public_releases` | 3 files / 16 tests PASS | 53 files / 353 tests PASS | PASS | validate + generate PASS | PASS | Cloudflare R2 credentials pending; local adapter PASS | PASS |
| WU-33 | KAN-55 | `6d383b0` | `d05583a` | `20260914090000_public_analytics` | 3 files / 17 tests PASS | 54 files / 359 tests PASS | PASS | validate + generate PASS | not required | none | PASS |
| WU-34 | KAN-62 | `d05583a` | `50ca8b7` | `20260914100000_map_seo` | 4 files / 24 tests PASS | 55 files / 364 tests PASS | PASS | validate + generate PASS | not required | none | PASS |
| WU-35 | KAN-63 | `50ca8b7` | `c051963` | none | 3 files / 15 tests PASS | 56 files / 368 tests PASS | PASS | validate PASS | not required | Legal review pending | PASS |
| WU-36 | KAN-61 | `c051963` | `9542996` | none | 2 files / 21 tests PASS | 57 files / 373 tests PASS | PASS | validate PASS | PASS | none | PASS |
| WU-37 | KAN-59 | `9542996` | `7964dfb` | none | 2 files / 14 tests PASS | 58 files / 381 tests PASS | PASS | validate PASS | PASS | none | PASS |
| WU-38 | KAN-70 | `7964dfb` | `8632d39` | `20260914110000_self_service_onboarding` | 7 files / 33 tests PASS | 59 files / 388 tests PASS | PASS | validate + generate PASS | PASS | Live verification email pending; fake provider path PASS | PASS |
| WU-39 | KAN-68 | `8632d39` | `8772e06` | none | 7 files / 35 tests PASS | 60 files / 393 tests PASS | PASS | validate PASS | PASS | Domain/DNS/TLS activation pending | PASS |
| WU-40 | KAN-58 | `8772e06` | `14f292e` + Stage A docs | none | final Snapshot/PDF 2 files / 15 tests PASS | local 61 files / 397 tests PASS; Windows 61 / 396 PASS before final focused fix | PASS local + Windows | validate + generate PASS; QA 28/28 migrations | PASS local + Windows | Resend/R2/production domain pending; QA adapters PASS | READY FOR HUMAN UAT |

## WU-23 notes

- Invitation and reset raw tokens are issued once, while only SHA-256 hashes are stored.
- Organization invitation acceptance derives `tenantId` from the invitation row and creates only `MEMBER` membership.
- `User.authVersion` is the authoritative stale-session invalidation mechanism; active-user and live membership checks remain server-side.
- npm registry DNS was unavailable in the sandbox. Validation used the already-verified dependency tree from the baseline worktree without modifying `pnpm-lock.yaml`.

## WU-24 notes

- Spot Editor is represented only by `SpotEditorAssignment`; no Tenant role was added.
- A partial unique PostgreSQL index enforces at most one `PENDING` revision per Spot.
- Revision media uses real `MediaAsset` references, and approval applies only the fixed editable field set after checking `baseVersion` against `Spot.liveVersion`.
- Public endpoints remain backed by live Spot relations and never query `SpotRevision`, so pending content remains isolated.

## WU-25 notes

- `AuditEvent` is tenant indexed and database-trigger protected against update/delete.
- The centralized writer recursively strips secret/token/password/header/body/hash metadata keys.
- Membership, Map role, invitation, Spot Editor, revision, publication, and high-impact deletion events are inserted inside the protected mutation transaction where practical.
- Audit reads are Owner-only, tenant constrained, newest first, and cursor paginated; no mutation route exists.

## WU-26 notes

- Production provider is Resend via HTTPS with stable delivery-id idempotency; transient 429/5xx/network errors retry at most three times.
- `MailDelivery` stores only purpose, normalized recipient, provider id, status, attempts, timestamps, and sanitized error category.
- Raw links exist only in the transient provider message. Production responses do not return raw links; local/QA fake mode may show the one-time URL at issuance.
- `RESEND_API_KEY` and `MAIL_FROM` are not available in this environment, so live delivery is **EXTERNAL ACTIVATION PENDING**; fake-provider delivery is verified.

## WU-27 notes

- Login failures, password-reset requests, and invite acceptance use centralized PostgreSQL-backed, irreversibly keyed fixed-window limits.
- Authenticated cookie mutations enforce a centralized trusted-Origin policy; invite/reset token endpoints remain exempt from cookie CSRF handling.
- Session cookies are bounded, HttpOnly, SameSite=Lax, and Secure in production; CSP, nosniff, referrer, frame, permissions, and HTTPS-only HSTS headers are set centrally.
- Uploads retain the existing 10 MiB limit, verify PNG/JPEG signatures and dimensions, use random storage keys, sanitize original names, and retain tenant authorization.
- The final `pnpm audit --prod` has zero Critical/Moderate/Low advisories. One High advisory remains in Prisma config's transitive `deepmerge-ts`; the available change requires an unsafe major override and was deliberately not forced.

## WU-28 notes

- `/api/health` is DB-independent; `/api/ready` checks PostgreSQL and production mail readiness without exposing versions or secrets.
- Safe incoming request IDs are preserved and invalid/missing IDs are replaced with UUIDs and returned in `X-Request-Id`.
- Production logs are structured JSON and recursively sanitized. Major server failures flow through one Nitro hook.
- The optional operations webhook sends sanitized summaries and deduplicates repeated alert fingerprints for five minutes. No webhook is configured here, so log-only observability is active.

## WU-29 notes

- DB backup uses `pg_dump -Fc` with timestamp, commit SHA, PostgreSQL version, and SHA-256 sidecar metadata; restore requires an explicitly approved disposable target and refuses `DATABASE_URL` equality.
- Managed media is archived with a sorted relative-path/size/SHA-256 manifest and archive checksum; restore verifies both archive and extracted files.
- Retention is centralized at 7 daily / 4 weekly, marker-root constrained, filename constrained, and dry-run by default. PowerShell wrappers and an operator runbook are included.
- Stage A verified the command set against disposable PostgreSQL for fresh and baseline-upgrade paths. Windows QA DB and five-file Media backup/checksums were verified before its isolated QA migration; no shared/production database was used.

## WU-30 notes

- Existing Map/Spot/Category/field base columns remain the canonical Japanese values. Optional `en` relations are uniquely keyed and always fall back to Japanese.
- Public URLs remain unchanged; `?lang=en` selects English only when enabled, and the public UI exposes a locale selector with an English browser-language suggestion that never overrides an explicit query.
- Only text custom-field values are translatable. Phone, URL, number, and boolean values stay locale-independent.
- CSV remains backward compatible; English-enabled Maps add stable `[en]` columns keyed by semantic key or immutable custom-field ID, while unsupported locale suffixes are rejected.

## WU-31 notes

- Managed originals retain verified MIME, intrinsic dimensions, size, and SHA-256. Sharp creates idempotent WebP `thumb`/`display`/`large`/`xlarge` variants only when the target does not upscale the source.
- Transparent images use lossless WebP; photographic images use quality 82. A processing failure leaves the original valid and records only the sanitized `VARIANT_GENERATION_FAILED` state.
- `media:backfill` fills missing variants without replacing originals. Consumers select a smallest-sufficient variant, while Floor imagery prefers xlarge/large and falls back to the original.
- `media:gc` is dry-run by default; `--delete` is explicit, the grace period defaults to seven days, paths are basename constrained, and every live relation including pending revision media protects an asset.

## WU-32 notes

- Publish builds a repeatable-read, public-only ja/en Snapshot, copies referenced optimized bytes into a release-specific content-hash path, writes an immutable manifest, marks the release READY, and only then advances `current.json` and the DB current-release relation.
- Pointer/DB divergence uses deterministic restoration of the previous pointer and emits a sanitized operations failure. A failed build marks only the new release FAILED and never changes the prior public release.
- Public rendering reads object storage only and has no normal Prisma/live-DB fallback. READY releases are immutable and retained for authorized OWNER/Map EDITOR rollback.
- Local filesystem storage and Cloudflare R2/S3-compatible storage share the same release semantics. R2 credentials are unavailable here, so R2 activation is **EXTERNAL ACTIVATION PENDING**; the local adapter, cache policies, and copied-asset independence are verified.

## WU-33 notes

- The public client emits only `MAP_VIEW` and `SPOT_VIEW` asynchronously. Map views are deduplicated in sessionStorage per Map/release; intentional Spot opens may count repeatedly, and admin preview contains no instrumentation.
- Events remain in a process-local UTC daily aggregate buffer and flush every 30 seconds or at threshold. Abrupt process loss may lose a small number of non-critical events; JST is the dashboard display policy.
- Flush validates published Map and Map–Spot relationships in batches, then uses atomic aggregate upserts. Raw event rows, IP addresses, cookies, fingerprints, and persistent visitor identifiers are not stored.
- Analytics uses the WU-27 irreversible rate-key framework with a higher public threshold and obvious-bot filtering. OWNER and assigned Map EDITOR reads remain tenant/Map constrained.

## WU-34 notes

- Authorized OWNER/Map EDITOR may set optional SEO title, description, and a same-Tenant representative MediaAsset. Empty settings fall back to the localized Snapshot Map name/description and available public imagery.
- Public title, description, canonical, Open Graph, X card, locale, and hreflang values are computed exclusively from the current Snapshot payload plus configured public origin; no per-view admin DB query exists.
- Japanese retains the path-only canonical, English uses `?lang=en`, and `x-default` points to Japanese. Missing/unpublished Snapshot responses are noindex.
- Sitemap output is cached, includes only published Maps with a current release, and carries locale alternates. Robots exposes the sitemap and excludes admin/API crawling.

## WU-35 notes

- Terms and Privacy are stable `/terms` and `/privacy` routes backed by replaceable, versioned repository content instead of wording duplicated in Vue templates.
- Both expose version `2026-09-14-v1`, effective date `2026-09-14`, and an environment-configured contact point. Public Map and login surfaces link to both routes.
- Privacy describes only implemented behavior: account/organization data, hash-only auth lifecycle tokens, transactional email, sanitized operational logs, aggregate Map/Spot analytics, session cookies, uploaded media, immutable releases, retention, and backups.
- The wording is explicitly a product/legal draft. Formal legal approval remains external review and does not block implementation PASS.

## WU-36 notes

- Every published Spot is reachable through a keyboard and screen-reader-friendly list alternative, while DOM Map markers remain native buttons that support Enter/Space activation.
- Floor tabs use roving focus and Arrow/Home/End keyboard navigation. The Spot detail dialog traps focus, closes with Escape, and restores focus to the invoking marker or list entry.
- Icon controls expose accessible names, decoration remains assistive-technology hidden, and a global visible focus treatment covers keyboard-operable public controls.
- Automated axe checks cover the public initial/category/list state, Spot dialog, legal page, and login form with no critical/serious violations. A deterministic palette audit separately verifies major text/control contrast at WCAG AA thresholds.

## WU-37 notes

- Authorized OWNER/assigned Map EDITOR export uses the current immutable public Snapshot when published. A never-published Map uses the live preview source with a visible `未公開プレビュー` label and no QR.
- A4/A3 portrait/landscape pages use 300-DPI Sharp composition and pdf-lib without a GUI browser dependency. Multi-floor export creates one or more pages per Floor, and long Spot legends flow onto continuation pages.
- Every Floor page contains the background, Decorations, deterministic numbered PINs, Spot/Category legend, title, organization identity/logo when configured, and a fixed-URL QR for published Maps.
- A generated two-page A4 landscape sample was parsed with Poppler/pdf-lib and rendered to PNG for visual inspection; margins, legend, markers, and QR were unclipped and legible.

## WU-38 notes

- Unauthenticated registration stores a normalized-email `SignupIntent`, bcrypt password state, organization name, current legal versions, and a 24-hour hash-only single-use verification token. It creates no Tenant before verification.
- New-account verification atomically creates the User, SETUP Tenant, OWNER membership, legal acceptance, and completed intent, then establishes a session and routes into the existing Map setup flow. Creating the first Map advances the Tenant to ACTIVE without publishing it.
- An existing account is never duplicated or password-overwritten. Email verification requires normal login before an explicitly reconfirmed legal acceptance can atomically create another OWNER Tenant.
- Signup and resend use PostgreSQL-backed email+IP rate limits and generic acceptance responses. Existing organization invitations are neither queried nor consumed, so a later invitation acceptance remains independent.

## WU-39 notes

- `PUBLIC_BASE_URL` is authoritative for public Map links, PDF QR, canonical/OGP, sitemap, and public locale metadata. `ADMIN_BASE_URL` is authoritative for invitation, reset, and signup-verification links.
- Production startup rejects non-HTTPS, localhost, credential-bearing, and `*.trycloudflare.com` base URLs. Local/QA may still explicitly use localhost or the existing QA Quick Tunnel.
- Production requests enforce the configured public/admin host allowlist, honor forwarded host/protocol only with `TRUST_PROXY=true`, redirect external HTTP to HTTPS, retain Secure cookies, and emit HSTS only for effective HTTPS.
- Credential-free Cloudflare named Tunnel configuration and DNS/TLS/Windows service steps are documented. No domain, DNS record, Tunnel, or credential was created, so **DOMAIN/DNS/TLS ACTIVATION PENDING**.

## WU-40 Stage A notes

- Disposable PostgreSQL 17 verified all 28 migrations from empty and the exact baseline's 17 migrations followed by WU-23〜WU-39. Representative Tenant/OWNER/User/Map/Floor/Spot data, normalized coordinates, and existing-user email-verification backfill were preserved.
- Production dependency audit initially found two Critical advisories. MapLibre, Nuxt DevTools, and Nuxt were upgraded to patched releases; existing semver ranges were refreshed and mysql2 was pinned to a safe same-major release. Final audit has zero Critical/Moderate/Low and one High in Prisma config's `deepmerge-ts`; its fix requires an unsafe major override and is recorded rather than forced.
- The complete Human UAT checklist is `docs/qa/WU23-40-HUMAN-UAT-20260914.md`. Human UAT remains pending and main has not been merged.
- Windows preflight found the original PowerShell wrapper delegated DB backup/restore to bash. The release gate replaced this with cross-platform Node commands that keep passwords out of arguments/output and retain the explicit disposable-restore guard.
- Windows backup is retained at `C:\DigitalMap\backups\wu23-40-b2581f3`: custom-format DB dump plus metadata/checksum and a five-file Media archive/manifest/checksum. Rollback is restore DB/Media, restore the pre-WU QA environment file, and repoint to the prior release `3d4ee73749c0ae23f5cacebd9c752d55b337adc3`.
- The mandatory Windows IMAGE audit passed before and after migration with zero invalid dimensions/references, partial coordinates, or out-of-range positions. All 12 pending migrations applied in order; QA now reports 28/28 migrations and preserved 1 User, 1 Tenant, 1 OWNER membership, 3 Maps, 3 Floors, and 10 Spots.
- Windows ran the full suite at 61 files / 396 tests, typecheck, and production build on `d24b01f`; final SHA `14f292e` then passed focused Snapshot/PDF tests (2 files / 15 tests), typecheck, and production build. The final local consolidated gate is 61 files / 397 tests plus Prisma validate/generate and production build.
- QA smoke passes local/public health and readiness (`mail=fake`), admin login, OWNER Map access, immutable Snapshot publish, public API/page, static assets, 2,046,784-byte PDF generation, Terms, Privacy, request-ID propagation, and unauthenticated 401. The current process has zero request errors.
- Windows QA runs `14f292e0c5432a3814f83e26bf52ff73faacb930` at `https://sur-context-basin-concert.trycloudflare.com`. Resend, Cloudflare R2, and production Domain/DNS/TLS remain **EXTERNAL ACTIVATION PENDING**. Human UAT is **PENDING HUMAN EXECUTION**.

## WU-40 Stage B notes

- Codex Full AI-UAT ran against Windows QA for both WU-23〜WU-39 integration integrity and whole-product/Phase 1 regression. OWNER, Map EDITOR, Spot Editor, anonymous desktop/mobile, all seven mandatory cross-feature scenarios, exploratory, visual, accessibility, and security/RBAC gates passed.
- Ten deterministic defects found during Stage B were fixed in focused commits and rerun on Windows. Final open counts are P0 0, P1 0, core P2 0; one accepted cosmetic P3 is recorded in the AI-UAT report.
- Final code SHA `57aec7cc7ce8486038e92fcad306166b9e8780fa` passed local and Windows full suites at 62 files / 405 tests, typecheck, Prisma validate/generate, production build, and 28/28 migration status. Windows health and readiness pass with database=true and mail=fake.
- The former local/Windows test-count discrepancy was caused by different tested SHAs, not a platform skip. Same-SHA final counts are exactly 405/405.
- Evidence and full results are in `docs/qa/WU23-40-CODEX-AI-UAT-20260914.md` and `docs/qa/evidence/wu40-stageb/`. Stage B verdict is **READY FOR HUMAN UAT**; Human UAT remains **PENDING HUMAN EXECUTION**, WU-40 remains incomplete, and main is not merged.

## WU-41 / KAN-71 release-in notes

- Final code SHA `9245b4d77ddfb3ce828fc73cab2c6cc6b1f8ef59` adds one-Floor v2 round-trip CSV export, stable Spot identity, schema/row concurrency tokens, field-level preview, mixed CREATE/UPDATE, serializable atomic apply, bounded audit, reversible spreadsheet-formula protection, and preserves v1 create-only behavior.
- Local and Windows gates match at focused 1 file / 16 tests and full 62 files / 413 tests; typecheck, Prisma validate/generate, production build, 28/28 migration status, health, and readiness pass. No migration was added.
- Windows OWNER round-trip/conflict/Snapshot/SpotRevision, assigned/unassigned Map EDITOR, Spot Editor, cross-Tenant, public ja/en, and 390 x 844 responsive browser checks pass. Current QA code deployment is `9245b4d...`; rollback backup and old releases remain preserved.
- WU-41 open defects are P0 0 / P1 0 / core P2 0 / P3 0. Human UAT remains **PENDING HUMAN EXECUTION** but may resume against the WU-41 SHA. Main has not been merged and Production has not been deployed.
