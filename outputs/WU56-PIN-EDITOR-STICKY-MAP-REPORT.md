# WU-56 — PIN Editor Sticky Map report

## Verdict

`PASS-READY` for integration to `dev` after the evidence commit's required Verify check.

## Source control

- Base SHA: `e6b603bd4ae457db54b66df85da99aae9e7c35d2`
- Branch: `feature/wu56-pin-editor-sticky-map-20260921`
- Implementation SHA: `ec7bdfa6070b5d15fac2c14fe964d915a05738e3`
- PR: `https://github.com/NAOKI-Ko/digital-map/pull/3`

## Exact implementation

The left Map section in the PIN editor now uses:

```text
lg:sticky lg:top-6 lg:self-start
```

Only that section is sticky. The toolbar, title, helper text, breadcrumbs, workspace, and Inspector remain normal-flow. Map height remains `min(68vh, 46rem)`. No JavaScript scroll handler, fixed positioning, DOM reparenting, API change, Prisma change, migration, or dependency change was introduced.

## Automated verification

- Focused sticky and existing editor tests: PASS.
- Full isolated PostgreSQL suite: 87 files / 575 tests PASS, zero skipped.
- `pnpm typecheck`: PASS.
- `pnpm build`: PASS.
- Prisma validate/generate: PASS.
- Tenant, IMAGE spatial, and default Spot Field audits: PASS on a fresh isolated audit DB.
- Production dependency audit: no known vulnerabilities.
- Clean clone frozen install/test/typecheck/build: PASS at the implementation SHA.
- Initial GitHub Actions runs `35585720831` and `35585764995`: PASS.

## Browser QA

- Desktop: 1280×800, 1440×900, 1024×768 PASS.
- Mobile: 390×844, 430×932 PASS; Map is non-sticky and sequential.
- PIN design live updates remained visible during Inspector scroll.
- Sidebar expand/collapse preserved the PIN's 50% relative alignment.
- Candidate position cancel restored the exact original marker rectangle.
- Horizontal overflow: none.
- Browser console errors: none.

## Platform and deployment

- Windows QA: not executed; not required for this CSS/Admin-only WU, and no platform-specific regression was found locally.
- `main`: unchanged.
- Production: unchanged and not accessed.

## Open defects

P0: 0  
P1: 0  
Core P2: 0

