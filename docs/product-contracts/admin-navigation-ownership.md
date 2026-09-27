# Admin navigation and ownership contract

**Status:** Frozen product decision, 2026-09-28. **Source:** `8980521550625e724fcc0b2bda9c46d93eeb0023`, WU-41 design, WU-50/51 navigation decisions, `app/utils/admin-navigation.ts`, AS-IS UX-006/007.

## Context authority

- **Workspace context** comes from the active authorized workspace. The sidebar presents its identity and a link to the Workspace list; switching uses the existing authorized operation and returns through Dashboard. It is not a client-only selection authority.
- For `/admin/maps/:mapId/**`, the URL `:mapId` is the **authoritative Map context**. Show the current Map name in the shell, but never infer access from UI selection. Server authorization and the permitted Map list remain authoritative for access.
- Assigned Spot Editor routes are a separate restricted task context. Do not fabricate a Map management sidebar for users who lack Map access.

The sidebar communicates product identity, current context and **primary destinations**. It is not a settings form or a catalogue of every child route. Preserve WU-51's Workspace switch link and read-only current Map label, role-aware items, responsive drawer/focus behavior and route-backed active state.

## Primary ownership

| Domain | Primary parent | Contextual links allowed |
|---|---|---|
| Map basics, branding, locale, SEO | Map Settings under Illustration Map | Map Home entry/actions |
| Floors, illustration, Decoration, Georeference | Floors under Illustration Map | PIN may open Georeference with return context |
| PIN placement/design and Spot fields | Illustration Map subnavigation | Spot detail may deep-link to PIN |
| Spot records, import, assignee | Spot list | PIN workflow may create Spot and return |
| Categories | First-class Map destination | Spot forms/settings may link here; do not duplicate editable category ownership |
| Publish, Paper Map, Analytics | Operations sidebar | Paper List is parent for New/Edit/Request |
| Revisions | Team sidebar primary destination | Spot subnav may retain contextual shortcut, clearly same queue |
| Map Editors and Members | Team sidebar | Settings may link to editor management |
| Workspace settings and audit | Management sidebar | Hash-based local sections within Organization |
| Account password | Account disclosure | No Map parent |

This freezes existing high-level ownership while resolving dual entry points as **one destination with one primary parent**. Categories and Fields remain separate because they serve different jobs: category classification versus Spot field schema. Moving either route is not required by this contract.

## Sidebar, subnavigation and local sections

- Sidebar: primary cross-domain destinations, role-aware, with active state on descendants.
- Subnavigation: route-backed sibling pages in one understandable workspace: Illustration Map (`Settings/Floors/PIN/Fields`) and Spot (`List/CSV`; the Approval queue may appear as a contextual shortcut). It does not recreate all sidebar groups.
- Local tabs/sections: views within one route or one scoped form (for example, Settings sections, Paper adjustment areas). They should not pretend to be a new global destination. Keep URLs/hash when deep-linking is useful, and protect dirty sections before a switch.
- Child tools such as Decoration, Georeference, Spot assignee and Paper design request remain contextual rather than new sidebar items.

## Back and deep-link rules

1. **List → Detail/New:** the default back target is that list. Preserve validated filter/scroll context when provided. A direct deep link gets the canonical list parent, not browser-history guessing.
2. **Settings → sub-editor:** return to the settings section or domain parent that launched it. The default parent is the canonical domain owner above.
3. **Floor → Decoration/Georeference:** return to Floors by default. If Georeference was explicitly launched from PIN, return to the same PIN Editor floor using a validated context parameter.
4. **PIN → Spot New:** on completion or Cancel, return to PIN Editor with the originating floor/Spot context when that workflow supplied it; otherwise use Spot list.
5. **Paper List → New/Edit:** return to Paper list; design request returns to its Paper Map item when supplied.
6. **Approval/assigned Spot:** keep the restricted task parent. A revision submission does not become a direct Spot Detail save.

Back links must name the destination (e.g. “紙マップ一覧に戻る”), not just “戻る.” Do not accept arbitrary external or cross-Map `returnTo` URLs; validate a return context against the authorized Map, route family and target. A dirty guard takes precedence over navigation, including a contextual back link.

## Future page test

For each route, record context scope, one primary parent, sidebar/subnav/local owner, direct-link fallback, task-return override and dirty navigation behavior. If two parents appear plausible, keep one as the owner and the other as a contextual link; do not duplicate the page or state.
