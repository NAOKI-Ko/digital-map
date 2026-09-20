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

### Exact-SHA deployment

- Implementation SHA: `4d59caae58f011d6940fa61a8be11f1181d238ed`
- GitHub Actions Verify: `35518510261` PASS
- Source archive SHA-256: `ba9b59dcd6dd6e0c95c5408de204a5ad229224c500dbb5ee5dd298eba89530bf`
- Release: `C:\DigitalMap\releases\4d59caae58f011d6940fa61a8be11f1181d238ed`
- Local and public readiness: HTTP 200

Windows rebuilt the exact archive and passed Prisma validation/generation, 86 test files and 572 tests, typecheck, production build, Tenant audit, and IMAGE audit before activation.

### Windows pre-repair recovery point

`C:\DigitalMap\backups\wu54-pre-30b983b-20260920-151142`

- Previous runtime: `30b983b1ae15083a8a857d95f61d1a59082cefe4`
- DB: `236a42a8d486edfde1f65b59ab8a964a259267d0701b5d62b9854cb54d653604`
- Managed Media: `81d7c9caf06dc60af6e2e0b2d6af8cfad782f6f13abcd9ab599f796b7f1f305d`
- Public Storage: `d2b5b805814dde8282b5d49c344a52b004992662bf1198aa4f5fcea4e131408b`
- Verification: PASS before deployment or repair

The active-data audit showed that `arimatsu-fon` had one existing custom field and zero standard fields; `arimatsu-tama` and `arimatsu-nau` had zero definitions. The accepted repair preserved the custom field and added six standards to each Map. A second guarded run added zero rows.

During release preparation, PostgreSQL integration tests were initially pointed at the active QA database and left a fourth test Map. The post-repair Arimatsu audit detected this and stopped acceptance. The complete verified pre-repair DB + Media + Public set was restored, returning the topology to 3 users / 3 Workspaces / 3 Maps / 48 Spots / 12 Categories / 3 MediaAssets before the accepted repair was rerun. No contaminated state was accepted or backed up as the WU-54 result.

### Windows functional result

- Chrome: six standard rows on all three settings screens; phone shown as `停止中` and `非公開`; the existing custom field remained on `arimatsu-fon`.
- Spot create/edit: enabled description/address/hours/holiday/website fields rendered; phone did not.
- CSV v3: 説明, 住所, 営業時間, 定休日, Webサイト included; 電話番号 excluded.
- Three-user Owner/Editor access matrix: PASS over encrypted SSH localhost forwarding; plaintext credentials were not sent through the public tunnel or copied to Windows.
- Normal owner publish flow: PASS for all three Maps; old release history retained.
- Public routes and public/local readiness: HTTP 200.

| Map | Previous release | New release | History |
|---|---|---|---:|
| `arimatsu-fon` | `cmu9salhx0000y8u1jk6knzyb` | `cmu9z3vg80000zovaw2vimp1m` | 2 |
| `arimatsu-tama` | `cmu9salxa0002y8u1q5vrfpr2` | `cmu9z3wji0002zova4tvyxcwl` | 2 |
| `arimatsu-nau` | `cmu9samd10004y8u1lczpnbqc` | `cmu9z3x400004zovanj17ites` | 2 |

### Windows post-fix recovery point

`C:\DigitalMap\backups\wu54-post-4d59caa-20260920-153420`

- DB: `2eb05a24ee1aaf3a3f092293aefcae0d3de287eb95bb8920fcca2ea83ab1b1f1`
- Managed Media: `67770cb19309f0540acb6514fbcacc551475bd4cc77517531024c73c52de0999`
- Public Storage: `16f80b82b9fa05de4cc107dd25256f83c7660e5ccd207e06e2bd6e08597c388c`
- Backup verification: PASS
- Disposable restore: separate DB plus empty Media/Public roots; default-field, Arimatsu, Tenant, IMAGE, readiness, and all three public routes PASS
- Cleanup: disposable DB and restore roots removed after proof; all WU-53 and WU-54 backups retained
