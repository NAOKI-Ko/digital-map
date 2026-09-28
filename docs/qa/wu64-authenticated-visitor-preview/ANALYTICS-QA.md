# Preview analytics

`VisitorMapExperience.vue` gates both `SPOT_VIEW` and `recordMapViewOnce` behind `analyticsEnabled !== false`. The public page uses the default; Preview explicitly passes `false`. A focused source contract test checks this wiring. The Preview API itself emits no analytics event.

The disposable database showed one release and zero flushed Map/Spot daily counters after Preview browsing. Counter totals alone are not decisive because public analytics are buffered. Windows QA should confirm Preview interactions do not add visitor analytics, allowing for buffered public traffic and existing Aquarium activity.
