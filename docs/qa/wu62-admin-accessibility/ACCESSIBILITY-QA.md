# Accessibility QA

| Check | Evidence | Result |
|---|---|---|
| Keyboard-only calibration | A image → A map → B image → B map → Preview → Save completed without pointer | PASS |
| Spatial control names | Illustration has active-point description and percentage; map pan control has instruction; center commit names A/B | PASS |
| Status and errors | Ordered steps expose `aria-current` and completion text; point/center and dirty/saved status use live semantics; map/preview errors use alert | PASS |
| Focus | Illustration, map control, buttons, opacity, and reset/zoom controls are keyboard operable with visible focus ring | PASS |
| Dialog | Dirty route dialog supported Continue, Discard, Escape; Escape stayed on route | PASS |
| Decoration selection | Enter on a decoration canvas button selects it; dirty Enter switch invokes existing target dialog | PASS after WU-62 fix |
| Narrow widths | 390, 768, 1024, 1440 px browser measurements had zero document horizontal overflow; 1440 × 700 checked | PASS |

The browser harness cannot certify screen-reader spoken output or physical touch hardware. Those are residual manual device checks, not observed blockers.
