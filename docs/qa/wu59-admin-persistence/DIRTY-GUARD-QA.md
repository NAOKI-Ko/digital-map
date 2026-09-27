# Dirty guard QA

Authenticated local fixture: isolated `digital_map_wu59_qa` database on port 33159, seeded from the repository. No existing project database was mutated.

| Case | Browser result |
|---|---|
| Settings name draft → subnavigation | Leave dialog opened; Stay retained input; Save cleared dirty and disabled Save |
| Settings name draft → hash section | Section discard dialog opened; discard navigated to `#language` and removed the draft |
| Organization profile draft → audit link | Leave dialog opened; Stay retained input; Save cleared dirty |
| Assigned Spot Editor revision draft → back link | Leave dialog opened; Stay retained input; Save cleared dirty |
| PIN design candidate → select another map pin | In-page discard dialog opened; candidate and selected target remained until decision |
| Georeference local clear → floor back link | Leave dialog opened; Stay retained candidate; `変更を破棄` restored saved points and cleared dirty |
| Fields new-field dialog Cancel → reopen | Reopened with empty field name and defaults |
| Category item dialog Cancel → reopen | Reopened with saved category name and unchanged Save disabled |
| Spot Detail core Cancel | Saved name restored in place; route remained open; Save disabled |
| Paper candidate → discard | Saved name restored; Save and discard disabled |
| Assigned Spot Editor invalid server Save | Error appeared; 201-character name remained editable and dirty; later route discard worked |

The shared `UnsavedChangesGuard` supplies route leave and `beforeunload` protection. In-page target switches use their existing dialogs or the focused settings/category dialogs. Browser tab-close was not exercised because the browser owns that native confirmation; its handler is unchanged and active whenever `dirty` is true.
