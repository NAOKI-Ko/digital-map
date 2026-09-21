# WU-57 Browser / Visual QA

Environment: local Nuxt dev server + PostgreSQL, authenticated OWNER account, 2026-09-21 JST.

## Flow exercised

1. Opened the Paper Map landing page.
2. Verified the visually primary recommended action, configured-create action, saved map area, and managed-design consultation section.
3. Opened the three-choice purpose screen and created `MAP_FOCUS` in one click.
4. Verified immediate preview and actionable empty/public-data warnings.
5. Changed A4 to A3 and added a subtitle; live preview updated without saving.
6. Expanded optional controls and verified density, photo, order, theme, source, viewport, QR and logo choices.
7. Saved explicitly; success toast appeared and dirty/save state cleared.
8. Reloaded after ten demo spots became public-visible; preview showed ten numbered pins and ten matching legend entries.
9. Generated PDF from the current editor draft; success toast appeared.
10. Verified the responsive stacked layout at the available 842px browser width. Desktop uses the same editor with a sticky preview at the `lg` breakpoint.

## Observations

- No freeform positioning affordance appears.
- No blocking dialog or native confirm is used; delete uses the shared accessible confirmation dialog.
- Empty source, missing logo and release-unavailable states use plain Japanese messages.
- No page error, request failure, hydration error, or visible console-error overlay occurred during the exercised flow.
- Screenshot evidence was inspected in-session; no credentials or private personal data were captured or committed.

Verdict: PASS.
