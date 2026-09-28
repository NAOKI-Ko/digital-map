# Bulk scope and transaction contract

PASS. One existing bulk architecture supports ADD/REMOVE Category, target on/off, PIN-source adoption/standard/freeze, strictly coordinate-free Floor assignment and existing deletion. Detailed individual appearance, photos/order, content exceptions and coordinates remain per-item.

`server/utils/spot-bulk.ts` is shared by POST bulk-preview and PATCH bulk. Commands are bounded to 100 IDs. Intent → preflight → reviewed before/after → discrete apply → result feedback. No giant dirty form and no generic Undo.

All-or-nothing Serializable transaction. One invalid/stale/unauthorized row rejects the entire command. Conflicts are shown before apply; updated/no-op counts returned. There are no silent skipped successes. After unknown network outcomes, reload and review authoritative state. [Original gate](../wu65-spot-operations-at-scale/65C-GATE.md).

Evidence provenance: completed WU-65 implementation `cea5827313ad1c0e55308edd9f4c7ec303892cff`, product merge/deployed Windows QA `46d9961ea3a5a500738ba33fa0755b41c555afd8`. These files reorganize existing verified evidence after receipt of the expanded instructions; they do not claim new browser runs. See [integration evidence](../wu65-spot-operations-at-scale/INTEGRATION-WINDOWS.md) and [instruction reconciliation](../wu65-spot-operations-at-scale/RECONCILIATION.md).
