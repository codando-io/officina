# Project memory

One line per entry. Read the entry before changing the area it describes.

- [gotchas/dapper-varchar-parameters.md](gotchas/dapper-varchar-parameters.md) - Dapper string params on `Sku` (varchar) cause index scans; use `DbString { IsAnsi = true }` (verified 2026-09-10)
- [discoveries/container-apps-revision-rollback.md](discoveries/container-apps-revision-rollback.md) - Rollback reactivates the previous revision but not the DB migration; bundles must stay backward compatible (verified 2026-09-02)
