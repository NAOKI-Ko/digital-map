# Paper Map config v2

`configVersion` describes the JSON contract; `templateVersion` describes visual behavior. v2 stores `templateId`, `templateVersion`, `sourceMode`, paper/orientation, selection, ordering, internal normalized viewport, `paperOriginal`, bounded `slotState`, bounded `spotOverrides`, and presentation choices.

`parsePaperMapConfig` is the single read boundary. It accepts v2 or deterministically migrates v1 in memory. `MAP_FOCUS` maps to `map-classic@1`, `PHOTO_GUIDE` maps to `photo-story@1`, and GUIDE/BALANCED maps to `spot-guide@1`. Persistence becomes v2 on the next explicit save; reads do not mutate storage. Unknown config or template versions fail.

Switching source keeps overrides; reset resolves the newly active source. Stale references warn and do not crash reads. New writes reject references outside the active Map.
