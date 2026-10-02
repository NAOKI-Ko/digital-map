# Parity / regression
Public route and authenticated LIVE Preview both instantiate VisitorMapExperience → MapViewer → useMapViewer/useMapCamera, with identical priority, collision and initialSpots input. No Preview patch. Preview endpoint remains requireMapAccess, private/no-store, noindex and Vary Cookie.
Authenticated browser parity is pending existing-QA credential approval; automatic approval review rejected use of the credential file without explicit authorization for that source. Unauthenticated/public browser and shared-renderer/source parity are verified.
Existing current-location capability gating and imageToRenderCoordinates/getFloorCorners paths unchanged. Integration/unit regression tests PASS. Local public response remains structurally identical. Windows baseline backup and digest are verified; activation and after digest are pending the Verify gate.

## 68-09

Public and Authenticated LIVE both still render VisitorMapExperience→MapViewer→useMapViewer→useMapCollisionRecovery. No Preview-specific collision/camera patch. Detail recovery is removed from the shared component. Code parity PASS; exact-SHA authenticated browser parity PARTIAL/pending behind mandatory audit/Verify. See08-MAP-ONLY-RECOVERY-QA.md for current responsive/focus/spread evidence.
