# Rolling back a Container Apps revision does not roll back the database

- Type: discovery
- Verified: 2026-09-02
- Area: deployment

## Context

Planning the rollback path for the `ShippingAddress` split.

## Fact

Rollback reactivates the previous revision of the app. The EF Core migration
bundle already ran, so the previous app version runs against the new schema.

## Evidence

Tested in staging: deployed v1.8.0 (with migration), reactivated the v1.7.3
revision; the schema stayed at the v1.8.0 migration.

## How to apply

Every migration must be compatible with the previous app version (expand-contract).
Destructive steps ship one release after the code stops using the old shape.
