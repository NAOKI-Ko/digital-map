# Config migration evidence

`parsePaperMapConfig` accepts v1 and v2. v1 migrates in memory, and the PATCH endpoint stores v2 with `configVersion: 2` only after explicit save. Tests cover MAP_FOCUS, GUIDE, BALANCED, PHOTO_GUIDE, v2 round-trip, and unknown versions. Source content is never changed.
