# First-Map continuity

Before fix, `AdminNavigation.vue` fetched a precreation `/api/maps` list and derived visible Map destinations from that stale list, despite `/admin/maps/:mapId/setup` having the correct new ID. The first local browser attempt with implicit `refreshNuxtData('/api/maps')` **reproduced the bug**. Nuxt's actual useFetch cache entry was not refreshed by that string.

After fix, sidebar and dashboard share explicit key `admin-map-list`; create/rename/delete call `refreshNuxtData(ADMIN_MAP_LIST_KEY)`. Route `mapId` stays authoritative; the sidebar matches it only against the authorized list, and never falls back to an unrelated singleton Map for a mismatched route ID. Workspace switching still uses its existing full app reload contract because that switches tenant/session authority.

A second disposable account created its first Map in the browser. **Without reloading**, the resulting setup route showed its Map name and the sidebar exposed Categories, Spots, Publish and Paper. Browser expansion confirmed all four exact destinations. No `window.location.reload()` was introduced.

Windows QA reproduced the same acceptance with fresh Map ID `cmul6ivny0007owva9vtgus3r`: after Create, the browser landed on `/admin/maps/cmul6ivny0007owva9vtgus3r/setup?saved=map-created` and the first resulting accessibility state already contained the correct Map name plus Categories, Spots, Publish and Paper links. No browser reload occurred. These links remained present in the browser accessibility tree at 390, 768, 1024 and 1440 px viewport widths.
