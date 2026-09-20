# WU-54 baseline repair evidence

## Local pre-repair recovery point

Verified three-component backup:

`/Users/naoki/Documents/Codex/2026-09-20/t/work/qa-baselines/arimatsu-wu54-pre-repair-20260920T144215Z`

- DB: `a36ec1bcee01cf8fa1187a308fb4ee29e6171b69480165e3c236331c4c288b4e`
- Managed Media: `a3166ae4d7cd66c8ce02d39af3ff6ed3f8904d7b2fbc1a1aff396770f4ceaaeb`
- Public Storage: `d02609c031e124f750fcbcf9bc673d8b4fccb1eb484f7aa160ace85b7f56a762`
- Backup verification: PASS

## Add-only repair and publication

The repair changed only missing `SpotFieldDefinition` rows: 0 to 6 per Map. Users, Workspaces, Maps, Spots, Categories, Media, permissions, and existing content were preserved. The second repair run added zero rows. Default-field, Arimatsu, Tenant, and IMAGE audits passed.

Each owner then republished through the normal publication path. New READY release IDs replaced `currentReleaseId`, while the old immutable releases remained:

| Map | Previous release | New release |
|---|---|---|
| `arimatsu-fon` | `cmu9salhx0000y8u1jk6knzyb` | `cmu9xik8100003su1hxmiot6q` |
| `arimatsu-tama` | `cmu9salxa0002y8u1q5vrfpr2` | `cmu9xiknd00023su16ekhtru4` |
| `arimatsu-nau` | `cmu9samd10004y8u1lczpnbqc` | `cmu9xil2700043su1xgx13zns` |

All three Maps have two retained READY releases and their public routes return HTTP 200.

## UI and export checks

- Chrome showed all six rows on each Map's Spot Fields screen.
- Disabled/non-public phone remained visible in settings as `停止中` / `非公開`.
- Spot create and edit forms exposed the five enabled defaults and excluded phone.
- CSV v3 exposed 紹介文, 住所, 営業時間, 定休日, and Webサイト, and excluded 電話番号.

## New authoritative Local baseline

`/Users/naoki/Documents/Codex/2026-09-20/t/work/qa-baselines/arimatsu-3user-wu54-20260920T145450Z`

- DB: `434f708c5fbb483ccdf2c63432b082b8fe6f7e224c5a7be31531b96996c9fcb9`
- Managed Media: `8f6c92f47bd5d7be5f2d615095d87c44c59562194515da2e238bf4de8ac6c1d5`
- Public Storage: `8c8813b609083f2216fade29200118f52a7fbeb775ea869633e694e164416c1a`
- Public Storage files: 30, retaining old and new immutable releases
- Manifest topology: 3 Maps, 6 standard Spot fields per Map, explicit semantic-key list

The bundle was restored into disposable DB, Media, and Public roots. Default-field, Arimatsu, Tenant, and IMAGE audits, `/api/ready`, and all three representative public routes passed.

The WU-53 authoritative bundle remains retained as historical evidence but is superseded because it omitted the default Spot Field invariant.

## Windows QA

Pending exact-SHA CI approval and remote execution. This section will be completed with pre/post backups, repair, republish, browser regression, and disposable restore evidence before the final verdict.
