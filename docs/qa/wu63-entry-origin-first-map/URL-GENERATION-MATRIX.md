# URL generation matrix

| Output | Authority | Source after WU-63 | Full absolute URL persisted? | Verification |
|---|---|---|---|---|
| Signup verification/resend | ADMIN_ORIGIN | `configuredAdminUrl` → `adminAbsoluteUrl` → effective `adminBaseUrl` | No; token hash/intent persists | Unit + local fake-mail flow; Windows pending |
| Organization/Spot-editor invitation | ADMIN_ORIGIN | Same helper | No; invitation token hash persists | Unit/source; Windows pending |
| Password reset | ADMIN_ORIGIN | Same helper | No; token hash persists | Unit/source; Windows pending |
| Publish link/copy/QR | PUBLIC_ORIGIN | browser public runtime config → `buildPublicMapUrl` | No; Map slug persists | Unit + built payload; Windows pending |
| Map Home public link | PUBLIC_ORIGIN | server `configuredPublicBaseUrl` → `buildPublicMapUrl` | No | Unit; Windows pending |
| Legacy PDF/Paper QR | PUBLIC_ORIGIN | server `configuredPublicBaseUrl` → `publicMapQrPayload` → `buildPublicMapUrl` | QR pixels persist in exported PDF | Unit; Windows pending |
| Public canonical/locale/OGP/sitemap/robots | PUBLIC_ORIGIN | effective public runtime config | Rendered from config | Built payload; Windows pending |
| Relative API calls | REQUEST_ORIGIN | relative `/api/...` | No | Existing tests |

`REQUEST_ORIGIN` is used for trusted request/CSRF/proxy behavior, not staff mail or visitor QR. Historical `server/fixtures/arimatsu-public.json` contains absolute archived asset URLs; it is a fixture, not a generated share URL or schema field. Current release asset rewriting uses relative public-asset paths. Existing exported PDF QR pixels cannot be corrected after a host change; regenerate them.
