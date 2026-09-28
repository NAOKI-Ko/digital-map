# Local browser QA

Built Nuxt app, isolated local QA database, in-app browser:

- Map Home visibly linked `来館者プレビュー`; Publish visibly linked `来館者プレビューで編集中の内容を確認` before publication.
- Map Home → Preview → return reached Map Home. Publish → Preview → return reached Publish. Invalid/external `from` values are mapped to Map Home in a focused test.
- 390 px: full-screen visitor map, PIN, category chips, return control, and mobile map controls visible. The compact Preview chrome was adjusted so it does not cover the map controls.
- 768, 1024 and 1440 px: visitor surface and Preview chrome rendered without document horizontal overflow. At 1440 px the map region and marker DOM were present; screenshot showed the public-style Desktop surface.
- Spot detail showed the expected source-specific descriptions. Category filtering and eligibility were exercised on the disposable fixture.
- Browser QA found and fixed a Nuxt component auto-import naming issue before signoff; both public and Preview pages now explicitly import the shared visitor renderer.

Local visual checks are a limited fixture, not the five-Floor Aquarium acceptance. Existing public Map visual issues remain outside WU-64.
