# Authorization QA

Local built server on `127.0.0.1:3144`, isolated disposable database:

| Request | Result |
| --- | --- |
| Owner session, Map Home → Preview | Visitor canvas and LIVE Spot rendered |
| Anonymous Preview API | HTTP 401 |
| Anonymous Preview HTML | HTTP 302 to Login with internal redirect; private/no-store and noindex headers |
| Authenticated user in a different Workspace, Preview API | HTTP 404 |

The unrelated user had its own Workspace so Login succeeded. It held no membership in the target Map's Workspace. No tokens or cookie values are recorded.
