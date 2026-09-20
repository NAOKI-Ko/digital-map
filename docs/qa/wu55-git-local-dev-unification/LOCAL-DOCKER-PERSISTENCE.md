# WU-55 local Docker persistence evidence

## Before

- Active Compose project: `digital-map`.
- Active services were assembled from multiple working directories/config files.
- PostgreSQL data was in `digital-map_postgres_data`.
- Managed Media was in `digital-map_uploads` while Public Storage and app state were supplied separately.
- A standalone WU-52 PostgreSQL container and several anonymous/legacy volumes existed.
- The canonical `digital_map` DB contained a one-Map demo, not the verified WU-54 baseline.

## Target

- Compose project: `digital-map-local`.
- Profile-free `postgres`; `app` uses profile `full`.
- Canonical DB: `digital_map` in one retained PostgreSQL volume.
- Shared bind mounts: `.local-data/uploads` and `.local-data/public`.
- Verified WU-54 DB + Media + Public Storage restored once, then preserved across at least two app rebuild/recreate cycles and a host Nuxt run.
- No legacy container or volume removed until unique-data and recovery checks pass.

## Restore and persistence result

- Pre-unification backup:
  - DB dump SHA-256: `be072f97b7c00793730fc9d074292f9cbda11f96d8a7dba1c59973603e67f544`
  - Managed Media archive SHA-256: `393fb181399673b9f9a820cc539b955cab575ab552d603e15030d5ec2460d347`
  - Empty Public Storage archive SHA-256: `05eb7d113dd6f70ed8a41635d029dc63ba5e27d5461b4d8ba028f564d58a3b54`
- Restored WU-54 sources verified before restore:
  - DB dump SHA-256: `434f708c5fbb483ccdf2c63432b082b8fe6f7e224c5a7be31531b96996c9fcb9`
  - Managed Media archive SHA-256: `8f6c92f47bd5d7be5f2d615095d87c44c59562194515da2e238bf4de8ac6c1d5`
  - Public Storage archive SHA-256: `8c8813b609083f2216fade29200118f52a7fbeb775ea869633e694e164416c1a`
- Restored topology: three users, three Workspaces, three Maps, 48 Spots, 18 standard Spot Fields, and three READY current releases.
- The authoritative local WU-54 bundle contains zero custom Spot Fields. The requested “existing custom field” cannot be claimed or recreated without an authoritative source.
- Managed Media: four files. Aggregate content-list signature: `30155f97524de46b60bd7724306db146709d3f27564aea83b4d39db1057ca1e1`.
- Public Storage: 30 files. Aggregate content-list signature: `8bef286ed93cca044c1ba3e8df9838ff4a108c214be252aa1b35a48e7fdf8037`.
- Two explicit build/recreate cycles and additional config recreates reused `digital-map-local_postgres_data`; the DB counts and both file signatures remained unchanged.
- Docker `/api/ready` returned 200. Host `pnpm dev` using the same DB and bind mounts returned 200 and rendered `arimatsu-tama`.
- No `down -v` was run. Legacy containers and volumes remain retained pending final unique-data cleanup decisions.

During the first test pass, Vitest was accidentally pointed at canonical `digital_map` and left one fixture Map. The verified WU-54 dump was immediately restored. The final full PostgreSQL test pass used disposable `digital_map_wu55_test`, which was dropped after PASS; canonical counts remained unchanged.
