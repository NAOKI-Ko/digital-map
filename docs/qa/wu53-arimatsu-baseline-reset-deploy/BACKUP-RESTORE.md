# WU-53 backup and restore evidence

Pre-reset bundle:

`/Users/naoki/Documents/Codex/2026-09-20/t/work/qa-baselines/arimatsu-pre-reset-20260920T121248Z`

- DB SHA-256: `61e7adc021ebae94953d49eb7a5391fbf2a49843fad94fd9d0238766479bed7a`
- Media archive SHA-256: `7a0889a4182676f2885d0d57aa6e20db3175e7c264cc1e102e298c9775a3ab93`
- Public archive SHA-256: `4fff4eda9f01f28a083cc3e8d8799be1cf08333914491f23c1c4a76afe402e96`
- Checksum verification and disposable restore: PASS

Authoritative published baseline bundle:

`/Users/naoki/Documents/Codex/2026-09-20/t/work/qa-baselines/arimatsu-3user-20260920T122127Z`

- DB SHA-256: `9c7319beb14af5215c03df92a8e579dc32e3a81b34c0f723b33bcd976a35eba4`
- Media archive SHA-256: `1c28e0fbd47b601bb35fd092d0a4fb1acec2010142b95666ced5582a057173db`
- Public archive SHA-256: `397ecb48c8d2e4e1f8fd76db8b47918a490d8b8daec56038b3f02f9e959d4f7e`
- Files: Managed Media 4; Public Storage 18
- Disposable DB: `digital_map_wu53_baseline_restore`
- Empty disposable Media/Public restore, baseline/Tenant/IMAGE audits, `/api/ready`, and three public paths: PASS

No archive contains plaintext credentials.
