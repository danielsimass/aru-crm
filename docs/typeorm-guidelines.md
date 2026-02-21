# TypeORM / Repository Guidelines

## Rules

- TypeORM (and any ORM) must only be used inside the **infrastructure** layer (repositories, entities).
- **Controllers** never receive ORM entities directly; they receive DTOs or plain objects mapped in the **Service**.
- **Services** either depend on `Repository<Entity>` (injected via `@InjectRepository`) or on a **repository interface** (dependency inversion); in both cases, data access is encapsulated in the repository layer.
- When using dependency inversion, the repository **interface** is defined in domain/application; the **implementation** uses TypeORM and is registered in the module.

## Migrations

- Use TypeORM migrations for schema changes.
- Do not rely only on `synchronize` in production.
- Migrations must be versioned and run via CLI.

## Queries

- Avoid returning full entities when only a subset of fields is needed; use `select` or query builder when appropriate.
- Prefer repository methods that hide query details from the service.
- Avoid raw SQL unless strictly necessary; keep it inside the repository.
