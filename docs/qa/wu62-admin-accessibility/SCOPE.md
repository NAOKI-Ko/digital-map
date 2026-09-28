# WU-62 scope

Base: `5aa7887a727d0e6524d817f89f4f5ac6b6cb3c0b` (WU-61 PR #11 merge; post-merge Verify 36361997398 PASS).

Primary implementation: keyboard selection and adjustment of both illustration and real-map calibration points in `GeoReferenceWizard`, using the existing `GeoReferenceDraft` and Save endpoint. Keep the two-canvas structure, math, transform, validation tolerances, and persistence model.

Review existing small UI primitives on Paper Edit, Decoration, Georeference, Settings, Categories, and PIN. Extract only repeated semantic behavior that meets the frozen threshold. Run cross-phase authenticated browser regression on disposable data, especially dirty navigation and Back/Forward.

No route, API, schema, RBAC, public visual UI, Production, main, or Windows deployment change is in scope.
