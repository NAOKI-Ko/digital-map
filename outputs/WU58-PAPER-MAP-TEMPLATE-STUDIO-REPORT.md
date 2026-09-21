# WU-58 Paper Map Template Studio v2 report

## Verdict

NEEDS-DECISION — implementation, actual-data targets, authenticated browser QA, PostgreSQL migration/audits, unit/type/build and dependency security checks are complete locally. Clean-clone validation, GitHub Actions, commit/PR and `dev` merge are still required before PASS-READY.

## Git state

- Base SHA: `733707439ce3152ec0a7077df5c7d78874ff7be8`
- Branch: `feature/wu58-paper-map-template-studio-v2-20260922`
- Implementation SHA: `402e8b3687ee0b6f26907619c5ec42317f24dc53`
- Evidence SHA: `3f6d765c693a163240c499d4b695550130d8dddc`
- PR/dev merge SHA: pending remote verification
- `main` and Production: unchanged

## Delivered

- Stable catalog: `map-classic@1`, `spot-guide@1`, `photo-story@1`.
- Actual Arimatsu source-only PNG/PDF targets and source inventory. Photo Story uses an honest no-photo text-card fallback.
- Bounded config v2, centralized v1 migration, exact template resolution, deterministic suitability.
- Fixed slot contract with hide/show retention, Paper Original, per-Spot Paper Override and reset-to-source.
- Safe template switching that retains content, overrides, selection, order and viewport.
- Template-first creation, clickable Preview slots, UiSelect controls and visual/keyboard viewport adjustment without raw x/y/width/height fields.
- Shared Preview/PDF render model, source-coordinate pins/decorations, deterministic clipping, photo/logo omission, QR and overflow pages.
- Write-time Map reference validation, stale-read warnings and extended config/template audit.

## Verification

- Unit tests with disposable PostgreSQL: 589 passed.
- Typecheck: PASS.
- Production build: PASS (pre-existing chunk-size warnings only).
- All 31 migrations and tenant/image/paper-map/default-field audits: PASS on a disposable database; canonical data unchanged.
- Authenticated browser matrix: PASS at 1440×900, 1280×800, 1024×768, 390×844 and 430×932 with no final console warnings/errors.
- Production dependency audit at high severity: PASS (no known vulnerabilities).
- Target visual inspection: PASS after overlap and empty-photo-frame corrections.
- Clean clone and GitHub Actions status is recorded after the local evidence commit.

## Open defects / limits

- The in-app browser could not capture the programmatic Blob download event; PDF renderer/API tests and inspected PDF targets pass.
- Destructive delete confirmation was not exercised through browser automation; duplicate/delete API coverage passes.
- Canonical baseline has no approved Spot photos or normalized/public Spot positions, so source-only targets intentionally omit pins and demonstrate photo fallback.
- No Windows or Production deployment was attempted.
