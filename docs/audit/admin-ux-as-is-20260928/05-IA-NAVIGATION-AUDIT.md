# IA and navigation AS-IS

## Route-backed navigation tree

```text
Admin entry: login → workspace selection / dashboard
Workspace
  Home → Map Home when Map context exists; otherwise Dashboard
  Assigned spots (only with assignments) → list → restricted Spot Editor
Map
  Illustration Map → [Basic settings | Floors/illustration | PIN placement | Spot fields]
      Floors → Decoration; Georeference
  Spots → [List | CSV import | Approval queue]
      List → New / Detail → Assignee; Detail links PIN editor
  Categories (first class)
Operations
  Publish → release list / rollback
  Paper Map → list → New / Edit → design request
  Analytics
Team
  Approval queue (also Spot subnavigation)
  Map editors (owner)
  Members (owner; Organization #members)
Management
  Audit (owner)
  Workspace settings (owner; Organization #settings)
Account disclosure → Password / Logout
```

`app/utils/admin-navigation.ts` defines group membership and active matching. `AdminNavigation.vue` renders desktop rail/expanded sidebar and workspace/current Map context. `AdminSubnavigation.vue` provides route-backed Illustration Map and Spot tabs. WU-41 intended an Organization and URL-authoritative Map context, permission-aware nav, and a mobile drawer; the current source still implements those core ideas.

## Specific relationships and exits

- Map New enters from dashboard and lands in Setup. Dashboard redirects to Map Home when there is a single Map. Workspaces changes active Organization.
- Map Settings back link goes to Dashboard; deep floor tools go to Floors. Georeference's back link changes to PIN Editor when `?from=editor` is present. New Spot can return to PIN Editor via a query context; Spot Detail can preserve a Spot-list `returnTo` path. These are useful context-aware exits, but not consistently named or signposted.
- Paper New/Edit back to Paper list. Paper design request is linked from Edit. Paper is first class under Operations but its editing screens use bespoke headers and do not show a Paper subnavigation.
- Revisions is present twice in navigation: Team sidebar and Spot subnav. It is the same destination. This may improve reachability but creates two parent models.
- Map Editors is a Team item and also linked from Settings. Categories is a separate Map item; Spot Fields is an Illustration Map subtab even though both define Spot content. This is an ownership/mental-model question, not a proven route error.
- No route-file orphan was established. `app/pages/admin` includes Login, Signup, and Password flows that are intentionally outside Map navigation. Legacy Paper Maps remain accessible through Paper list, per adoption policy.

**FACT:** the tree is from route files and `admin-navigation.ts`. **INCONSISTENCY:** related Spot schema pages have different navigation parents and Approval has two. **IMPACT:** admins may search under different groups and have to learn route-specific back paths. **HYPOTHESIS:** a parent/breadcrumb contract should describe context-preserving exceptions explicitly.

### Deep links and active state

`isAdminNavigationItemActive` uses path-prefix matching and special Organization hash handling. `AdminSubnavigation` treats Spot details as List and floor child routes as Floors. Contextual routes therefore generally retain their parent active state. Paper children remain active under Paper via prefix. Direct links are URL-authoritative for Map ID; a fresh role/permission browser pass was not possible here.

## Vocabulary and microcopy inventory

| Term family | Current contexts | Potential ambiguity |
|---|---|---|
| `公開`, `公開中`, `下書き`, `公開版`, `リリース` | Publish and release list; Spot eligibility; Paper source | Map visibility, Spot state and release snapshot are distinct, but all use “公開” language |
| `最新の編集内容`, `現在の編集内容`, `現在の公開版` | Publish action and Paper LIVE/PUBLISHED selector | “Latest” versus “current” may look like different sources; Paper New begins with current editing content |
| `保存`, `変更を保存`, `この位置を保存`, `この内容で保存` | Settings/Floors, PIN, Georeference | Same verb covers whole draft, section, per-Spot position; Decoration has no Save button |
| `キャンセル`, `変更を戻す`, `元に戻す`, `基準点をリセット`, `位置合わせを解除` | Spot/PIN, Paper, Georeference | Local discard/reset versus server DELETE must be distinguished at action point |
| `設定`, `編集`, `管理`, `戻る` | Sidebar, tabs, child headers/back links | Parent destination and scope are sometimes inferred only from context |

The list identifies semantics to test with operators; it does not prescribe replacement copy.
