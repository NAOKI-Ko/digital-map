# Admin publication vocabulary contract

**Status:** Frozen product decision, 2026-09-28. **Source:** `8980521550625e724fcc0b2bda9c46d93eeb0023`, `publish.vue`, `server/utils/paper-map.ts`, WU-51 text audit and AS-IS UX-010. Internal `LIVE`, `PUBLISHED`, `PublicRelease`, `isPublished` and IDs remain unchanged.

## Mental model

1. **編集中の内容** — the current editable source. It may differ from what visitors see, whether the Map is public or private.
2. **公開中の内容** — the current ready release **while the Map is public**. Visitors see this content, subject to Spot eligibility and public behavior.
3. **前回公開した内容** — a retained ready release while the Map is private. It is available for re-publication and, under current Paper behavior, as a source; visitors do not currently see it.
4. **過去に公開した内容** — an older retained release. Selecting one to restore changes the current public content and may make the Map public.

A Map's visibility, editable source and release identity are separate state dimensions. “非公開” names Map visibility. It does **not** mean all editable data is an unpublished draft, and it does not imply stored releases have been deleted. “公開中” must not be used for a private Map's retained release.

## Standard user-facing terms

| Concept / state | Preferred Japanese | Avoid as primary copy |
|---|---|---|
| Editable current source | **編集中の内容** | 現在の編集内容, 最新内容, LIVE, 下書き when Map is public |
| Public current source | **公開中の内容** | 現在の公開版, PUBLISHED, Snapshot |
| Map visible / hidden status | **公開中 / 非公開** | 下書き as a visibility badge |
| First publish from current edits | **編集中の内容を公開する** | Ambiguous 保存, 最新内容を公開 |
| Update a public Map with current edits | **編集中の内容を公開する** with supporting “公開中の内容が更新されます” | Silent replacement language |
| Resume retained release after stop | **前回公開した内容を再公開する** | マップを公開する when it does not use current edits |
| Stop publication | **マップを非公開にする** | 下書きに戻す |
| Release list | **公開履歴** | リリース as top-level user language |
| Historical restore | **この内容を公開する** plus date/confirmation | この版へ戻す without stating visitor effect |
| Technical ID | **公開履歴 ID** only inside details if support needs it | Release ID in primary UI |

“公開版” may remain in legacy help or technical details until migration; it is not the primary label for the visitor-visible source. WU-51 already moved visible `Snapshot` to `公開内容` and other internal nouns out of core UI; this contract continues that direction without altering internal names.

## Paper Map source selector

Label the control **元データ**. Choices are state-dependent and map to the unchanged values:

| Internal value | Map state | Display label | Explanation |
|---|---|---|---|
| `LIVE` | Any | **編集中の内容** | “公開中のマップとは異なる場合があります。” when applicable |
| `PUBLISHED` | Public + ready release | **公開中の内容** | “今、閲覧者に表示される内容を使います。” |
| `PUBLISHED` | Private + retained ready release | **前回公開した内容** | “現在は非公開です。以前の公開内容を紙面に使います。” |
| `PUBLISHED` | No ready release | Disabled/unavailable | “利用できる公開履歴がありません。先にマップを公開してください。” |

The conditional private-state label is essential: current `loadPaperMapSource` accepts `PUBLISHED` with a ready retained release even if `isPublished` is false (`server/utils/paper-map.ts:25-37`). Do not mislabel that content as currently public or silently remove a supported source mode. Paper-only overrides remain identified as **紙面だけの変更** and never imply edits to the Digital Map source. Paper New starts from `LIVE`; say **元データ：編集中の内容**.

## Spot and release qualifiers

A Spot can be marked for publication while remaining absent from a public Map because of missing illustration position or Map state. Use **公開対象のスポット / 公開対象外のスポット** when referring to Spot eligibility, with a short reason (such as position unset). Reserve **マップ公開中** for Map visibility and **公開中の内容** for the ready release seen by visitors. On Publish, explain that publishing captures eligible current edits into a new public result; a later edit alone does not update visitors' content.

Success and confirmation copy must name the resulting state: publication of current edits, resuming a retained release, stopping the Map, or restoring a dated historical release are different commands. Avoid technical release jargon in the primary action; retain dates/history for traceability.
