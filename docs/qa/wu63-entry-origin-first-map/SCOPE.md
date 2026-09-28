# WU-63 scope

BASE_SHA: `2745c557844283b2b616a775dcfb2bd3b423e522`. Branch: `fix/wu63-entry-origin-first-map-continuity-20260928`. Findings: AQUA-001/002/003/004 only. No schema or migration. Preserves the September Admin UX contracts, public-release authorization, and WU-41 route Map authority. Excludes AQUA-005 through 014 other than 002/003/004, including Visitor Preview, Paper layout and multi-floor content.

Implementation: homepage entry links; explicit shared `/api/maps` cache key with invalidation after create/rename/delete; strict Admin/Public origin helpers; server URL call sites converge on public runtime config; QA/production startup compares declared origins with effective Nuxt runtime origins. Quick-tunnel hostname remains an environment value, never a code constant.
