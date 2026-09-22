# Paper visual system 1

All dimensions are points. Display/title 32; section 12; Spot name 11; body 9.5/12.5; metadata 9/12; caption 9/11. Page margin 26 (A4), 28 (A3); column gap 16; card gap 8; card inset 10. Rules >=0.7pt. QR 50pt plus 4-module internal quiet zone and surrounding breathing space. Photos use deterministic center-crop: portrait cover cards 8:5, portrait continuation 2:1 (4:3 for a short final photo page), landscape lead cards 3:2 and continuation cards 4:3; landscape feature strips have bounded frames; no inferred focal points or fallback photography. Assets are downsampled to at most 240dpi effective resolution. Missing optional media gives text composition, not an empty placeholder.

Heritage: indigo #173a4b, warm paper #faf7ef, muted terracotta #aa533a; horizontal editorial bands, fine geometric lattice outside the map, squared stamps, calm hierarchy. Japanese Mincho title with sans-serif body when installed; explicit font fallbacks. No invented calligraphy or historical content.

Leisure: deep blue #173658, warm accent #b75609 and nonsemantic yellow motif #f7d975, pale sky #f3f9fc; rounded tabs/cards, bold numbers, contrasting source-category badges. Large source photos carry the color. No invented rides or facility symbols.

Alpine: slate #172d40, blue #176484, icy #f2f7fa; strong map frame, technical section tabs, crisp rules and square numbered markers. No trails/lifts/difficulty colors beyond source imagery.

Neutral: ink #263d46, teal #37756f, white #fbfcfa; quiet civic guide. Theme motifs are nonsemantic and never drawn over the map. All identity is code-defined, no arbitrary fonts/CSS controls.

Japanese wrapping applies prohibited line-start/end punctuation and preserves Unicode codepoints. Long bounded text is explicitly ellipsized and warned, never summarized. Geometry determines pagination before rendering. Raster PDF remains untagged; document text is separately accessible in the editor.

Layout profiles: heritage map uses 52% map / 48% guide, leisure 43% / 57%, alpine 60% / 40% with two source photos below the guide. Photo cards fill the shortest column to avoid empty photo-sized boxes for text-only entries. No Spot is dropped to make a page fit. A3/A4 orientation changes are bounded responsive print structures, not a free grid.

Category custom managed images are preferred. Kanji presets use their source symbol; Material presets use a compact Japanese preset-label badge because no Material glyph font is bundled in the PDF renderer. Unknown categories use their initial plus their actual label. This is an explicit visual limitation, not a made-up service icon. Font fallback depends on host-installed fonts; cross-OS pixel identity is not promised.
