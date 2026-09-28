# Windows QA deployment and acceptance

## Release gates

- PR [#16](https://github.com/NAOKI-Ko/digital-map/pull/16) implemented WU-64 from base `b29b47f4711c5346e399df66ba990c19e02f8608`; implementation commit `3f0c51b46ab039678dfa631e73b91b9392d5b9a7`.
- Both pre-merge Verify runs passed. Merge commit `18eeb939305952cdfb72e99e5109c89dfee8a459`; post-merge Verify run `36422685927` passed.
- Predeploy backup `C:\DigitalMap\backups\wu64-pre-18eeb93-20260928` passed database, Media and Public checks.
- Windows staged release passed frozen install, Prisma validate, image/spatial audit, migration status, full tests, typecheck and production build. No migration was applied.
- Windows QA deployed exact merge SHA `18eeb939305952cdfb72e99e5109c89dfee8a459`. Digital Map, PostgreSQL and Cloudflare Tunnel were RUNNING; local HTTP and the active quick-tunnel URL passed health checks.

## Browser acceptance

| Case | Result |
| --- | --- |
| Map Home and Publish Preview entry | Both visible; return reached the corresponding admin page |
| Never-published Map | Disposable one-Floor/one-PIN LIVE Map rendered in authenticated Preview; public visitor URL unavailable; release count remained zero. Fixture removed after testing. |
| Published release versus LIVE | WU63 disposable Map public URL retained its old release while Preview showed a new LIVE Floor, PIN and Spot. Aquarium description A/B check confirmed the same separation. |
| Anonymous and unrelated user | Anonymous Preview API 401; QA account without Aquarium access 404. Temporary Aquarium memberships were removed after testing. |
| 390 px | Authenticated disposable Map Preview showed LIVE PIN, controls, compact Preview indication and return control. |
| Desktop | Aquarium Preview used the public visitor canvas at 1440 px; five Floors and 37 eligible PINs were accessible. |
| Publication isolation | Aquarium current release ID and public status unchanged; disposable never-published Map had no release. |

The disposable WU63 Map retains its intentional LIVE QA Floor and Spot without republishing. The separate never-published fixture was removed. Aquarium content was restored and its temporary QA memberships removed. Production was untouched.
