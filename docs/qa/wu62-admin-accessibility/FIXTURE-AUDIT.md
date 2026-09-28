# Fixture provenance and audit

Local Postgres database `digital_map_wu62_qa` was cloned from the disposable WU-61 QA database. It contains the demo Map, Paper configuration, decoration, and release states needed for authenticated browser coverage. It is separate from canonical Arimatsu and Production data.

The inherited WU-61 clone had one custom Spot field but lacked six standard semantic fields. This was a fixture construction issue: the demo seed path bypassed the Map creation helper that normally ensures default definitions. On the WU-62 clone only, the application helper `ensureDefaultSpotFieldDefinitions` added the six missing defaults while retaining the custom field. The read-only default-field audit then passed with six standard plus one custom field. The read-only IMAGE spatial, tenant foundation, and Paper Easy Builder audits also passed with zero anomalies or invalid configurations. No product schema or seed path was changed in WU-62.

Residual P3 fixture debt: the demo seed path should initialize default Spot definitions itself for reproducible future QA clones. This is not evidence of a normal Map creation failure. Audit results must identify the database under test rather than imply canonical data was repaired.
