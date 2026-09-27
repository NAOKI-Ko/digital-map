# Reference and exception regression

PIN Editor `/admin/maps/demo-arimatsu-map/editor`: unchanged source. At 1440 × 900, map left was 884 × 612 with `position: sticky`; inspector right was 380 × 612. At 390 × 844 both were one column, map first, and document width was 390. Selecting a pin exposed its inspector; entering move mode displayed the candidate pin plus Cancel and disabled Save until a new position. Cancel restored normal selection. The WU-59 browser QA remains the deeper target-switch and persistence evidence.

Paper Map New `/admin/maps/demo-arimatsu-map/paper/new`: unchanged selection flow. At 1440 × 900 the 848 px finished-preview panel stayed left and the 432 px design-selection panel stayed right and sticky. At 390 px it remained a single flow without horizontal overflow. It was not made to resemble Paper Edit.

Georeference `/admin/maps/demo-arimatsu-map/floors/demo-arimatsu-floor/georeference`: unchanged illustration and real-map pair, with A/B control points, opacity slider, local Discard and explicit Save. The QA fixture loaded both panels at 390 px with no horizontal overflow. WU-59's dedicated browser QA and unchanged source cover its dirty route protection; this WU did not alter the wizard.

No universal Visual Editor component was created. Paper, PIN, and Decoration differ in sticky eligibility, toolbars, action location, and responsive behavior. Explicit page layouts keep those differences visible.
