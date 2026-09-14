# Public Snapshot Storage

Public rendering reads `current.json` and an immutable release manifest from the configured object store. It never falls back to live admin database data.

- Development and Windows QA: `PUBLIC_STORAGE_DRIVER=local` with a persistent `PUBLIC_STORAGE_ROOT`.
- Production: `PUBLIC_STORAGE_DRIVER=r2` plus `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY`.
- Release objects use a one-year immutable cache policy. The current pointer always requires revalidation.
- R2 credentials are not required for local implementation verification and must never be committed.

The release layout is `public/maps/{slug}/releases/{releaseId}/...`; `public/maps/{slug}/current.json` changes only after a complete READY release exists. Keep prior READY objects for rollback.
