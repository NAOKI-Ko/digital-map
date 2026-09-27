# Screen inventory

Source of truth: `app/pages/admin/**/*.vue` at `8980521`. The 32 file routes below include auth and signup entry routes; `/admin/maps/:mapId/**` is not represented solely by sidebar items. “No” guard means no route-leave guard found in the page/shared form, not proof that edits are lost in every state. “State” feedback means loading/error/empty UI rather than save feedback. Entry/exit destinations are summarized in Parent/Notes; [IA audit](05-IA-NAVIGATION-AUDIT.md) gives the route tree.

| Route | Screen | Purpose | UX type | Entity | Parent | Save model | Dirty guard | Feedback | Desktop layout | Mobile layout | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| /admin/login | Login | Authenticate | Specialized | Account | — | Submit | — | Inline | Split | Stack | Public admin entry |
| /admin/signup/complete | Signup completion | Create workspace | Wizard | Workspace | Signup | Submit | — | Inline | Form | Stack | Terms/privacy gate |
| /admin/dashboard | Dashboard | Choose/map summary | Dashboard | Workspace | Workspaces | None | N/A | State | Cards | Stack | Single map redirects to Map Home |
| /admin/workspaces | Workspaces | Switch active workspace | List | Workspace | Dashboard | Immediate | N/A | State | Cards | Stack | Active context mutation |
| /admin/organization | Organization | Settings and members | Settings | Workspace | Dashboard | Section + operation | No | SaveFeedback | Sections | Stack | Hash-based settings/members |
| /admin/organization/audit | Audit log | Read operations | Read | Workspace | Organization | None | N/A | State | Table/list | Stack | Owner-only sidebar |
| /admin/maps/new | New map | Create map | Form | Map | Dashboard | Submit | Yes | SaveFeedback | Form | Stack | Proceeds to Setup |
| /admin/maps/:mapId | Map Home | Read status/actions | Dashboard | Map | Dashboard | None | N/A | State | Cards | Stack | URL Map context |
| /admin/maps/:mapId/setup | Setup | Initial map setup | Wizard | Map | Map Home | Step/operation | No | SaveFeedback | Steps | Stack | After create |
| /admin/maps/:mapId/settings | Map settings | Edit map/brand/languages/SEO | Settings | Map | Map Home | Per section | No | SaveFeedback | Left section nav | Top tabs | Includes editor link/delete |
| /admin/maps/:mapId/floors | Floors | Manage floor images/order | List | Floor | Illustration Map | Per item/operation | No | SaveFeedback | Two columns | Stack | Links Decoration/Georef |
| /admin/maps/:mapId/floors/:floorId/decorations | Decoration | Place/transform decorations | Visual Editor | Floor | Floors | Immediate per operation | No | Toast + inline error | Canvas left/controls right | Stack | No sticky canvas |
| /admin/maps/:mapId/floors/:floorId/georeference | Georeference | Align illustration to real map | Wizard | Floor | Floors or PIN | Explicit whole draft | No | Toast + inline | Two maps | Stack | Contextual back target |
| /admin/maps/:mapId/editor | PIN Editor | Position and design spots | Visual Editor | Spot/PIN | Illustration Map | Explicit per mode | Yes | SaveFeedback + toast | Sticky map left | Map then inspector | Mode-dependent save |
| /admin/maps/:mapId/fields | Spot fields | Edit field definitions/order | List/Form | Field | Illustration Map | Per field/order | In-page only | SaveFeedback | List + inline form | Stack | Own dirty dialog |
| /admin/maps/:mapId/categories | Categories | Manage categories/order | List/Form | Category | Map | Per item/order | No | SaveFeedback | List + dialog | Stack | English name inline |
| /admin/maps/:mapId/spots | Spot list | Filter/bulk/manage spots | List | Spot | Map | Per operation | N/A | Toast | List/table | Stack | Query+scroll restoration |
| /admin/maps/:mapId/spots/new | New spot | Create spot | Form | Spot | Spot list or PIN | Submit | Yes via SpotForm | SaveFeedback | Form | Stack+fixed actions | Context return |
| /admin/maps/:mapId/spots/:spotId | Spot detail | Edit core info/translation | Form | Spot | Spot list | Main + translation | Main via SpotForm | SaveFeedback | Form | Stack+fixed actions | PIN link |
| /admin/maps/:mapId/spots/:spotId/assignee | Spot assignee | Assign/invite editor | Form | Spot | Spot detail | Per operation | No | Toast | Form | Stack | Team boundary |
| /admin/maps/:mapId/spots/import | Spot CSV | Preview/import/export | Wizard | Spot | Spot list | Import operation | No | Toast | Steps/table | Stack | Preview before import |
| /admin/maps/:mapId/editors | Map editors | Manage editor access | List | Map team | Map settings | Per operation | No | Toast | List/form | Stack | Owner-only |
| /admin/maps/:mapId/revisions | Revisions | Approve/reject changes | Lifecycle | Spot revision | Spot list | Per operation | N/A | Toast | Queue | Stack | Sidebar and Spot subnav |
| /admin/maps/:mapId/publish | Publish | Release/stop/rollback | Lifecycle | Map release | Map Home | Immediate operation | N/A | Toast + inline | Status/versions | Stack | Separate published and release states |
| /admin/maps/:mapId/paper | Paper maps | List/create/duplicate/export | List | Paper Map | Map | Per operation | N/A | Toast | Cards | Stack | Legacy item paths |
| /admin/maps/:mapId/paper/new | New Paper Map | Choose design from preview | Visual creation | Paper Map | Paper list | Create once | N/A | Inline error | Preview left/sticky choices right | Preview then choices | Choice only until create |
| /admin/maps/:mapId/paper/:paperMapId | Paper editor | Edit paper-only output | Visual Editor | Paper Map | Paper list | Whole draft save; PDF draft | Yes | Inline error | Inspector left/sticky preview right | Preview first + fixed actions | Source/override clear |
| /admin/maps/:mapId/paper/request | Design request | Request custom design | Specialized form | Paper request | Paper editor | Submit | No | Inline | Form | Stack | External service flow |
| /admin/maps/:mapId/analytics | Analytics | Read usage | Read | Map | Map | None | N/A | State | Chart/cards | Stack | Read-only |
| /admin/spot-editor | Assigned spots | Choose assigned spot | List | Spot | Workspace | None | N/A | State | List | Stack | Restricted role |
| /admin/spot-editor/:spotId | Assigned spot edit | Submit revision | Specialized form | Spot revision | Assigned spots | Submit revision | No | Toast + inline | Form | Stack | Approval, not direct Spot commit |
| /admin/account/password | Password | Change password | Form | Account | Sidebar account | Submit | No | Inline | Form | Stack | Redirects to login |
