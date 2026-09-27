# Regression gates

Base: `8980521550625e724fcc0b2bda9c46d93eeb0023`.

| Gate | Result |
|---|---|
| Nuxt typecheck | PASS, zero errors |
| Full Vitest suite | PASS, 89 files passed, 3 skipped; 610 tests passed, 16 skipped |
| Nuxt production build | PASS after temporary QA-only config was removed |
| Prisma validate | PASS |
| Whitespace check | PASS with `git -c core.whitespace=-blank-at-eof diff --cached --check`; the unchanged copied audit file `08-FINDINGS.md` has a pre-existing blank line at EOF |
| Read-only Paper Map Easy Builder audit on disposable database | PASS; one parsed config, zero invalid/orphans |
| Read-only IMAGE spatial audit on disposable database | PASS; zero unresolved exceptions |
| Read-only tenant data foundation audit on disposable database | PASS; zero anomalies |

The existing Georeference source assertion was updated for the clearer local-clear wording. No schema, migration, API, auth, publication-state, coordinate, or storage-format change was made. The full test suite includes existing PIN Editor, Spot CRUD, Paper preview/PDF, publication/revision, CSV, RBAC and navigation coverage; browser checks were additive.
