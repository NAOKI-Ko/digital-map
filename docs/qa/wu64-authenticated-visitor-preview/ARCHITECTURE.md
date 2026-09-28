# Visitor Preview architecture

| Surface | Source | Authorization | Renderer |
| --- | --- | --- | --- |
| `/:mapSlug` | Current published `PublicRelease` via `/api/public/:mapSlug` | Public, only while Map is published | `VisitorMapExperience.vue` |
| `/admin/maps/:mapId/preview` | LIVE Map via `/api/maps/:mapId/visitor-preview` | Session plus `requireMapAccess` owner/editor check | Same `VisitorMapExperience.vue` |

The LIVE endpoint calls `getLivePublicMapById`, the same visitor DTO builder used to create a new public release. Its existing query includes only publication-eligible Spots with both image coordinates, and serializes Floors, illustration assets, visible fields, categories, photos, PIN design and decorations. It does not create a release or write a snapshot. The public endpoint remains release-backed.

Preview has no admin layout column. Its compact, separate overlay identifies the editable source and returns to Map Home or Publish. The `from` query is an enum, never an arbitrary URL. Invalid values return to Map Home. Preview HTML and API responses are private/no-store and noindex. An anonymous HTML request redirects to Login; the data API requires Map authorization. No anonymous preview token exists.

The visitor component owns filtering, Floor switching, Spot detail, mobile/Desktop canvas, and optional analytics. Public rendering enables analytics by default; Preview passes `analyticsEnabled=false`. Public SEO remains on the public route, and Preview has noindex metadata. Paper has a separate renderer and was not changed.
