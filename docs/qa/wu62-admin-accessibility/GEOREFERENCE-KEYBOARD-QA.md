# Georeference keyboard QA

Authenticated disposable Map `demo-arimatsu-map`, floor `demo-arimatsu-floor`, local QA database `digital_map_wu62_qa`; no canonical or Production data was changed. Desktop browser test, 2026-09-28.

| Step | Keyboard evidence | Result |
|---|---|---|
| A illustration | Focused illustration; Enter placed center; Shift+Right changed X to 52%; marker and announced percentage updated | PASS |
| A real map | Focused map-center control; ArrowRight panned; current center text changed; activated explicit set-center button | PASS |
| B illustration | Focus moved to illustration; Enter placed center; ten Shift+Right/Down presses reached 70%/70% | PASS |
| B real map | Four Shift+Right/Down pans changed center to approximately 35.05981, 136.97974; set-center button completed B | PASS |
| Preview and Save | Preview step became active; opacity input remained available; Save by Enter succeeded and dirty cleared | PASS |
| Pointer parity | Reselected A; illustration click advanced to map; MapLibre canvas click advanced to B illustration; discarded candidate | PASS |

Both input paths use `selectGeoReferenceImagePoint` and `selectGeoReferenceMapPoint` on the same `GeoReferenceDraft`; only the existing Save persists it. Arrow nudges clamp image coordinates to the 0–1 range. Existing geospatial math, validation, API, and stored format are unchanged. `tests/georeference-keyboard.test.ts` exercises shared candidate updates, clamping, and step completion.

Focus after A map commit moved to B illustration; after B map commit it moved to the Preview step status. The illustration focus ring was visibly measured; sticky admin UI did not cover the focused control. Screen-reader speech was not emulated; role, label, live status, step completion, and alert semantics were inspected in DOM.
