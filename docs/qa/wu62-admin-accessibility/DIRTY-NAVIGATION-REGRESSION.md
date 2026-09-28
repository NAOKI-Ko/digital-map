# Dirty navigation and history regression

All scenarios used authenticated disposable data. No Production state was touched.

| Screen | Candidate / transition | Browser result |
|---|---|---|
| Settings | Edited Map name; section switch and Sidebar exit | Both guarded; stayed, then discarded; destination reached |
| PIN | Selected Spot A, changed size; selected Spot B | Target resolution dialog appeared; Discard selected B |
| Paper Edit | Edited title; Sidebar exit and browser Back | Both guarded; Continue retained candidate, Discard returned to list |
| Decoration | ArrowRight moved selected item; pointer and Enter selection of second item | Both guarded; Discard selected second item; route Back to Floors guarded |
| Georeference | Changed calibration; Sidebar exit and browser Back | Both guarded; Continue retained candidate; Discard navigated and saved points remained on revisit |
| Georeference dialog | Escape | Dialog closed; editor and candidate remained |
| Clean Paper history | List → Edit → List → Back → Forward | Returned to Edit and List in sequence |

These browser outcomes confirm WU-59 route/target draft protection remains active after WU-62. Browser history was exercised where route transitions provided entries; direct `tab.goto` has no prior same-app history.
