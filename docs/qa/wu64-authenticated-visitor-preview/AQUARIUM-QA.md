# Aquarium Windows QA

Tested on Windows QA at implementation SHA `18eeb939305952cdfb72e99e5109c89dfee8a459` against the existing `【非公式UAT】名古屋港水族館 館内マップ`. The Map was neither rebuilt nor republished.

## Baseline and source isolation

- Before the LIVE edit, the Map was public, had current release `cmukwfp30003hc8va3evrt3vp`, five Floors and 37 Spots.
- A temporary marker was added to the Dolphin Spot description in LIVE through the admin UI. The public visitor detail retained the old description; authenticated Preview showed the marker. No Publish action was taken.
- The original description was restored through the admin UI. A database read confirmed the exact original value, no test marker, the same current release ID, public status, five Floors and 37 Spots.
- The QA account's temporary Aquarium Workspace and Map memberships were removed. Both membership counts returned to zero, and its subsequent Preview request returned 404. Anonymous Preview API returned 401.

## Visitor surface

- Authenticated Preview rendered all five Floors. Eligible PIN counts by Floor were 11, 4, 6, 9 and 7, totaling 37.
- Floor illustrations loaded. On North 2F, Spot detail and the Dolphin photo loaded; the photo's browser natural width was 1280 px. The LIVE visitor DTO contained the two North 2F decorations.
- On South 3F, choosing the exhibition category reduced the visible PINs from seven to four. Spot detail opened from a PIN.
- Map Home and Publish both exposed Preview, and the Preview return link went back to its entry surface.
- Aquarium Preview was inspected at Desktop width. The 390 px authenticated Preview check used the separate disposable WU63 Map; the Aquarium public visitor surface was also inspected at 390 px. Both public and Preview routes use the same `VisitorMapExperience.vue` renderer. The public Map's existing mobile Floor-fit limitation (AQUA-007) remains deferred.

No Aquarium access grant or test description remains. No Aquarium release was created or changed by Preview.
