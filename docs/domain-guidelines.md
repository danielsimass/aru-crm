# Domain Guidelines

## Domain Rules

- Domain must be framework-agnostic.
- No decorators from NestJS.
- No ORM or database imports in domain entities.
- No HTTP concepts.

## Entities

- Must encapsulate behavior when applicable.
- Avoid anemic domain models where it adds value.
- Validate invariants inside constructors or methods.

## Repository Interfaces (Dependency Inversion)

- Repository **interfaces** should be defined in the domain (or in a dedicated `interfaces` folder in the module).
- They must not expose ORM-specific details.
- They must represent business language (e.g. `findById`, `save`, `delete`).
- **Services** depend on these interfaces (injected via token); the module provides the concrete implementation (e.g. TypeORM repository adapter).

Example:

```typescript
// Domain or interfaces layer
export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
}
```

The application layer (Service) injects `IUserRepository`; the infrastructure layer provides an implementation that uses TypeORM. This keeps dependency inversion: high-level logic does not depend on low-level details.
