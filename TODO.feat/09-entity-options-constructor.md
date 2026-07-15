# Plan 09 — Entity options-bag constructor (DEFERRED)

## Why

The Entity constructor is positional:

```ts
new Klass(irdi, properties, metaClassIrdi);
```

The smoke test was silently buggy because `new Klass({ irdi, code })`
compiled in tests (tests aren't in tsconfig `include`) but passed the
options object as the IRDI positional arg. The entity was constructed
in an invalid state and only didn't crash because the test didn't
inspect deeply.

An options-bag constructor prevents this class of bug:

```ts
new Klass({ irdi, code, preferredName, properties, metaClassIrdi });
```

TypeScript enforces the shape at every call site, not just in src/.

## Scope

- New `EntityOptions` interface: `{ irdi?, code?, preferredName?, properties?, metaClassIrdi?, ... }`
- All Entity subclasses take options bag
- Helpers (`withLang`, `withVersion`, etc.) for common patterns
- Update every internal call site

## Approach

Two-phase rollout:

1. Add a static factory `Entity.create(options)` alongside the positional constructor (no breaking change)
2. Flip the default in a major version bump

This plan defers the rollout — it's a breaking API change that affects
every consumer (editor, browser, validators). Land separately with
proper version bump + migration guide.

## Acceptance

- [x] EntityOptions interface shipped
- [x] Static `Entity.create` factory on Entity (inherited by all subclasses)
- [x] Tests added to tsconfig `include` — `npm run typecheck` catches the smoke-test bug pattern
- [x] Smoke test fixed to use positional args correctly
- [x] New spec `tests/entity-create.test.ts` covers the factory (5 tests)
- [x] All existing tests still pass

## Status

DONE (phase 1). Phase 2 (default constructor flip) deferred to a
major version bump.
