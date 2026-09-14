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
| WU-27 | KAN-66 | `6638d40` | `38be3d2` | `20260914050000_security_rate_limits` | 4 files / 20 tests PASS | 48 files / 330 tests PASS | PASS | validate + generate PASS | not required | npm advisory API unreachable | PASS |
| WU-28 | KAN-67 | `38be3d2` | `1b0fd3c` | none | 2 files / 9 tests PASS | 49 files / 334 tests PASS | PASS | validate PASS | PASS | Alert webhook pending; logs active | PASS |
| WU-29 | KAN-65 | `1b0fd3c` | `c607b5d` | none | 1 file / 3 tests PASS | 50 files / 337 tests PASS | PASS | validate PASS | not required | PostgreSQL restore drill pending (tools unavailable) | PASS |
| WU-30 | KAN-60 | `c607b5d` | `3529701` | `20260914060000_ja_en_translations` | 3 files / 20 tests PASS | 51 files / 343 tests PASS | PASS | validate + generate PASS | PASS | none | PASS |
| WU-31 | KAN-64 | `3529701` | `e63d79a` | `20260914070000_media_variants` | 3 files / 14 tests PASS | 52 files / 347 tests PASS | PASS | validate + generate PASS | phase boundary pending | none | PASS |
| WU-32 | KAN-57 | `e63d79a` | `6d383b0` | `20260914080000_public_releases` | 3 files / 16 tests PASS | 53 files / 353 tests PASS | PASS | validate + generate PASS | PASS | Cloudflare R2 credentials pending; local adapter PASS | PASS |
| WU-33 | KAN-55 | `6d383b0` | `d05583a` | `20260914090000_public_analytics` | 3 files / 17 tests PASS | 54 files / 359 tests PASS | PASS | validate + generate PASS | not required | none | PASS |
| WU-34 | KAN-62 | `d05583a` | `50ca8b7` | `20260914100000_map_seo` | 4 files / 24 tests PASS | 55 files / 364 tests PASS | PASS | validate + generate PASS | not required | none | PASS |
| WU-35 | KAN-63 | `50ca8b7` | `c051963` | none | 3 files / 15 tests PASS | 56 files / 368 tests PASS | PASS | validate PASS | not required | Legal review pending | PASS |
| WU-36 | KAN-61 | `c051963` | this WU commit | none | 2 files / 21 tests PASS | 57 files / 373 tests PASS | PASS | validate PASS | PASS | none | PASS |

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
- `pnpm audit --prod` could not reach the npm advisory API (`ENOTFOUND`); dependency audit is external verification pending, with no unsafe upgrade attempted.

## WU-28 notes

- `/api/health` is DB-independent; `/api/ready` checks PostgreSQL and production mail readiness without exposing versions or secrets.
- Safe incoming request IDs are preserved and invalid/missing IDs are replaced with UUIDs and returned in `X-Request-Id`.
- Production logs are structured JSON and recursively sanitized. Major server failures flow through one Nitro hook.
- The optional operations webhook sends sanitized summaries and deduplicates repeated alert fingerprints for five minutes. No webhook is configured here, so log-only observability is active.

## WU-29 notes

- DB backup uses `pg_dump -Fc` with timestamp, commit SHA, PostgreSQL version, and SHA-256 sidecar metadata; restore requires an explicitly approved disposable target and refuses `DATABASE_URL` equality.
- Managed media is archived with a sorted relative-path/size/SHA-256 manifest and archive checksum; restore verifies both archive and extracted files.
- Retention is centralized at 7 daily / 4 weekly, marker-root constrained, filename constrained, and dry-run by default. PowerShell wrappers and an operator runbook are included.
- This host has no `pg_dump`, `pg_restore`, `psql`, or Docker server. The disposable PostgreSQL restore drill is external verification pending; no QA/shared database was accessed.

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
