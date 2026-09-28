# WU-64 scope and baseline

- Base: `origin/dev` at `b29b47f4711c5346e399df66ba990c19e02f8608` (fetched 2026-09-28; no delta from the requested base).
- Target: AQUA-011, authenticated whole-map visitor Preview from current editable LIVE state.
- Included: Map Home and Publish entry links, authorized read endpoint, shared visitor renderer, return context, no-index/no-store response behavior, analytics exclusion, focused tests and QA.
- Excluded: Paper Preview, public-map visual redesign, Floor-fit work, multi-floor domain modeling, Category/PIN defaults, Spot operations, schema and migrations, Production.
- Local QA uses a separate disposable PostgreSQL database `digital_map_wu64_disposable`, a synthetic Floor illustration, one eligible Spot, and two synthetic accounts. Aquarium and Arimatsu data were not used in local QA.
