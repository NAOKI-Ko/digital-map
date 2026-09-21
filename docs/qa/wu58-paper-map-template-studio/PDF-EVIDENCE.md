# PDF evidence

Each actual-data target PNG is embedded losslessly in a one-page PDF in `targets/`. Automated renderer tests parse all three template families across A4/A3 and both orientations with `pdf-lib`. PDF generation uses the exact saved template ID/version and the shared render model, preserves map/decorations coordinates, omits unavailable assets, and emits overflow guide pages.
