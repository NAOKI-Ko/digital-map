# WU-53 Windows QA deployment

Status: PENDING until the implementation branch passes GitHub Actions and an exact deployment SHA is selected.

Required sequence: record current deployed SHA and health; create verified pre-deploy DB + Media + Public backup; deploy the exact CI-passed SHA; restore the accepted Local baseline bundle (never reseed independently); verify checksums; start the app and tunnel; require `/api/ready` 200; run three-account access/public QA; create and disposable-restore a post-deploy Windows baseline backup.

Production, R2, unrelated services, and `main` are out of scope and must remain unchanged.
