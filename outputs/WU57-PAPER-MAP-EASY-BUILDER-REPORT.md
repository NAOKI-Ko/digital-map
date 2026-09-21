# WU-57 Paper Map Easy Builder v1

## Outcome

Implemented the v1 workflow for creating a distribution-ready paper map in minutes, without a freeform design canvas:

- purpose-first one-click creation
- deterministic recommended settings
- selection-only customization with progressive disclosure
- immediate shared-geometry live preview
- explicit save, duplicate and delete
- PDF from the validated current draft
- A4/A3, portrait/landscape, three layouts, themes, density, photo, ordering, QR/logo and viewport choices
- LIVE and immutable current READY release sources
- lightweight “デザイン制作を相談する” request persistence
- map-scoped authorization and audit events
- dedicated navigation and Publish-page handoff

## Delivery surface

- Product contract, wireframes, data model and layout-engine documents under `docs/`
- Prisma `PaperMap` / `PaperDesignRequest` migration
- map-scoped CRUD, duplicate, PDF and consultation APIs
- Paper Map landing, purpose picker, Easy Builder editor and request form
- shared preview/PDF geometry and a high-resolution Sharp/pdf-lib renderer
- migration/integrity CI audit plus unit, contract and PDF tests

## Verification

- upgrade migration: PASS
- fresh migration: PASS
- schema/integrity audit: PASS
- typecheck: PASS
- tests: PASS (`570` passed, `16` skipped)
- production build: PASS
- authenticated Browser QA: PASS
- PDF matrix and rendered-page inspection: PASS

Detailed evidence: `docs/qa/wu57-paper-map-easy-builder/README.md`
