# Paper design vNext: bounded combinations

Decision: a hybrid catalog. Structure and visual identity are separate in code, but customers choose six curated designs, not a Cartesian product. Fully coupled templates duplicate pagination/source rules; unrestricted Structure × Theme invites unreviewed combinations. A single monolithic catalog prevents shared physical layout contracts. The hybrid retains shared layout planning and limits visual QA to supported combinations.

Config JSON remains version 2. templateVersion 1 and 2 retain their exact renderers and defaults. templateVersion 3 opts into the new physical layout; design.themeId and design.themeVersion=1 identify theme tokens; design.systemVersion=1 identifies their shared visual contract. Old records never upgrade on read/save. A deliberate design change preserves content, source mode, selection, ordering and viewport, while applying the chosen design identity. Future visual changes require a new version.

Catalog: heritage-map (map-classic/heritage), heritage-editorial (photo-story/heritage), leisure-guide (photo-story/leisure), alpine-map (map-classic/alpine), neutral-map (map-classic/neutral), neutral-guide (spot-guide/neutral). All support A4/A3 and both orientations. A paper setting is not a separate template. Recommendation is deterministic from explicit category words, photo coverage and count. Ambiguous domain defaults to neutral. No generated prose or semantic inference from colors.

PDF v3 uses 240dpi JPEG 94, 4:4:4 chroma, with the same SVG/document plan as PNG preview. This intentionally trades pixel-exact PNG embedding for smaller files; typography remains physical (body >=9.5pt). Codec quality must pass visual inspection and measurable comparison. Previous v1/v2 PDF paths are unchanged.
