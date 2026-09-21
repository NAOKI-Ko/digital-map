# Paper Map Template Studio v2 product contract

Paper Map v2 uses designer-authored, versioned templates. Users choose a template and may edit bounded paper content, visibility, source selection, ordering, and viewport. Arbitrary blocks, coordinates, resizing, CSS, and font selection are not supported.

## Content ownership

- `SOURCE`: Map, Spot, Category, Media, logo, illustration and public URL. The paper editor never writes these fields.
- `PAPER_OVERRIDE`: an explicit per-Spot short summary stored only in PaperMap config. Reset removes the override and resolves the active LIVE/PUBLISHED source again.
- `PAPER_ORIGINAL`: title, subtitle, intro, QR label and footer stored only in PaperMap config.

Hidden slots retain their content. Template switching retains all common content, selections, order, viewport and overrides. Destination defaults apply only to unmodified slot visibility. Unknown template/version pairs fail safely.

No generated facts, images, descriptions, hours, access, roads, routes, categories or taglines are permitted. Deterministic clipping is display-only.

## Non-scope

No Canva integration, arbitrary layout editor, template CMS, CRM expansion, source mutation, Windows deployment, production deployment or `main` change.
