# URL generation matrix

| Output | Authority | Source after WU-63 | Full absolute URL persisted? | Verification |
|---|---|---|---|---|
| Signup verification/resend | ADMIN_ORIGIN | `configuredAdminUrl` → `adminAbsoluteUrl` → effective `adminBaseUrl` | No; token hash/intent persists | Unit + Windows fake-mail signup and resend PASS |
| Organization/Spot-editor invitation | ADMIN_ORIGIN | Same helper | No; invitation token hash persists | Unit/source; no live invitation issued |
| Password reset | ADMIN_ORIGIN | Same helper | No; token hash persists | Unit + Windows fake-mail reset-request origin PASS |
| Publish link/copy/QR | PUBLIC_ORIGIN | browser public runtime config → `buildPublicMapUrl` | No; Map slug persists | Windows displayed URL, copy-success UI, QR image and public destination PASS; QR pixels not independently decoded |
| Map Home public link | PUBLIC_ORIGIN | server `configuredPublicBaseUrl` → `buildPublicMapUrl` | No | Windows Aquarium Home link and visitor route PASS |
| Legacy PDF/Paper QR | PUBLIC_ORIGIN | server `configuredPublicBaseUrl` → `publicMapQrPayload` → `buildPublicMapUrl` | QR pixels persist in exported PDF | Unit/source; no new PDF exported |
| Public canonical/locale/OGP/sitemap/robots | PUBLIC_ORIGIN | effective public runtime config | Rendered from config | Built payload + Windows public response PASS |
| Relative API calls | REQUEST_ORIGIN | relative `/api/...` | No | Existing tests |

`REQUEST_ORIGIN` is used for trusted request/CSRF/proxy behavior, not staff mail or visitor QR. Historical `server/fixtures/arimatsu-public.json` contains absolute archived asset URLs; it is a fixture, not a generated share URL or schema field. Current release asset rewriting uses relative public-asset paths. Existing exported PDF QR pixels cannot be corrected after a host change; regenerate them.
