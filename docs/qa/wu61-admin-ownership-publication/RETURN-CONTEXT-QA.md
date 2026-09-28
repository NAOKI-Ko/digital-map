# Return-context QA

| Entry | Expected return | Evidence |
|---|---|---|
| PIN → Spot New with authorized floor | PIN on same floor; Save additionally selects new Spot | Browser Save created disposable Spot and returned with `floorId`, `placeSpotId` |
| Direct Spot New / invalid floor / arbitrary `returnTo` | Spot list | Browser invalid-floor and external-URL cases |
| PIN → Georeference with authorized route floor | PIN on same floor | Browser link and Back destination |
| Direct Georeference | Floors | Browser direct-route inventory |
| Spot list → detail with filters | same-Map Spot list filter | Browser `?q=WU61` detail Back and utility tests |
| Spot detail with external, cross-Map, child, or unknown query return | same-Map Spot list | strict utility tests |
| Paper New / Edit | Paper list | browser direct-route inventory |
| Paper design request with same-Map item | that Paper item | Browser valid item Back and invalid ID list fallback |

Return parameters are restricted to recognized routes and the active `mapId`; Spot-list filter values are constrained. PIN floor membership comes from the authorized floor list. Paper item membership comes from the authorized Paper list. No arbitrary URL redirect or server authorization change was introduced. Existing WU-59 dirty navigation guards remain mounted on editors and take precedence over these links.
