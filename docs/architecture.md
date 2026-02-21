# Architecture Overview

## Architectural Style

This project follows NestJS best practices with a modular structure and the standard flow: **Controller → Service → Repository**.

We use:

- **Modules** - Feature-based modules (UserModule, AuthModule, etc.)
- **TypeORM** - For database access via repositories
- **Dependency Injection** - NestJS built-in DI system; dependency inversion via repository interfaces
- **Controllers** - Thin layer: HTTP concerns only, delegate to services
- **Services** - Business logic; depend on repository interfaces (abstractions), not concrete implementations
- **Repositories** - Data access; implement interfaces defined by the domain/application layer

---

## Flow: Controller → Service → Repository

1. **Controller** – Receives the request, validates input (DTOs), calls the **Service**, returns the response.
2. **Service** – Contains business logic; receives **Repository** (injected via interface) and other services; never accesses HTTP or infrastructure directly.
3. **Repository** – Implements the data access interface (e.g. `IUserRepository`); concrete implementation uses TypeORM; registered in the module and injected into the Service.

Dependency inversion: Services depend on repository **interfaces** (e.g. `IUserRepository`). The module binds the interface to the concrete implementation (TypeORM repository or custom adapter). High-level logic does not depend on low-level details.

---

## Module Structure

Each feature module follows this structure:

```
src/modules/<module-name>/
  <module-name>.module.ts        # Module definition; binds interfaces to implementations
  <module-name>.controller.ts    # REST endpoints; calls service
  <module-name>.service.ts       # Business logic; depends on repository interface(s)
  dto/                           # Data Transfer Objects
  infra/
    typeorm/
      entities/                  # TypeORM entities
      repositories/              # Repository implementations (optional; or use TypeOrmModule)
  interfaces/                    # Repository interfaces (optional; or in domain)
```

---

## Database Access

- **DatabaseModule** - Global module that configures TypeORM connection.
- Each module that needs database access imports `DatabaseModule` and uses `TypeOrmModule.forFeature([Entity])`.
- **Services** receive the repository via constructor: either `@InjectRepository(Entity)` for TypeORM repositories, or a custom token when using an interface (e.g. `@Inject('IUserRepository')` with a provider that implements the interface).

Example (service depending on TypeORM repository directly):

```typescript
@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

// In service:
constructor(
  @InjectRepository(UserOrmEntity)
  private readonly userRepository: Repository<UserOrmEntity>,
) {}
```

Example (dependency inversion: service depends on interface):

```typescript
// Interface (domain or interfaces folder)
export interface IUserRepository {
  save(user: UserOrmEntity): Promise<UserOrmEntity>;
  findById(id: string): Promise<UserOrmEntity | null>;
}

// Module binds interface to implementation
@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: 'IUserRepository',
      useClass: TypeOrmUserRepository, // implements IUserRepository
    },
  ],
})
export class UserModule {}

// In service:
constructor(@Inject('IUserRepository') private readonly userRepository: IUserRepository) {}
```

---

## Dependency Injection and Inversion

- Use NestJS built-in DI system.
- **Inject via constructor**; never instantiate dependencies manually.
- **Dependency inversion**: Prefer injecting repository **interfaces** (with a token) so the service does not depend on TypeORM or concrete classes. The module provides the implementation.
- When simplicity is preferred, services can inject `Repository<Entity>` via `@InjectRepository(Entity)`; for stricter inversion, use an interface and a custom provider.
- Modules export what other modules need (e.g. a shared service).

---

## Rules

- Controllers are thin – only HTTP concerns; delegate to services.
- Services contain business logic and depend on abstractions (repository interfaces) when applying dependency inversion.
- Repositories (or TypeORM `Repository<Entity>`) are the only place that performs data access; no direct database access in controllers or services outside the repository.
- TypeORM entities live in `infra/typeorm/entities/`.
- Use NestJS exceptions for error handling.
