# Revision review UI

The normal review page never renders raw JSON. The existing GET response remains backward compatible and adds `review`:

- `valid` and `stale`
- human-labelled changed fields with current/requested values
- optional current/requested managed-photo lists

The server creates this representation from the current Spot, current FieldDefinitions, managed current photos, managed requested photos, and the validated revision payload. Standard labels use product vocabulary; custom values use the current field label. Empty and boolean values render as `未設定` and `はい`/`いいえ`.

Unchanged fields and unchanged photos are omitted. A stale revision shows an explanation before action, disables `承認する`, and keeps `却下` available. The server's authoritative 409 guard remains unchanged.

Reject uses a Dialog with a required reason and preserves input on failure. Approve/reject semantics and persistence are unchanged; success uses Toast.
