# WU-53 local baseline

- Target DB: `digital_map_wu52` (Local QA only)
- Base SHA: `61b0acfe34889adcd579bc4f44af4a58a927f2dd`
- Users / Workspaces / Maps: 3 / 3 / 3
- Spots: 16 per Map, 48 independent tenant-owned rows total
- Categories: 4 per Map, 12 total
- MediaAssets: 1 independent illustration per tenant, 3 total
- READY current releases: 3
- Public paths: `/arimatsu-fon`, `/arimatsu-tama`, `/arimatsu-nau`
- Login aliases: `fon@arimatsu.test`, `tama@arimatsu.test`, `nau@arimatsu.test`

Passwords are not recorded. The operator-only credential file is outside Git.

The guarded reset, access audit, Tenant Data Foundation audit, IMAGE spatial audit, real-session browser/API QA, normal publication flow, Chrome illustration rendering, and public health checks passed locally.
