# Profile: dotnet-angular

Integration concerns for an ASP.NET Core backend and an Angular frontend that
ship together. Use it together with `dotnet-backend` and `angular`:

```yaml
profiles: [dotnet-backend, angular, dotnet-angular]
```

This profile holds only what exists because the two sides meet: the contract
between them, authentication, errors, serialization, and trace propagation.

Last reviewed: 2026-09-23.

## Detection

Both `dotnet-backend` and `angular` match in the same repository, or the
Angular app calls an ASP.NET Core API owned by the same team.

## Verification ladder

1. After a contract change, regenerate the TypeScript client or models (or
   update them by hand, if that is the project's way) and build the frontend:
   template and type errors show where callers break.
2. Run the backend integration test for the endpoint and the frontend spec for
   the service that calls it.
3. For changes to authentication, errors, or serialization, run the e2e journey
   that crosses the boundary (login, a failing form submission, a list with
   dates and money).

## Conventions to discover

- Who owns the contract: OpenAPI-generated client, a shared package, or
  hand-written services and models. Where the generator runs (build, CI, by
  hand).
- Authentication flow: cookies with CSRF protection, or bearer tokens; how the
  frontend refreshes and where it handles 401 and 403.
- Error contract: `ProblemDetails` or a custom model, and the single place in the
  frontend (an interceptor or a resource error handler) that turns it into
  messages.
- Language of user-facing messages and where translation happens (backend
  sends codes, frontend translates; or backend sends text).
- Deployment shape: the SPA served by the API, or separately behind a proxy or
  CDN, and what that means for CORS.

## Pitfalls

- A backend DTO changes without the TypeScript model or generated client.
  Additive changes only, unless both sides ship together and old clients cannot
  exist (cached SPA bundles can).
- Enums serialized as numbers on one side and strings on the other; unknown
  enum values from a newer backend crashing an older frontend.
- `DateTime` without offset crossing the wire and shifting by the browser's time
  zone; use `DateTimeOffset` or UTC with an explicit `Z`.
- `decimal` values losing precision as JavaScript numbers; send money as strings
  or integer minor units when precision matters.
- CORS: `AllowAnyOrigin` with credentials; missing `traceparent`/`tracestate` in
  the allowed headers when the browser propagates traces.
- ASP.NET Core 10 cookie authentication answers API requests with 401/403
  instead of redirecting to login; the Angular app must handle both.
- Validation rules duplicated with different limits on each side; the backend is
  the authority, and the frontend mirrors it for feedback only.

## References

Stack details live in the two composed profiles:
`$HARNESS/profiles/dotnet-backend/PROFILE.md` and
`$HARNESS/profiles/angular/PROFILE.md`.
