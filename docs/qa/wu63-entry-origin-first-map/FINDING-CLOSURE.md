# Finding closure

| Finding | Root cause | Implementation | Test | Windows evidence | Status |
|---|---|---|---|---|---|
| AQUA-001 | `/` had no application entry | Guest Login/Signup, authenticated Dashboard action | Local and Windows browser links PASS | Fresh Windows journey from homepage to new Workspace PASS | CLOSED |
| AQUA-002 | Declared Admin origin was not effective in built app | Admin helper + QA/prod origin gate + runtime override deployment contract | Unit and fake-mail signup/verify PASS | Effective Windows Admin origin, live verification/resend/reset links PASS | CLOSED |
| AQUA-003 | Stale implicit map-list cache blocked sidebar after create | Explicit shared key and mutation refresh; route-ID match | Disposable no-reload browser PASS | Windows first Map showed all four destinations immediately PASS | CLOSED |
| AQUA-004 | Declared Public origin differed from browser payload after tunnel rotation | Single public origin for link/QR/SEO + QA/prod startup gate | Unit/build payload PASS | Windows effective origin, displayed URL, copy success, QR generated and visitor URL opened; QR pixels not independently decoded | CLOSED |

Closure of 002/004 uses live Windows effective-origin and end-to-end evidence, not source/unit tests alone. Direct QR pixel decoding was not performed; the component passes one `publicUrl` value to link, copy and QR generation. Previously exported PDFs are immutable artifacts and must be regenerated after host rotation.
