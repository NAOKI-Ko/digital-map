# Category default UI QA

PASS. Category semantic icon and PIN default are separate editors/previews. Defaults use current supported PIN dimensions, with no coordinates. Revision and dependent-version checks prevent stale fanout changes; inheriting Spot versions advance.

The blue default was saved through the local browser, then changed to green; all inheriting LIVE Spots resolved green. Windows repeated revision-checked default changes and fanout over 37 synthetic Spots. Existing Category icons were unchanged by deployment.

Asset references participate in media usage checks and GC protection (`server/utils/media.ts`, `scripts/media-gc.ts`). The Category asset FK restricts deletion. Existing custom references remain protected. Publication copies referenced assets into release storage, so published rendering does not depend on later mutable LIVE assets. Media/GC and public-release tests cover these contracts; no destructive real-asset deletion was performed.

Evidence provenance: completed WU-65 implementation `cea5827313ad1c0e55308edd9f4c7ec303892cff`, product merge/deployed Windows QA `46d9961ea3a5a500738ba33fa0755b41c555afd8`. These files reorganize existing verified evidence after receipt of the expanded instructions; they do not claim new browser runs. See [integration evidence](../wu65-spot-operations-at-scale/INTEGRATION-WINDOWS.md) and [instruction reconciliation](../wu65-spot-operations-at-scale/RECONCILIATION.md).
