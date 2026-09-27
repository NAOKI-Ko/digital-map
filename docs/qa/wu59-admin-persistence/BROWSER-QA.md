# Fresh authenticated browser QA

Environment: Nuxt dev server on `localhost:33159`, dedicated `digital_map_wu59_qa` PostgreSQL database, repository seed data, QA-only admin, QA-only Paper Map and assigned Spot Editor fixture. Tested 2026-09-28 in the Codex in-app browser. The temporary Vite filesystem allowance used for symlinked local dependencies was removed before final build; it is not part of this change.

| Route | 1440 | 1024 | 390 | Interaction evidence |
|---|---|---|---|---|
| Georeference | Pass | Pass | Pass | Local clear, leave guard, discard-to-saved |
| Settings | Pass | Pass | Pass | Clean disabled Save, dirty guard, hash switch, success and clean state |
| Organization | Pass | Pass | Pass | Profile dirty guard, success and clean state |
| Fields | Pass | Pass | Pass | New draft Cancel/reset and successful add |
| Spot Detail | Pass | Pass | Pass | Core clean/dirty, Cancel, successful Save, clean state; published QA spot command announced result |
| Categories | Pass | Pass | Pass | Item clean/dirty, Cancel/reopen saved content |
| Assigned Spot Editor | Pass | Pass | Pass | Revision dirty guard, successful Save, clean state, failed Save retains draft |
| Paper Edit | Pass | Pass | Pass | Clean/dirty Save, discard-to-saved, successful Save |
| PIN Editor | Pass | Pass | Pass | Candidate edit, target switch guard, design Save success |

Each route rendered its expected heading at all three widths with no page alert or document-level horizontal overflow. No P0/P1 issue was observed. The one spot published for Paper fixture preparation remained in the isolated QA database; no production or shared state changed.

The Paper New selection preview required a published and placed fixture spot. It was created in the disposable database, then the Paper Edit route was tested. The assigned Spot Editor route required a disposable assignment row; no access checks were altered. The invalid revision request was used to verify error feedback and input retention without changing the saved revision.

Targeted behavior beyond these cases, including every destructive command and real external geocoder response, was not exercised. Existing unit coverage and the read-only data audits cover the unchanged command and geometry paths.
