# 390px visitor review

Actual local Public route: http://localhost:3067/nagoya-aquarium-uat-20260928, 390×844. This is the shared VisitorMapExperience renderer with native UI/PINs, not an image-only mockup. An authenticated Admin Preview session is not claimed.

Native PIN button rectangles are 60×60px. After revisions, pairwise target-overlap counts: North2 0/11, North3 0/4, South1 0/6, South2 0/9, South3 0/7. All floor choices were exercised through the actual selector. Labels obscured in early revisions were moved or PIN anchors spaced; stairs were moved off water and into the shown circulation gallery.

North2 equipment filtering reduced the view to the two matching records. Dolphin detail opened its existing licensed photo and attribution. The floor identity remains explicit, display water cannot be confused with a walkable shortcut, and bridge/vertical connections remain labelled. New differentiated pictograms are composed inside the existing native PINs.

Final Windows QA review completed; see below.


## Final Windows QA verification — 2026-09-29

Actual Windows QA public release `cmum8fu9i0013iwva9733nbgi` was reviewed through the public VisitorMapExperience at 390×844 and 1440×1000. All five floor selector choices, one representative detail per floor, North2 equipment filtering (exactly locker + accessible WC), and existing Dolphin/Beluga/Orca photo attribution were exercised. Native marker counts 11/4/6/9/7; pairwise 60px target overlap counts all zero in initial full-floor mobile views. Loaded final artwork and pictograms were visually inspected. No browser console errors were reported. Cold image loading was allowed to complete before judging visuals. Detail opening pans the map; the existing full-map control restores overview.

This validates the actual public shared visitor renderer; no authenticated Admin Preview session or physical mobile-device test is claimed. Browser screenshots were viewed inline in the task history; no persisted screenshot artifact is claimed.
