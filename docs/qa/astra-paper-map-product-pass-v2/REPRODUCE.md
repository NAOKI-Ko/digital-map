# Reproduction

Use the same OS/fonts for pixel comparisons. This evidence used macOS, Node24, Sharp0.35.4, PDF-lib1.17.1, Poppler, Chrome, Vue3.5.42 / Nuxt4.5.2. Installed font fallback is a cross-host limitation.

`pnpm install --frozen-lockfile` and `pnpm exec nuxt prepare`, then provide an **authorized, public-purpose `PaperMapSource` DTO** and its referenced managed `/uploads/` assets. No live DB access is included in the offline renderer. Do not point this script at a whole DB dump. For a PUBLISHED source, resolve its authorized public assets into an isolated fixture before use; the helper has no remote fetch/storage capability.

```sh
TSX_TSCONFIG_PATH=.nuxt/tsconfig.server.json node --import tsx scripts/qa/render-paper-design-proof.ts \
  --source /path/to/authorized-paper-source.json \
  --uploads /path/to/referenced-assets \
  --output /path/to/qa-output \
  --design heritage-map \
  --kind 'REAL QA SOURCE' \
  --base-url https://authorized-public-map-host.example
pdftoppm -r 150 -png /path/to/qa-output/paper.pdf /path/to/qa-output/pdf-page
```

The URL is an example argument, never a recommended URL for distribution. Use the actual authorized host. For leisure/alpine fixture input use `--kind 'SYNTHETIC FIXTURE'`, clearly QA-labeled source values/assets and `publicUrlAvailable:false`. Synthetic tests must never enter production seed/baseline.

Version1 comparison is rendered by the exact `abddcb4` checkout; version2 by the unchanged renderer retained from `7218f75`; version3 by this implementation. Same20-Spot input, A3 landscape, identical publicBaseUrl; three independent renderer calls per implementation. Metadata timestamps are excluded from raster comparison. `legacy-compatibility.json` records pixel-identical preserved v1 output. Version2 files are unchanged in git.

Full tests require a disposable DB; never canonical `digital_map`. Browser evidence was captured on a local built server, isolated QA identities and an isolated copy of the permitted actual source. Final PNGs/PDFs, hashes and inventories remain; the temporary actual DTO/assets/local release copies are removed after acceptance. Therefore reproducing real-data artifacts requires a fresh authorized export that matches the recorded hashes. This is deliberate minimization rather than committing raw customer fixtures.
