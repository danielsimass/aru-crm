# NestJS Conventions

This project follows official NestJS conventions and the standard flow: **Controller → Service → Repository**.

---

## General Principles

- Follow official NestJS documentation patterns.
- Use the flow: **Controller → Service → Repository** (no business logic in controllers).
- Use Dependency Injection for all dependencies; respect Dependency Inversion (e.g. services depend on repository interfaces when applicable).
- Use Modules to encapsulate features.
- Avoid static classes and manual instantiation.
- Repositories are injected into **Services**; controllers only use **Services**.

---

## Database Access

### DatabaseModule

The `DatabaseModule` configures TypeORM globally. Import it in modules that need database access:

```typescript
@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

### Repositories

Repositories are used by **Services**, not by controllers. Inject TypeORM repositories in the service:

```typescript
// In service
constructor(
  @InjectRepository(UserOrmEntity)
  private readonly userRepository: Repository<UserOrmEntity>,
) {}
```

For dependency inversion, define an interface (e.g. `IUserRepository`) and register a provider in the module that implements it; inject the interface into the service via a token (e.g. `@Inject('IUserRepository')`).

---

## Exceptions

Always use built-in NestJS HTTP exceptions:

- `BadRequestException`
- `UnauthorizedException`
- `ForbiddenException`
- `NotFoundException`
- `ConflictException`
- `InternalServerErrorException`

Example:

```typescript
throw new NotFoundException('User not found');
```

---

## Validation

Use ValidationPipe globally. DTOs must use class-validator decorators.

`main.ts` includes:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

---

## Guards

Use Guards for:

- Authentication (`JwtAuthGuard`)
- Role authorization (`RolesGuard`)

Do NOT check roles inside controllers or services manually.

---

## Modules

Each feature must have its own module with the standard flow:

```
user/
  user.module.ts
  user.controller.ts
  user.service.ts
  dto/
  infra/
    typeorm/
      entities/
      repositories/   # optional
  interfaces/        # optional, for repository interfaces
```

Modules must be cohesive and isolated.

---

## Dependency Injection

- Always inject via constructor.
- Never instantiate dependencies manually.
- Controllers inject **Services**.
- Services inject **Repositories** (via `@InjectRepository(Entity)` or via interface token) and other services.
- Use `@InjectRepository(Entity)` for TypeORM repositories; use a custom token (e.g. `@Inject('IUserRepository')`) when the service depends on an interface.

Example (controller → service):

```typescript
// Controller
constructor(private readonly userService: UserService) {}

// Service
constructor(
  @InjectRepository(UserOrmEntity)
  private readonly userRepository: Repository<UserOrmEntity>,
  private readonly passwordService: PasswordService,
) {}
```

---

## Logging

- Use NestJS Logger.
- Do not use console.log in production code.

---

## Configuration

- Use `@nestjs/config` for environment variables.
- Do not access `process.env` directly in services or business logic.

---

## Fastify Adapter

- Follow NestJS Fastify documentation.
- Avoid Express-specific patterns.
