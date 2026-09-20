# WU-51 Visual QA

## Required views

- Sidebar expanded at 1280×800.
- Sidebar collapsed at 1280×800.
- Workspace List at 1280×800, 390×844, and 430×932.
- Mobile drawer at 390×844 and 430×932.
- Text input focus and non-field keyboard focus.
- Home, Illustration Map, Spot, Category, Publish, Access status, Change requests, Workspace settings, Operation history, and CSV views.

## Acceptance checks

- Workspace and Map names do not overflow.
- No selector or selector-like border remains in Sidebar context.
- `リアルマップ / 準備中` does not look clickable.
- Workspace rows meet a 44px-class touch target and communicate current state without color alone.
- Focus is Terracotta, visible on white/stone surfaces, unclipped, and never doubled with a black ring.
- Drawer Escape, focus trap, focus return, and body scroll lock remain intact.
- No stale content from the old Workspace remains after switching.

## Runtime results

- PASS — Expanded and collapsed Sidebar checked at 1280×800. The collapsed Workspace control is a direct link; no popover or selector remains.
- PASS — Workspace List checked at 1280×800, 390×844, and 430×932. Both OWNER and MEMBER memberships rendered, the active row included `使用中`, row height was 88px, and no viewport had horizontal overflow.
- PASS — Mobile drawer checked at 390×844 and 430×932. Workspace is a link, Map is static context, Real Map is visibly unavailable, Escape closes the drawer, focus returns to the trigger, and body scroll lock is released.
- PASS — Switched from the seeded primary Workspace to a no-map secondary Workspace and back. Navigation returned through `/admin/dashboard`; the secondary context showed `マップ未作成`; no previous-map content remained.
- PASS — Keyboard-focused links/buttons use a 2px Terracotta outline with 2px offset. Native text input and `UiSelect` use Terracotta border plus a 3px soft ring (`#fbe8e3`) with no black outline.
- PASS — A dialog moved focus into its first control; Escape closed it and returned focus to `＋ 言語を追加`.
- PASS — Home, Illustration Map, Spot, Category, Publish, Access status, Change requests, Workspace settings, Operation history, and CSV screens were swept at 390px. No horizontal overflow or high-risk legacy wording remained. The CSV heading is `CSVでまとめて編集`.
- PASS — A fresh browser tab loaded `/admin/workspaces` with no console warnings or errors.
- PASS — Automated accessibility/axe tests passed as part of the full Vitest run.

Browser evidence was inspected directly during UAT; no credential, database, or user-content artifact is retained in this directory.

## Windows QA

Windows QA is blocked by environment availability. The configured SSH endpoint for `chiffonchan` timed out before the deployment guide could be read. No remote backup, deploy, database mutation, service restart, or browser check occurred. Local disposable QA and GitHub Actions remain fully passing, but they do not substitute for the mandatory Windows gate.
