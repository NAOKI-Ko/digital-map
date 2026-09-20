# Decoration direct manipulation

## Interaction contract

- The canvas is the primary editor for position, width, and rotation. The inspector only exposes `後ろへ`, `前へ`, `複製`, and `削除`.
- Selecting an object creates a local `DecorationDraft`; server-returned objects are never mutated while a gesture is active.
- Move, resize, and rotate update the draft through one `requestAnimationFrame` queue. A completed pointer gesture sends one PATCH; `pointercancel` sends none.
- A failed PATCH restores the exact interaction-start draft. A successful PATCH replaces the canonical client item with the server response.
- Resize changes width only, so source aspect ratio is preserved. Distance from the object center makes it independent of current rotation.
- Rotation is calculated around the center and normalized to `[-180, 180)`.
- The body and both handles are keyboard focusable. Arrow keys make a small change; Shift+Arrow makes a larger change. Handles are 44×44 CSS pixels for coarse pointers.
- Bounds include the rotated visual extents. Selection without movement does not write.

## Commands and feedback

- Duplicate preserves asset, width, and rotation, applies a small offset, selects the new item, and announces `装飾を複製しました`.
- Delete uses a destructive confirmation titled `装飾を削除`. It deletes only the FloorDecoration relation, never the MediaAsset.
- Repeated gesture completion uses the keyed `decoration-save` Toast, so messages coalesce.

No database or schema change is required.
