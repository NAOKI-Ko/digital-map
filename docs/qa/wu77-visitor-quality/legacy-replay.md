# WU-77 true legacy UI replay

2026-10-05. This records a replay entrypoint for independent QA, not Quality Acceptance.

- Legacy source: `d35f39eaa17f8412684bf5c00e8444c0d1fdd2cb`. This is the existing9403d32 product UI plus fixed synthetic fixture/harnessf8615de and same-artwork PNG repaird35f39e, before the facility/visitor featuref27a16a.
- Old UI: `http://127.0.0.1:3015/__qa_wu77_visitor_baseline` on both Windows and the restored Mac forward; API `/api/public/__qa_wu77_visitor_baseline`.
- Current feature candidate: `http://127.0.0.1:58123/__qa_wu77_visitor`, physically served Windows3016 source `94ca6d75f30a6f5960d1e6df5d0dccab81547c0b`. Original9d2/3013 is historical. Candidate `_baseline` helpers share the new shell and cannot establish the old product's whole-UI before state.
- Windows legacy root: `C:\DigitalMap\incoming\wu77-baseline-20261005`. Started2026-10-05T13:22:36.9695939Z, ownerPowerShell26580, listenerNode27172, owned SSH foreground lifetime up to4h (approximately17:22UTC). Executor transport loss disconnected the original Mac forward. The restored owned SSHforward has PID78187/session45034, starts16:02UTC and expires17:20UTC. [Fresh source/serving observation](replay/windows-serving-restored-94ca6d7.json) confirms all1322 source hashes, owned process,24+12, PNG and Mac API/HTML reachability without restarting Windows. Recheck freshness before QA.

The [full source manifest](replay/legacy-source-manifest.json) records1322 old source paths/hashes. The old tree was reconstructed in a new owned root from the already verified9d2 archive, replacing21 modified files with their exact old bytes and removing24 candidate-only paths. Delta archive64,846bytes SHA256 `becae1234fa253a02c34b7af3e272dc3730e6be8d4a76eb3444dabd5e3d03619`. Full1322 hashes matched before and after frozen install/start. Install reused972 packages, downloaded0, finished54.6s. No source mismatch occurred.

[Windows runtime observation](replay/windows-legacy-runtime.json) records2floors24+12spots and zero `facility:*` IDs after the declared old-Material mapping. Original fixture JSON is unchanged. The existing preset mapping permits old UI to display the same synthetic facility intents; no source data is automatically reclassified. All normal fixture coordinates/content/backgrounds remain fixed.

Both3013 and3015 APIs returned200 with24+12spots through the Mac forwards. Actual UI/viewport/tasks/cold-versus-resize/camera reset must still be verified by the independent reviewer under the frozen benchmark. These endpoints are dev-only synthetic helpers; they never read/write a DB and are404 in production builds. Runtime DB points only to unreachableloopback1; the known synthetic dummy session setting creates no access to real data. No `.env` was generated, actual credentials/accounts/PG clusters/services were not created, and canonical data was not imported.

At the post-start observation, canonical3011 retainedPID19992/source9403d32 and candidate3013 retainedPID20300/source9d2a1ec. No canonical release pointer/DB/tunnel was changed. Stop only the owned legacy process tree after checking root/PID/port; do not operate other task processes. Candidate3013's original foreground lifetime remains approximately14:29UTC and must be coordinated if QA continues longer.

The first full legacy archive creation on Mac wrote91,812,230bytes in approximately3.5s near13:14UTC. This was disclosed to the parent as Calendar performance interference; subsequent transfer reused the Windows archive and sent only the small delta/manifest. Calendar pure ended before browser QA was authorized. This record is not a performance measurement.

## Persisted authoring preparation

The separate [dry-run operation plan](replay/persisted-authoring-plan.json) has SHA256 `57adc350ffd3fe18db5a634e67f8bf8bbcbbeefc60a7ae23bc800b255e537149`. A task-local generator passed syntax check and dry-run on existing Windows Node24.21.0, checking29 exact candidate source-contract hashes and fixed fixture/artwork hashes. It describes268 normal API operations with unresolved generated-ID/version/media bindings, two floors, four categories,36Spots and three PNG uploads. The generator never executes HTTP/DB/credential work and rejects execute mode. Its independent static-review P2 DB-name mismatch was corrected to the established `wu77_fixture_20261005`; remaining static findings are zero.

This is concrete preparation, not runtime authentication, actual API validation, publication proof or QA PASS. Fresh credentials/account/PG/session runtime remain uncreated pending the parent's action-time approval. Secure cookie/name/transport, real generated UUID/media hashes and actual-data restore remain OPEN under the [persisted fixture plan](persisted-fixture-plan.md).
