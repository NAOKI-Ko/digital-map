# WU-53 access matrix

| User | 有松マップ｜ふぉん | 有松マップ｜たま | 有松マップ｜なう |
|---|---|---|---|
| ふぉん | OWNER | MEMBER + Map EDITOR | MEMBER + Map EDITOR |
| たま | MEMBER + Map EDITOR | OWNER | MEMBER + Map EDITOR |
| なう | MEMBER + Map EDITOR | MEMBER + Map EDITOR | OWNER |

Automated real-session QA proved all users see three Workspaces, can switch among them, can read/edit the target Map as owner or editor, and receive HTTP 403 for owner-only organization controls in non-owned Workspaces. Owners have no redundant MapMember row.
