# Modern C# (12 to 15)

What to use in new code, by target framework. Language versions follow the TFM:
C# 12 on `net8.0`, C# 13 on `net9.0`, C# 14 on `net10.0`, C# 15 on `net11.0`.
Sources: <https://learn.microsoft.com/dotnet/csharp/whats-new/csharp-14>,
<https://learn.microsoft.com/dotnet/csharp/whats-new/csharp-15>. Checked
2026-09-23.

## C# 14 (.NET 10)

### Extension members

Extension blocks group everything that extends one type, and allow extension
properties, static extension members, and operators, not only methods.

```csharp
public static class DeviceExtensions
{
    extension(Device device)
    {
        public bool IsOnline => device.LastSeenAt > DateTimeOffset.UtcNow.AddMinutes(-5);
        public string DisplayName => device.Alias ?? device.SerialNumber;
    }

    extension(Device)
    {
        public static Device Unregistered(string serial) => new(serial, alias: null);
    }
}
```

Use them for:
- derived, read-only facts about a type you do not own or want to keep lean
  (`IsOnline`, `DisplayName`);
- grouping the extensions of one type in one place, one static class per
  extended type (`<Type>Extensions`);
- DI registration helpers (`services.AddBilling()`), which can stay classic
  methods; do not rewrite existing ones only to change syntax.

Do not use them for:
- behavior that belongs to your own domain type: put it on the type;
- properties that hide expensive work (queries, I/O). A property reads as cheap.

### `field` keyword

Replaces a hand-written backing field when a setter validates or normalizes:

```csharp
public string Email
{
    get;
    set => field = value?.Trim().ToLowerInvariant() ?? throw new ArgumentNullException(nameof(value));
}
```

Rename any existing member called `field` or refer to it as `@field`.

### Smaller features worth using

- Null-conditional assignment: `order?.ShippedAt = now;` (also `+=`; not `++`).
- `nameof(List<>)` for unbound generics in logs and errors.
- Lambda parameter modifiers without types: `(text, out result) => ...`.
- Partial constructors and events for source-generator scenarios.

## Earlier features the house style relies on

- Primary constructors for dependency injection in services, handlers, and
  endpoints. Parameters are captured variables: never reassign them, and assign
  to a `readonly` field when you need guarantees.
- `sealed` classes and records by default; unseal when a real subtype appears.
- Records (`sealed record`) for commands, queries, DTOs, and events. `required`
  members when an object is built with an initializer.
- Collection expressions: `[]`, `[.. items, extra]`, `?? []`.
- File-scoped namespaces and pattern matching (`is not { } x`, relational and
  logical patterns).

## Closed hierarchies and unions

Use these to model a fixed set of alternatives the caller must handle: the
states of a device, the kinds of payment, the outcomes of a domain decision.

### On .NET 10 (C# 14): emulate a closed hierarchy

```csharp
public abstract record ProvisioningResult
{
    private ProvisioningResult() { }

    public sealed record Provisioned(DeviceId Id) : ProvisioningResult;
    public sealed record AlreadyClaimed(DeviceId Id, TenantId Owner) : ProvisioningResult;
    public sealed record Rejected(string Reason) : ProvisioningResult;
}

var message = result switch
{
    ProvisioningResult.Provisioned p => $"Device {p.Id} ready",
    ProvisioningResult.AlreadyClaimed a => $"Claimed by {a.Owner}",
    ProvisioningResult.Rejected r => r.Reason,
    _ => throw new UnreachableException(),
};
```

The private constructor keeps other code from adding cases. For records the
compiler-generated protected copy constructor is still a loophole, but using it
takes deliberate effort. The compiler does not prove the `switch` exhaustive, so
the discard arm throws `UnreachableException`, and adding a case means searching
for every `switch` over the type.

### On .NET 11 (C# 15): `closed` and `union`

- `closed` classes and records: the compiler knows every derived type, and a
  `switch` needs no discard arm. Prefer this for types you own.
- `union`: `public union Pet(Cat, Dog, Bird);` for alternatives that cannot share
  a base type, or existing contracts. The compiled union stores the value as
  `object`, so value-type cases are boxed.
- For HTTP APIs, Microsoft recommends a closed hierarchy with a JSON type
  discriminator for new contracts you control, and a union for existing
  contracts without a discriminator
  (<https://devblogs.microsoft.com/dotnet/unions-and-closed-hierarchies-in-aspnetcore/>).
- Moving from the .NET 10 emulation to `closed` is mechanical: add `closed`,
  remove the private constructor and the discard arms.

### Exceptions or closed results

- Exceptions: failures the caller cannot reasonably handle (infrastructure
  down, invariants broken, not found in a request pipeline mapped to 404).
  Map them to HTTP in one place.
- Closed results: expected outcomes the caller must decide on, especially when
  there are more than two or they carry data.
- Do not introduce a general `Result<T>` library alongside exceptions in the
  same module. Mixed styles make every caller guess.

## Not yet

- `LangVersion` `preview`, and C# 15 features on a `net10.0` project.
- Rewriting working code only to use newer syntax. That is a modernization item
  with its own change.
