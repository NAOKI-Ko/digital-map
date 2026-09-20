# Sidebar Navigation Design Contract

## Purpose

The admin Sidebar is **product identity + current context + navigation + account controls**. It is not a settings form.

The Sidebar must help a non-engineer answer:

- which Workspace is active;
- which Map is current;
- where each navigation action leads.

## Invariants

- The Sidebar never contains a Workspace `<select>` or Map `<select>`.
- Workspace switching begins at `/admin/workspaces`.
- The current Map is static context, not a second selector.
- The product logo leads to current Map Home when one Map is available, otherwise `/admin/dashboard`.
- `リアルマップ` remains visible and disabled with `準備中`; it never opens an empty editor.
- Existing permissions decide which destinations appear.

## Expanded and mobile hierarchy

1. `Digital Map` product identity.
2. `ワークスペース`: active Workspace name in a navigation row linking to `/admin/workspaces`.
3. `現在のマップ`: plain contextual text, or `マップ未作成`.
4. Navigation groups: Home, Map, Public/Operations, Team, Management.
5. Account controls.

The Workspace row uses a quiet hover state and chevron. The Map label has no border, dropdown affordance, or form-control styling. The mobile drawer uses the same hierarchy and preserves its existing focus trap, Escape behavior, focus return, and body scroll lock.

## Collapsed rail

- The context icon is a direct link to `/admin/workspaces`.
- Its accessible name and tooltip are `ワークスペースを切り替える`.
- It never opens a selector popover.
- Current Map context may be omitted.

## Navigation states

- Active: one Terracotta-tinted selected state.
- Hover: quiet neutral background.
- Disabled: visibly unavailable, non-interactive, and never color-only.
- Group labels: short Japanese labels without all-caps styling.

## Context boundary

A Workspace change is a hard context boundary. The Workspace List uses the existing `POST /api/organizations/active`, then reloads `/admin/dashboard`; old `mapId`, `spotId`, `floorId`, and editor routes are never carried into the new Workspace.

