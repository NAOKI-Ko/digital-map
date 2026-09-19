# WU-48 Contract Baseline

Date: 2026-09-19 (Asia/Tokyo)

## Source baseline

- Repository: `NAOKI-Ko/digital-map`
- Baseline branch: `refactor/wu47-mapviewer-camera-geolocation-20260919`
- Baseline SHA: `f66508616ee9f1ae82b9c24925f1b6849177c538`
- Baseline local/remote comparison: ahead 0, behind 0
- WU-48 branch: `refactor/wu48-technical-debt-20260919`
- WU-47 implementation SHA `16b56cab540b9457c2446969448d33971e1fd2f5` is historical implementation evidence; it is not the WU-48 verification target.

The baseline contains 510 tracked files: 308 TypeScript, 73 Vue, 41 PNG, 38 Markdown, 28 SQL, 2 XLSX, and 20 other configuration/script files. Binary images and workbooks were inventoried as assets, not represented as line-reviewed source.

## Preserved product contracts

- Public Map initial cover is distinct from the minimum zoom. Users keep R3 pan freedom and one zoom level beyond whole-floor fit.
- Notifications, ongoing GPS updates, Spot/Info open-close, categories, idle, and same-layout viewport churn do not take camera control.
- A PIN directly opens a readable detail sheet. Body scrolling and mobile sheet gestures remain available.
- Admin position and design modes remain separate. Position is a draft until Save; Cancel restores the saved state; failure retains a retryable draft.
- Floor and Spot coordinates remain normalized IMAGE `x/y` values.
- Tenant, map ownership, intended role checks, and public-snapshot-only delivery remain server-enforced.
- Publish, unpublish, and rollback switch an immutable release through `current.json`; public viewers do not fall back to the live database.
- WU-44's agreed locale scope is map language configuration and FieldDefinition display labels. Full translation of public chrome, categories, floor names, or all Spot content was not part of that contract.

## Change boundaries

No API break, schema/migration, role/publication policy change, dependency major upgrade, infrastructure change, shared-data deletion, main merge, or Production deployment is authorized by WU-48 without separate approval.
