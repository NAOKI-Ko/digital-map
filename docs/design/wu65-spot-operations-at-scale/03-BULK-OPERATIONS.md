# Bulk operations and interaction

Decision D5. Source: [01 E2/E4](01-CURRENT-WORKFLOW.md). SAFE-BULK means a bounded group operation has clear meaning; it still requires authorization, review and atomic validation. CONDITIONAL-BULK requires explicit preconditions; PER-ITEM requires context/judgment, even if code could update many records.

## Operations

| Operation | Classification | Ship now? / semantics |
|---|---|---|
| Category ADD | SAFE-BULK | Keep. Set union with one chosen Category; duplicates are no-op; other memberships and style source unchanged. |
| Category REMOVE | CONDITIONAL-BULK | Keep. Remove only named membership, never Spot. Block any source-reference removal until separately resolved. No automatic visual winner. |
| Category REPLACE WITH | CONDITIONAL-BULK | Defer toolbar action; high risk of erasing secondary classifications. CSV already performs explicit reviewed full-set replacement. Do not label ADD as “set Category”. |
| Target off | SAFE-BULK | Keep. Set LIVE isPublished=false; released Map unchanged until Publish. Count changed versus already-off rows. |
| Target on | CONDITIONAL-BULK | Keep. Every selected Spot must have both x/y; reject all if any fail. No auto-place, auto-publish or deferred intent. Review audience consequence and counts. |
| Assign Floor before placement | CONDITIONAL-BULK | Add. Only records with x=y=lat=lng=null and isPublished=false; same Map; valid Floor. Sets existing required floorId, an intended placement Floor. Creates no PIN, copies no coordinates. |
| Move positioned/real-located Spot to another Floor | PER-ITEM | Excluded from bulk. Requires spatial review; general current form behavior is not a safe transfer contract. Do not offer a “clear all coordinates and move” shortcut. |
| PIN source Category / standard / freeze current | CONDITIONAL-BULK | Add [02](02-CATEGORY-PIN-MODEL.md) commands. Source membership preconditions; show before/after and overridden count. |
| Category default edit | CONDITIONAL-BULK effect | One Category explicit Save changes dependent LIVE PINs, with scope preview. It is not a hidden list operation. |
| Arbitrary shared PIN tuple | CONDITIONAL-BULK | Defer bulk copy-style command. Category defaults cover demonstrated repetition; explicit per-item override remains. |
| Custom field set/clear | CONDITIONAL-BULK | Valid for homogeneous reviewed values, not a first-release list feature. Use typed CSV for content maintenance; preserve required/type/map constraints. No blanket field overwrite. |
| Unique text, translations needing judgment | PER-ITEM authorship | CSV may carry many individual values; this is not “same value for all”. |
| Photo selection/order, PIN position, exception design | PER-ITEM | Use contextual editor, no automatic mass association or geometry. |
| Delete Spots | CONDITIONAL-BULK, destructive | Existing action remains separate, explicit count/names and irreversible warning. No expanded scope or restore promise. |

Coordinates (including lat/lng) cannot be reset, transformed or carried across Floors by a bulk command. A coordinate-free existing Spot can be assigned a corrected Floor without schema change. Its future placement is still a visual task. Do not introduce a second `intendedFloorId` that could disagree with required floorId. If any coordinate exists—even real-map only—or a malformed one-sided pair exists, block Floor bulk and explain the per-item requirement.

## Selection scope

- Keep row checkboxes with accessible Spot names, indeterminate select-all and `N件選択中`.
- Label select-all **検索結果N件を選択**. Current list is unpaginated: all returned results equals the filtered set, not the whole Map or just the viewport. Do not use two misleading identical “visible/filtered” actions.
- Preserve current cap 100 per command; do not silently truncate. If results exceed 100, disable all-results selection with instruction to narrow filters/select up to 100. Pagination/global tokenized selection is deferred.
- Filter/sort change clears selection and announces it; never retain hidden selected rows. While the command review is open, freeze selection/filter controls. A changed filter draft is UI state, not dirty business data.
- Capture IDs and expected versions when opening review. Re-query exact IDs/map access and preconditions at commit. Do not re-run a mutable filter as the mutation target.
- Combined keyword/category/Floor/position filters must mean intersection. The current list query spreads two possible `OR` properties; a keyword plus unpositioned filter can overwrite the keyword OR. Include a focused regression fix/test when list work ships so the shown operation scope is trustworthy.

## Command review, mixed values and confirmation

Open a bounded sheet/dialog with action verb, selected names/Floors, current-value summary and proposed changes. `値が混在` is display information, never a value to write. Keep `変更しない` as the default in any value control. No checkbox click writes domain data.

Examples:

- `カテゴリー「展示」を追加：37件（追加32件、登録済み5件）。他のカテゴリーは残ります。`
- `カテゴリー「休憩」を外す：8件。うち2件はPINの設定元です。先にPINの設定元を変更してください。`
- `フロアを「南館2F」に設定：7件。座標がある2件は実行できません。` The user must explicitly select only the five eligible rows; the system must not silently skip two.
- `カテゴリー既定を使う：30件。個別設定から変更する12件を含みます。公開中の内容はマップを公開するまで変わりません。`

The review action `このN件に適用` is the single command boundary; no extra page Save or per-row Save. Preview/cancel persists nothing. Destructive deletion uses the existing destructive confirmation. Eligibility changes, source replacement and broad style changes require consequence review in this same dialog, not stacks of duplicate confirmations. Individual style reset also uses a visual draft and named Save.

## Atomicity, concurrency, undo and failure

Commit all selected changes in one transaction; authorization, versions, membership/Floor/position validation occur inside it. Deduplicate IDs. On any conflict or validation failure, change none, retain reviewed action, list offending Spots/reasons, and offer refresh/re-review. Return changed, unchanged and total counts, not a misleading changed count for no-ops. Lock while in flight. A lost response requires reconciliation against server state before retry; set/add/remove commands are idempotent in outcome, and retry must not be assumed to have failed.

No generic Undo in the first release. Reversible category/eligibility changes have explicit inverse commands; a prior source can be reselected, but “restore Category inheritance” resolves today's default, not yesterday's pixels. Preserving a prior custom tuple is not guaranteed after an intentional reset unless retained by the implementation's normal history. Therefore preview old/new and warn that overrides are being replaced. Delete remains irreversible. Do not advertise a toast Undo that cannot survive concurrent edits.

Record actor, action, target IDs/count and outcome using the existing audit infrastructure. Do not log sensitive content as bulk metadata. One operation should have one authoritative result message. Selection clears only on successful commit; error retains selection. Leaving an edited review draft uses Stay/Discard; normal row selection alone does not require a dirty guard.
