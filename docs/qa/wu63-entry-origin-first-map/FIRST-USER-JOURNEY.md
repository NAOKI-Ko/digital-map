# First-user journey

`/` now shows `ログイン` and `新規登録` for a guest; an authenticated visitor sees `管理画面へ`. Public signup is supported by existing `server/utils/signup.ts`: a pending intent precedes verification; a newly verified account creates a Workspace with OWNER membership only for its own new Workspace. Existing-account completion requires login and does not overwrite the account. Protected admin routes still use auth and per-Map authorization. No privileged cross-tenant role was added.

Local disposable QA used fake mail and a separate database `digital_map_wu63_disposable`: `/api/signup` returned 202 with a verification URL on the configured local Admin origin, `/api/signup/verify` returned 200, then browser Login reached the new Workspace dashboard. No token is recorded here. Browser clicks proved `/` → Login and Login → Signup. Windows fresh-account journey remains to be recorded after deployment.
