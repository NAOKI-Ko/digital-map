# Windows QA — pending Verify gate

Existing QA host: chiffonchan, C:\DigitalMap, HTTP port 3011. Deployed baseline SHA 4a90be0186666a0e2007029da85e5a0846539e2a. No WU-68 activation performed. Production unchanged.

Read-only baseline public API and 390px screenshot captured. Aquarium release has five floors with Spot counts 11/4/6/9/7, all normal. Public URL in the runtime pointer was stale; temporary SSH forwarding to the existing QA HTTP endpoint allowed baseline inspection without changing host configuration.

Backups verified under C:\DigitalMap\backups\wu68-public-viewer-20261002:
- db/digital-map-20261002T012120Z.dump
- media/20261002T012121Z
- public/20261002T012123Z

Preservation audit: 90 Spots, 20 Categories, 9 Maps, plus Floors, links, release pointers, public assets and content hashes. Canonical digest 494a33cd37570332e68565514725580324af7cff98233e82ca2bd57638565bde. Backup verification PASS. No QA schema migration, publication, snapshot or coordinate edits.

Exact merged-SHA deployment and after screenshot are pending: PR Verify fails on an unpatched node-forge high advisory (GHSA-86w9-cpqp-85rv). The audit gate has not been bypassed. Merge and post-merge Verify have not occurred. Authenticated LIVE browser parity also needs explicit approval of the existing QA credential source.

Resume order: resolve security disposition → PR Verify PASS → merge dev → post-merge Verify PASS → prepare exact dev SHA on Windows with disposable test DB → backup/data equivalence guard → activate with automatic rollback → public and authenticated responsive QA → all-20 acceptance. Never deploy main/Production.

## 68-09 QA tunnel lifecycle repair (app activation still gated)

QA scripts were backed up underC:\DigitalMap\backups\wu68-qa-tunnel-origin-20261002. run-app now loads the generated QA origin overlay; run/start tunnel synchronize only the current process's URL announcement with a named mutex. Real rotation wide-maybe-votes-neighbors → reaches-see-permissions-comparable updated public-url.txt and effective Nuxt Public/Admin origin. External arimatsu-fon HTTP200, HTML contains only current origin. Repeated synchronization retains PID26100. Windows app remains4a90be0186666a0e2007029da85e5a0846539e2a:neither3853307 Map-only code nor PR27 was deployed. This is an explicitly requested QA configuration repair, not an exact-SHA PR activation. Protected secrets, DB/media/publication and Production unchanged. New URL:https://reaches-see-permissions-comparable.trycloudflare.com/arimatsu-fon.
