# Revision review evidence

A disposable stale Revision was inserted only into the isolated QA database.

- Card showed Spot name, author, submitted time, and only changed human-labelled fields.
- Current and requested values stacked cleanly at 430×932.
- The stale explanation was visible before action and `承認する` was disabled.
- `却下` remained available and opened `変更申請を却下` Dialog with `却下理由`, Cancel, and disabled destructive submit until input.
- The Vue page contains no `JSON.stringify`; the response preserves legacy payload fields and adds a structured `review` representation.
- Managed photo comparison uses only tenant-owned MediaAsset storage paths loaded by the server.
