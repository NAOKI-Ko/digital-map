# Navigation ownership matrix

| Area | Primary owner | Contextual child / link | Direct-entry return |
|---|---|---|---|
| Categories | Map / Categories | Settings and Spot forms link to the one category screen | Map Home |
| Fields | Illustration Map / Fields | Map Settings sibling subnavigation | Map Settings |
| Floors | Illustration Map / Floors | Decoration and Georeference | Floors |
| PIN | Illustration Map / PIN | Spot New and Georeference carry validated PIN origin | Spot list existing top-level return; child flows return to PIN |
| Paper | Paper Map list | New, Edit, design request | Paper list; request returns to validated item when present |
| Revisions | Team / Revisions | Spot subnavigation is labeled a Team shortcut | Map Home |
| Editors / Members | Team | Settings may link to Editors | Map Home |
| Publish | Publication management | Map Home and Paper links | Map Home |

The WU-51 Sidebar remains cross-domain navigation. Categories and Team items appear in the expanded sidebar with route-backed `aria-current`; the collapsed rail retains its original reduced item set. Illustration and Spot subnavigation remain scoped to their siblings. No routes were moved and no editor was duplicated.
