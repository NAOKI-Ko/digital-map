# LIVE versus published source isolation

Disposable local Map `wu64-local-disposable`:

1. Before its first release, Map Home Preview rendered the Floor, category, PIN and Spot description `PUBLISHED A`; the public visitor URL displayed the unavailable-map state.
2. The Publish UI created one release from A. A local QA-only database edit changed the LIVE Spot description to `LIVE B` without publishing.
3. Browser Spot detail at the public visitor URL still read `PUBLISHED A`; authenticated Preview read `LIVE B`.
4. The Publish UI unpublished the Map while retaining its release. The public URL again displayed the unavailable-map state; authenticated Preview still rendered the LIVE Floor and Spot.
5. Marking that disposable Spot ineligible (`isPublished=false`) removed its PIN and category from Preview. Eligibility was restored afterward.

Preview browsing left the release count at one. The LIVE description B remains only in this disposable database. No Aquarium or Arimatsu content was changed.
