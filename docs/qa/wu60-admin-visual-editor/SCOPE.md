# WU-60 scope and baseline

Date: 2026-09-28. WU-59 PR #9 merged with a merge commit, `5687ce4b35fbc40c61d4c63041e506f2dce03d3f`, at 2026-09-27T22:40:04Z. Post-merge GitHub Verify run `36356077075` passed on that exact SHA. WU-60 branch `refactor/wu60-admin-visual-editor-contract-20260928` was created from the same SHA.

Implementation: Paper Map Edit preview/inspector layout and Decoration geometry draft. The existing WU-52 source assertion was updated because pointer-up persistence is superseded by the frozen WU-60 contract. PIN Editor, Paper Map New, and Georeference were browser regression references only.

No Prisma model, migration, persisted entity, coordinate format, Paper API, or Decoration API changed. The Decoration PATCH endpoint already accepts partial geometry or order payloads. Production and `main` were untouched.

No shared Visual Editor shell was introduced. PIN and Paper share a desktop direction, but their header and action geometry differ; Paper has variable paper orientation, page navigation and short-viewport fallback. Decoration has no sticky canvas. A common shell would hide these distinctions without removing meaningful code.
