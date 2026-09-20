# Arimatsu three-user QA baseline contract

This contract is QA-only. It must never be applied to Production or to an R2-backed public storage target.

The baseline contains exactly three active users (`ふぉん`, `たま`, `なう`), three Workspaces, and one independently owned Map per Workspace. Every user belongs to every Workspace. The named owner is the sole `TenantMember OWNER`; the other two users are `TenantMember MEMBER` plus `MapMember EDITOR`. Owners do not receive redundant MapMember rows.

All Maps are named `有松マップ` and use unique public slugs `arimatsu-fon`, `arimatsu-tama`, and `arimatsu-nau`. Each tenant owns its own Floor, Categories, Spots, and MediaAsset rows. Logical content matches, while record IDs are intentionally independent.

The canonical dataset contains 16 sourced locations. Unverified address, hours, phone, URL, latitude/longitude, and illustration x/y remain empty. Such Spots remain unpublished; the public Map still publishes through the normal release flow with its verified illustration.

An accepted baseline is a single verified set of PostgreSQL DB, Managed Media, and local Public Snapshot Storage. Recovery uses the accepted bundle, never routine reseeding.

Destructive creation requires all of:

- `QA_BASELINE_ENV=local` or `windows-qa`
- `ALLOW_QA_BASELINE_RESET=I_UNDERSTAND_THIS_REPLACES_QA_DATA`
- an exact `EXPECTED_DATABASE_NAME`
- `PUBLIC_STORAGE_DRIVER=local`
- a verified pre-reset marker covering DB, Media, and Public Storage

Plaintext passwords are stored only in an operator-only file outside Git and are never included in evidence, logs, archives, or this contract.
