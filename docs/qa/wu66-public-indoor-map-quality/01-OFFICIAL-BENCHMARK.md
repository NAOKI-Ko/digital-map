# Official Benchmark — before implementation

Sources inspected 2026-09-29:
- Official Web floor guide: https://nagoyaaqua.jp/floormap/
- Linked April 2026 two-page leaflet: https://nagoyaaqua.jp/wp/wp-content/uploads/2026/04/名古屋港水族館リーフレット_202604（compression）.pdf (page 2 rendered and visually inspected; reference only, not committed/copied into product).
- Official digital map: https://nagoyaaqua.smartmap-pro.com/maps/574bp3oN/parcels/1/ja (live Desktop UI, introduction, 2F, search/category/navigation controls observed; advertised positioning not field-tested).

The leaflet separates five levels into north/south building columns, uses floor numerals, repeated facility symbols, exhibit callouts, connectors and a legend. Official Web links exhibit areas from the floor overview. Digital map exposes categories, search, route, gallery and details around an illustrated map. These are information-design references only; no illustration/icon copying or tracing.

Ratings compare the complete existing Aquarium experience, not just code. BELOW is an actual gap; NOT-YET-COMPARABLE is insufficient validation. No blanket ABOVE claim.

| Dimension | AS-IS | Evidence / boundary |
|---|---|---|
| floor recognition | BELOW | Floor name present, illustration/floor cut off on mobile |
| building recognition | BELOW | Name carries building; lacks official spatial relationship |
| exhibit discovery | BELOW | Most initial mobile PINs off-screen, unnamed circles |
| toilet/facility discovery | BELOW | Category available; many facilities off-screen |
| category discovery | BELOW | Horizontal chips hide later categories |
| spatial orientation | BELOW | Cover cropping; schematic artwork lacks real corridors |
| viewport utilization | BELOW | Mobile cover crop; desktop square-art margins are legitimate |
| visual hierarchy | BELOW | Controls visible, whole exhibit overview missing |
| marker readability | BELOW | Original content/styles and dense facility line |
| information density | BELOW | Generic square diagram versus connected physical spaces |
| mobile usability | BELOW | Requires explicit overview after each switch |
| desktop usability | BELOW | Category overlay covers legend; margins alone not a defect |
| interaction cost | BELOW | Recovery click after switch |
| current-location support | NOT-YET-COMPARABLE | Aquarium ungeoreferenced; official claims positioning, not field-tested |
| route guidance | BELOW | Official route UI; ours out of scope |
| multilingual capability | BELOW | Official languages; Aquarium fixture Japanese only |

Real circulation, topology, stairs/lifts and building continuity are Floor Illustration/content debt. Routing, indoor positioning and multilingual architecture are competitive gaps, excluded from WU-66. UI changes cannot establish safe real-world wayfinding or content accuracy. Recheck after implementation in AQUARIUM-ACCEPTANCE.md.
