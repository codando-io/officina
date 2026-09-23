# Dapper string parameters on varchar columns cause index scans

- Type: gotcha
- Verified: 2026-09-10
- Area: `src/Orders.Api/Features/Reports/`

## Context

The stock report timed out in staging after the catalog passed 2 million SKUs.

## Fact

`Products.Sku` is `varchar(32)`. Dapper sends C# strings as `nvarchar(4000)`, so
SQL Server converts the column for every row and cannot seek on `IX_Products_Sku`.

## Evidence

Actual execution plan showed `CONVERT_IMPLICIT(nvarchar(32), [Sku])` and an index
scan; after the change, an index seek and 40 ms instead of 31 s.

## How to apply

Pass SKUs as `new DbString { Value = sku, IsAnsi = true, Length = 32 }`. Lists
of SKUs go through the `SkuList` table-valued parameter.
