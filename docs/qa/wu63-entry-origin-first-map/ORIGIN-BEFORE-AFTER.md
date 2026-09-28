# Origin before/after

## Windows pre-implementation evidence, 2026-09-28 JST

Read-only SSH on configured Windows QA host `CHIFFONCHAN`: deployed SHA marker/release was `2745c557844283b2b616a775dcfb2bd3b423e522`. `C:\DigitalMap\runtime\secrets.ps1` declared QA `PUBLIC_BASE_URL` and `ADMIN_BASE_URL` at `https://eyes-retention-judgment-neural.trycloudflare.com`; no Nuxt runtime override assignments for these fields were present. Cloudflared log showed active Quick Tunnel `eyes-retention-judgment-neural.trycloudflare.com` beginning 2026-09-28 02:06 UTC. App process started after the settings file timestamp. Yet `http://127.0.0.1:3011/` exposed `window.__NUXT__.config.public.publicBaseUrl` as `https://sur-context-basin-concert.trycloudflare.com`. This establishes a **declared-versus-effective runtime config mismatch** after tunnel rotation; it is more precise than assuming the protected settings file itself remained stale. No secrets or tokens were recorded.

`nuxt.config.ts` previously used `process.env.PUBLIC_BASE_URL` as a build-time public runtime-config default. Changing plain `PUBLIC_BASE_URL` after the build did not replace that default in the browser payload. The private `adminBaseUrl` had the same build-default pattern; its exact running value could not be inspected without issuing an auth link, but the same missing runtime-override path is present.

## Local built-artifact proof after change

With `PUBLIC_BASE_URL`/`ADMIN_BASE_URL` and matching `NUXT_PUBLIC_PUBLIC_BASE_URL`/`NUXT_ADMIN_BASE_URL`, a QA-mode production build served `/` with the new entry links and the expected public runtime origin. Starting the same build without the public Nuxt override failed with `PUBLIC_BASE_URL differs from effective Nuxt runtime origin`. This is the recurrence gate.

## Windows after deployment

The existing protected Windows settings file was copied to `C:\DigitalMap\runtime\secrets-wu63-pre.ps1` before adding Nuxt runtime overrides. The active tunnel marker, declared `PUBLIC_BASE_URL` and `ADMIN_BASE_URL`, and effective `NUXT_PUBLIC_PUBLIC_BASE_URL` and `NUXT_ADMIN_BASE_URL` all matched `https://eyes-retention-judgment-neural.trycloudflare.com` before app restart. `NUXT_DEPLOYMENT_ENVIRONMENT=qa`, `NUXT_TRUSTED_HOSTS` and `NUXT_TRUST_PROXY` were set consistently. The public homepage response after restart exposed `publicBaseUrl:"https://eyes-retention-judgment-neural.trycloudflare.com"`. Fresh signup, resend and password-reset links all used that Admin origin; no token values were recorded.
