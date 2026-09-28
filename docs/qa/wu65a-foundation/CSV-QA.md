# CSV contract and QA

PASS. CSV v3 already covers structured fields, Category membership, new-row human-readable Floor matching, enabled custom/standard fields and enabled translations. The starter supplies valid schema metadata and blank new-row identities. Nontechnical operators do not author internal IDs.

| Data | Contract / verification |
| --- | --- |
| Structured fields and Categories | Existing parser/export contract retained; multiple memberships and typed custom values tested. |
| New-row Floor | Human-readable unambiguous matching; unknown/ambiguous Floor rejected. No coordinate columns added. |
| Existing-row Floor | Spatial state is not reassigned through ordinary content import. Existing identity/version validation retained. |
| Enabled fields/translations | Disabled fields excluded; English columns only when enabled; legacy formats tested in `tests/spot-csv.test.ts`. |
| Publication eligibility | Not an added CSV business column. New rows remain unplaced and target-off; review eligibility separately through bulk commands. |
| Media/PIN source/coordinates | Not CSV responsibilities; no binary media, visual-source or coordinate expansion. |

`tests/wu65-foundation.test.ts` creates 37 rows from an empty-map starter; blank starter is not imported as a fake Spot. Local browser and Windows authenticated API each imported 37 and export→preview returned 37 UNCHANGED, zero conflicts/errors. Windows correctly rejected the Mac Map's schema fingerprint; using the Windows starter succeeded. Source-membership removal is validated during preview and transactional apply.

The schema/version IDs inside generated files remain implementation metadata, not operator-authored identity. Existing v1/v2/v3 compatibility tests remain in the suite.

Evidence provenance: completed WU-65 implementation `cea5827313ad1c0e55308edd9f4c7ec303892cff`, product merge/deployed Windows QA `46d9961ea3a5a500738ba33fa0755b41c555afd8`. These files reorganize existing verified evidence after receipt of the expanded instructions; they do not claim new browser runs. See [integration evidence](../wu65-spot-operations-at-scale/INTEGRATION-WINDOWS.md) and [instruction reconciliation](../wu65-spot-operations-at-scale/RECONCILIATION.md).
