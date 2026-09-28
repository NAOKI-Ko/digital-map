# 65D local gate and facility replay — PASS

Prerequisite 65C: `d532e1e`. Synthetic fixture only; actual Aquarium and Arimatsu remain unchanged.

## Placement / media

- Opt-in Floor queue reconstructs unplaced records in stable name/ID order. Skip leaves the record unplaced; reload includes skipped items again. Floor changes end the current queue and require deliberate restart.
- Save-and-next is an explicit button with normal keyboard activation, no global Enter shortcut. The queue advances only after successful coordinate persistence and refresh, retaining Floor/camera. Design saves do not advance the queue.
- A browser network abort on the first save retained 展示01 and its candidate. Unblocking and retrying saved it and advanced to 展示06 on the same 1F, with the old candidate cleared.
- 37 successful visual placement saves across five deliberate Floor sessions: 8/8/7/7/7. Each Floor ended explicitly; none changed publication eligibility. This synthetic distribution is not the original Aquarium's distribution.
- Concurrent Spot/Floor changes reject stale coordinate saves. Final built-app test rejected a stale Floor timestamp (409) and accepted the current timestamp with unchanged coordinates.
- Photo panels open from the list with a named Spot. Three separate synthetic images were selected/registered through the UI for three Spots; 34 have no photo, without a completeness penalty. Counts update on the list; photos remain per-item decisions.
- Photo list replacement uses a Spot version and keeps the existing photo set on failure. Registered media remains independently managed. Category default references now protect images from garbage collection as well as direct deletion.

## End-to-end result

CSV starter → 37 imported rows → explicit reviewed Category adoption → 37 individual spatial saves → three individual photo assignments → reviewed target-on for 37 → authenticated Preview → local publication.

The final Preview and release each contained 37 Spots, all with the intended inherited green PIN style. Synthetic local release: `cmulq31ud0008d8u1jfjgqost`. This does not publish or alter the actual Aquarium or Arimatsu Maps.

- [Queue and inherited style](evidence/65d-queue-start.png)
- [Visitor Preview](evidence/65d-visitor-preview.png)
- Built editor checked at 390/768/1024/1440px: canvas and queue controls present, no horizontal overflow.
- No browser page errors in the final Preview.
- DB-backed full suite: 665 passed, one private-backup test conditionally skipped in that run; the private-backup test was separately executed and passed at 65B.
- Typecheck, Nuxt build, dependency security audit, tenant/spatial/Paper database audits passed.

## Workload interpretation

The original product already supported structured CSV v3 and Category bulk edits; WU65 does not claim those were absent. The gain is a discoverable starter, explicit source inheritance/adoption, coordinate-safe group corrections, reviewed eligibility commands, photo panels and a continuous placement queue. The synthetic run needed no per-Spot Detail visits for repeated classification, Floor, style or target decisions. It still needed 37 spatial decisions and three photo choices. No fabricated minutes or universal completion score.

Windows acceptance and integration evidence are separate later gates. The supplied implementation prompt ends at section 35; its continuation was requested, and any additional later-gate requirements must be reconciled when supplied.
