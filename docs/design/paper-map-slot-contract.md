# Paper Map slot contract

Templates declare fixed slots with ID, kind, default visibility, visibility editability, ownership, editability and optional length bound. Common slots are `intro`, `categoryLegend`, `spotGuide`, `qr`, `logo`, and `footer`; `photo-story@1` also declares `photoFeature`.

`visible: false` means “表示しない”; it never deletes content. SOURCE slots are read-only. `spotGuide` permits only a per-Spot PAPER_OVERRIDE summary. PAPER_ORIGINAL slots reset to template defaults. Users cannot create, move or resize slots.
