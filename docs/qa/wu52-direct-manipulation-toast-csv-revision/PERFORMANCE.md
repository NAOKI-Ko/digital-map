# WU-52 decoration performance

The implementation coalesces pointer visual updates through one `requestAnimationFrame`. The only gesture PATCH call is in the pointer-up commit path; pointer-move only updates the local draft, and pointer-cancel restores the snapshot without calling the API. Automated contract tests assert these boundaries.

| Interaction | duration | PATCH during move | PATCH on commit | long tasks >50ms | visible jank |
| --- | ---: | ---: | ---: | ---: | --- |
| Move | browser drag gesture | 0 (code/test boundary) | 1 (completion Toast observed) | not available from isolated browser instrumentation | none observed |
| Resize | keyboard + visual browser check | 0 | 1 per committed key action | not available from isolated browser instrumentation | none observed |
| Rotate | keyboard + visual browser check | 0 | 1 per committed key action | not available from isolated browser instrumentation | none observed |

The available browser automation intentionally did not expose the page Performance API, so no invented frame-rate or long-task count is reported. Source inspection confirmed no `refresh()` in any gesture path.

## VM166 diagnostic

Conclusion: `NOT REPRODUCED`.

The clean browser produced zero console errors and no `VM166`, `reportAllChanges`, or `startTime` entry while moving, resizing, rotating, and duplicating. Repository and built-source searches contain no `reportAllChanges` reference. The reported anonymous VM stack therefore remains un-attributed; no business code was changed to silence it.
