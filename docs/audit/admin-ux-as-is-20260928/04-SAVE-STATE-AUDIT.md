# Save, cancel and dirty-state AS-IS

A save action means an API mutation, unless stated as local-only. “No guard” was verified by page and shared-form inspection; internal dialogs do not protect browser/tab or route exit.

| Screen | Persistence model | Save action | Cancel / reset | Dirty detection / navigation guard | Success / error | Risk |
|---|---|---|---|---|---|---|
| Map New | Whole form | POST create | Navigate dashboard; local draft discarded | Form dirty + guard | SaveFeedback | Low |
| Spot New / Detail core | Whole Spot form | POST/PATCH | Navigate contextual parent; local-only | VeeValidate `meta.dirty` + guard inside SpotForm | SaveFeedback | Low; detail translation separate |
| Spot Detail translation | Separate form | Translation API | None | No independent guard identified | SaveFeedback | P2 local unsaved translation |
| PIN position | Per selected Spot | PATCH position | Restore local candidate | Page dirty + guard; transition confirmation | SaveFeedback | Low |
| PIN design | Per selected Spot | PinDesignEditor save | Restore saved design draft | Editor/page guard | Toast + page feedback | P2 mixed feedback |
| Paper New | Create operation | POST Paper Map | Navigate list | Choice is not persisted; no guard | Inline error | Low |
| Paper Edit | Whole Paper config/name draft | PATCH save | `resetDraft()` reloads last saved local response | JSON snapshot dirty + guard | Inline error; disabled Save on clean | Medium: PDF uses unsaved draft by design and says so |
| Decoration | Immediate per add/gesture/reorder/delete | POST/PATCH/DELETE per operation | Failed mutation restores snapshot; no user Cancel | No guard, since mutations commit immediately | Toast + inline error | P2 predictability |
| Georeference | Whole point draft; DELETE immediate | PATCH save | “Reset points” empties local draft; saved state unchanged until Save | No dirty/leave guard | Toast + inline status/error | P2 possible lost point work |
| Floors | Per item and reorder | POST/PATCH/DELETE | No whole-form cancel | No guard | SaveFeedback | P2 if inline unsaved floor fields left |
| Categories | Per category and reorder | POST/PATCH/DELETE; English separately | Close editor restores local edit | No route guard | SaveFeedback | P2 English input mutates list item before save |
| Fields | Per field and order | PATCH/POST/DELETE/reorder | In-page dirty dialog can save/discard | Internal dirty dialog; no route guard | SaveFeedback | P2 route exit exposure |
| Map Settings | Per basic/translation/SEO/branding; language operation | Multiple PATCH endpoints | No global cancel | No guard | Multiple SaveFeedback | P2 section draft loss |
| Organization | Settings submit; members/invitations per operation | Multiple APIs | No global cancel | No guard | SaveFeedback | P2 settings draft loss |
| Setup | Per step/operation | Category/floor actions | No global cancel | No guard | SaveFeedback | P3 task model unclear |
| Spot assignee / Map editors | Immediate per operation | Invite/assign/remove | Dialog cancel before action | No draft guard | Toast | Low |
| Spot list / Paper list | Immediate bulk/delete/duplicate/export | Operation | Confirmation where destructive | N/A | Toast | Low |
| CSV import | Preview then import commit | Import API | Back before import | No persistent draft | Toast + inline | Low |
| Publish / Revisions | Immediate lifecycle action | Publish, rollback, approve/reject | Some confirmation; no edit draft | N/A | Toast + inline error | High consequence; distinct by design |
| Assigned Spot Editor | Revision submit | POST revision, not direct Spot update | Navigate list; local draft gone | No guard | Toast + inline error | P2 leave loss; revision semantics must remain |
| Design request | Submit request | POST | Navigate Paper editor | No guard | Inline | P3 form loss |
| Password | Submit and logout | POST | None | No guard | Inline | P3 form loss |

### Contradictory models

- “保存” in PIN/Paper means commit a draft. Decoration's drag has no Save step and commits immediately. Its toast says saved, but the entry state does not state this persistence rule.
- Georeference “基準点をリセット” is local-only and explicitly says so; “位置合わせを解除” deletes server state immediately. The labels are close but semantics differ.
- Paper Edit PDF serializes the current unsaved config; its copy explicitly discloses this. This is a coherent exception worth preserving.
- Settings has several SaveFeedback areas; success in one section does not imply another section is saved. The UI should be judged at section granularity.

Source: `SpotForm.vue:81-110,181-188`, `UnsavedChangesGuard.vue`, `editor.vue:209-233,519-529`, `paper/[paperMapId].vue:46-77`, `decorations.vue:52-79,97-229`, `georeference.vue:75-127`, `settings.vue:67-180,234-317`, `fields.vue:79-123`.
