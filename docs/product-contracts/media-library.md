# Tenant Media Library Contract

Date: 2026-09-13

## Scope and ownership

Media Library is Tenant/Organization scoped, never Map scoped. A MediaAsset records identity, tenant, storage reference/key, original filename, MIME type, width, height, file size, optional duplicate-detection hash, and timestamps. Tenant isolation is strict: Tenant A cannot list or reference Tenant B assets.

One asset is reusable across multiple Spots, Maps, and consumers. Usage type is metadata/filter context, not a restriction. An image uploaded for one Spot may later be selected for a Decoration, category icon, Custom PIN, Floor illustration, Map logo, or another Map of the same Tenant.

## Relations and deletion

Removing an image from a feature removes only its relation/reference and never physically deletes the asset. A MediaAsset may be deleted only with zero active references. In-use deletion is rejected and usage count/details are available to the UI. Deleting a Decoration instance likewise does not delete its asset.

## Common picker

One common image-picker pattern offers `新規アップロード` and `登録済み画像から選ぶ`. Library browsing provides `最近使用`, `このMAPで使用`, `すべて`, and a usage filter. Filters do not prohibit cross-use.

The common picker applies to Floor illustration, Spot photos, category custom icon, Custom PIN, Map logo, and Decoration. Custom PIN flow is preset, registered image, or new upload. New upload creates and selects a MediaAsset; detach removes only the reference. No separate Map-private Custom PIN library is permitted.

## Consumer behavior

Spot photos are ordered, allow multiple or zero images, and use the first as representative. Existing preset/custom/illustration PIN semantics remain unless reference storage changes are required. Floor selection uses an actual image preview, explicit `画像を選び直す`, and resets file/preview state after successful creation.

## Legacy compatibility

Existing URL/string image fields must be audited. New managed uploads use MediaAsset references. Existing managed files and exact bytes remain visible and are not deleted. Deterministically identifiable managed files are backfilled. External legacy URLs are not fetched or copied automatically; safe read compatibility is retained and documented. No existing image may be broken by migration.
