# Decoration geometry draft QA

Authenticated local QA used a generated 160 × 160 PNG in the disposable `digital_map_wu60_qa` database. A temporary request logger recorded method and route during browser actions and was removed before the final build. The normal API and schema were unchanged.

| Action | Browser result | Network / canonical result |
|---|---|---|
| Arrow move, keyboard resize, Shift rotate | Canvas changed; dirty indicator and Save/Discard enabled | No PATCH before Save; database remained x=.5, y=.5, width=.2, rotation=0 |
| Explicit Save | Dirty cleared, inline success shown | One geometry PATCH; canonical became x=.53, y=.5, width=.22, rotation=30, order remained 0 |
| Pointer drag | Canvas moved immediately and stayed dirty | No PATCH on pointer-up |
| Discard | Canvas restored saved x/y/width/rotation | No request |
| Simulated HTTP 503 on Save | Candidate remained visible and dirty, error shown, retry enabled | Canonical geometry unchanged; retry after removing the QA fault succeeded |
| Duplicate while dirty | Three-choice dialog first; discard then duplicate used saved geometry | POST only after resolution; no implicit geometry Save |
| Add while dirty | Three-choice dialog first; Continue editing leaves draft and resets the picker selection | No POST until Save or Discard decision |
| Delete while dirty | Three-choice dialog before the separate delete confirmation | No silent geometry Save; DELETE remains a discrete command |
| Layer while dirty | Three-choice dialog first | After resolution, PATCH payload contains `order` only |
| Switch target, empty canvas, leave to Floors | Draft resolution or WU-59 route guard shown | No silent draft loss |

Geometry draft has only `id`, `x`, `y`, `width`, and `rotation`. Save PATCH sends the four geometry fields. Layer PATCH sends only `order`. Command success uses a toast; explicit geometry Save uses persistent inline feedback. Save-and-continue uses a toast after the inline feedback is cleared for the next target.

`STICKY_NOT_REQUIRED`: at 1440 × 900 the canvas was 808 × 606 and the inspector was 320 × 700; at 1024 × 900 the canvas was 544 × 408 and the inspector was 320 × 700. At 1024 the taller inspector still ended within the 900 px viewport (y168–868); the geometry controls and Save/Discard are near its top. At 1440 × 700 the canvas was 606 px high and controls 700 px high, with only a short document scroll. A sticky canvas did not improve the active edit, so normal document flow remains.
