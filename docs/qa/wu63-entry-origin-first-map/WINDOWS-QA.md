# Windows QA

Pre-implementation read-only origin inspection: see `ORIGIN-BEFORE-AFTER.md`. Active tunnel host at that inspection: `eyes-retention-judgment-neural.trycloudflare.com`. No Windows code, configuration, data or service was changed during preflight.

## Deployment, 2026-09-28 JST

- Implementation PR: [#14](https://github.com/NAOKI-Ko/digital-map/pull/14). Merge/deployed SHA: `fdc5d9afcc21545d77b86eaaf1462678cd8b36f9`. PR Verify passed before merge; post-merge Verify run `36415430182` passed on the merge SHA.
- Verified pre-deploy backup: `C:\DigitalMap\backups\wu63-pre-fdc5d9a-20260928`; database dump, media and public storage all passed `backup:verify`.
- Committed-source archive SHA-256: `c7ee481b4e460a95cc49eafe119c628bd0deb15040d42703bfb194c51dae9a88` on both transfer ends. The release was expanded under `C:\DigitalMap\releases\fdc5d9afcc21545d77b86eaaf1462678cd8b36f9`.
- After making a protected copy of the existing settings, the effective `PUBLIC_BASE_URL`, `ADMIN_BASE_URL`, `NUXT_PUBLIC_PUBLIC_BASE_URL` and `NUXT_ADMIN_BASE_URL` all matched the active `https://eyes-retention-judgment-neural.trycloudflare.com` tunnel. The quick-tunnel name is deployment configuration, not an application constant. The existing `NODE_OPTIONS` preload was preserved.
- Staged Windows gates passed: frozen install, Prisma validate, image/spatial migration audit, Prisma migrate status, full tests, typecheck and production build. No schema migration was introduced or deployed.
- Only the Nuxt app was restarted. `status.ps1` reported Digital Map, PostgreSQL and Cloudflare Tunnel RUNNING; local HTTP PASS; deployed SHA exactly the merge SHA. Public HTTPS homepage returned HTTP 200, rendered Login/Signup links, and exposed the current effective `publicBaseUrl`.

## End-to-end acceptance

The fresh disposable account `wu63-qa-20260928-fdc5d9a@example.invalid` was separate from the Aquarium account. Fake-mail signup returned a verification URL on the current Admin origin; the link returned HTTP 200 and verification completed. Resend verification and password-reset request also generated current Admin-origin links; no token is recorded. Browser navigation covered guest `/` → Signup/Login → new Workspace → first Map creation. Without reload, the new Map name and Categories, Spots, Paper and Publish appeared. The Map sidebar links remained in the accessibility tree at 390, 768, 1024 and 1440 px.

The disposable Map published successfully. Its Publish page displayed `https://eyes-retention-judgment-neural.trycloudflare.com/wu63-windows-qa-fdc5d9a`, the copy button reported success, a 640 px PNG QR image was generated, and the public page opened at that exact URL. The page says no Floor is available because this disposable Map intentionally has no content. `PublicSharePanel.vue` passes that same `publicUrl` prop to `qrcode.toDataURL`, the copy action and the open link; the QR pixels were not independently decoded in this run. The existing Aquarium Map, which has real content, opened successfully at its current public URL.

## Recurrence condition

A quick-tunnel rotation requires refreshing both declared and effective Nuxt origins before restarting the app. The new QA startup gate rejects a mismatch rather than silently serving a stale host. A stable QA hostname remains the infrastructure follow-up. Production was not changed.
