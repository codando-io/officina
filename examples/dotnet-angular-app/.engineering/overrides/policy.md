# Policy overrides

- Any change to order totals, discounts, or stock reservation is R2 regardless of
  size. Reason: pricing errors reach customer invoices before anyone notices.
- Do not add EF Core migrations that alter the `Orders` or `OrderLines` tables
  without expand-contract, even in development branches. Reason: the reporting
  database replicates these tables.
