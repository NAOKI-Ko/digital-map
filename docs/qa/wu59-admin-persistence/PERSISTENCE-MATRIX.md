# Persistence matrix

| Route | Model and saved boundary | Draft and dirty calculation | Save / command | Cancel or discard | Failure behavior |
|---|---|---|---|---|---|
| Georeference | Visual draft; saved floor reference points | Separate `savedDraft` and `draft` | PATCH two points; DELETE removal is confirmed command | Local clear empties candidate; `変更を破棄` restores saved points | Save error leaves candidate; removal error shown inline |
| Settings | Form explicit; one boundary per name, translation, SEO, branding | VeeValidate name dirty and three JSON snapshots | Independent PATCH actions; language and delete remain commands | Section-switch confirmation discards page drafts; route guard handles exit | Each save keeps its form on error |
| Organization | Form explicit profile; invitation/member commands | `savedProfile` versus form; unsent email also protected | PATCH profile; invitation/role/removal commands | Route guard offers stay/discard | Profile retains input on error |
| Fields | Form explicit per field/new field; reorder/delete commands | Original field snapshot and new-field defaults | PATCH/POST; reorder/delete immediate | Existing target dialog; new-field Cancel clears local inputs | Failed save keeps field draft |
| Spot Detail | Form explicit core and English independently | VeeValidate core dirty, English JSON snapshot | Core PATCH; English PATCH; photo/publish commands separate | Core Cancel resets saved form in place; route guard covers both | Failed core/English save retains draft |
| Categories | Form explicit per item and per English name; reorder/delete commands | Edit snapshot, new-item draft, English per-row snapshots | POST/PATCH; reorder/delete immediate | Edit Cancel discards; target switch prompts; route guard protects all drafts | Failed item/English save retains draft |
| Assigned Spot Editor | Form explicit revision; photo upload command | Revision payload/photo ID snapshot | PUT revision; upload commits asset separately | Route guard offers stay/discard | Failed Save retains draft; upload error is separate |
| Paper Edit | Visual draft; saved paper config/name | `savedSnapshot` versus local paper candidate | PATCH paper; PDF uses current preview without saving | `変更を破棄` restores saved config/name | Failed Save keeps candidate |
| PIN Editor | Visual draft; server position/design | Position candidate and design difference from selected spot | PATCH position/design; unplace immediate | Cancel/target switch prompts to discard candidate | Failed Save retains candidate |

One primary SaveFeedback message is used for each explicit save. Immediate operations retain their command feedback. Uploading media can persist an asset before the surrounding form; this is described in the UI where relevant.
