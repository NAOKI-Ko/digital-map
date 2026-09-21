# WU-58 target source inventory

No factual content or imagery was invented.

- Map illustration: `prisma/seed-assets/arimatsu-demo/arimatsu-map.png`, 1448×1086, approved SHA-256 `bbcdc37460f481b959097ea68674facff617003eda5fe2eb2d418e91625f6b43`.
- Map and organization wording: canonical local `arimatsu-fon` baseline (`有松マップ`, `有松・桶狭間`).
- Spot names, categories and descriptions: `ARIMATSU_SPOTS` in `scripts/qa/arimatsu-baseline-lib.ts`; provenance is documented in `docs/qa/wu53-arimatsu-baseline-reset-deploy/DATA-SOURCE-MANIFEST.md`.
- The baseline contains no approved Spot photographs. `photo-story` therefore renders the required text-card fallback and explicitly says that photos are not configured. No image placeholder is shown.
- The baseline reset leaves Spots unpublished and without normalized x/y. Target renders intentionally omit pins rather than inventing locations. Production rendering continues to use only source x/y.
- `Digital Map · source-only target` is an artifact label, not a source fact.

Primary factual source: Nagoya City Midori Ward’s Arimatsu/Okehazama walking-course page, as recorded in the WU-53 manifest. Additional sources for 有松・鳴海絞会館 and 岡家住宅 are also recorded there.
