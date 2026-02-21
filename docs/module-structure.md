# Module Structure

Each business module follows the NestJS standard: **Controller → Service → Repository**.

```
src/modules/<module-name>/
  <module-name>.module.ts        # Module definition with providers
  <module-name>.controller.ts    # REST endpoints; calls service
  <module-name>.service.ts       # Business logic; uses repository (interface or TypeORM)
  dto/                           # Data Transfer Objects
    create-<entity>.dto.ts
    update-<entity>.dto.ts
  infra/
    typeorm/
      entities/                  # TypeORM entities
        <entity>.orm-entity.ts
      repositories/              # Optional: custom repository implementing interface
  interfaces/                    # Optional: repository interfaces (or in domain)
    <entity>-repository.interface.ts
```

---

## Module Example

```typescript
@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([UserOrmEntity]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    PasswordService,              // Shared service if needed
    // Optional: bind repository interface for dependency inversion
    // { provide: 'IUserRepository', useClass: TypeOrmUserRepository },
  ],
  exports: [UserService, PasswordService, TypeOrmModule],
})
export class UserModule {}
```

---

## Controller Example

Controller is thin: validate input, call service, map output.

```typescript
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const user = await this.userService.create(dto);
    return this.mapToResponse(user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.mapToResponse(user);
  }
}
```

---

## Service Example

Service contains business logic and depends on repository (injected). No HTTP or framework concerns.

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
    private readonly passwordService: PasswordService,
  ) {}

  async create(input: CreateUserDto): Promise<UserOrmEntity> {
    const hashedPassword = await this.passwordService.hash(input.password);
    const user = this.userRepository.create({
      ...input,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<UserOrmEntity | null> {
    return this.userRepository.findOne({ where: { id } });
  }
}
```

With dependency inversion, the service would depend on `IUserRepository` (injected via token) instead of `Repository<UserOrmEntity>`; the module would provide the concrete implementation.

---

## Repository Interface (Dependency Inversion)

When using an interface, the service depends on the abstraction:

```typescript
// interfaces/user-repository.interface.ts
export interface IUserRepository {
  save(user: UserOrmEntity): Promise<UserOrmEntity>;
  findById(id: string): Promise<UserOrmEntity | null>;
}

// infra/typeorm/repositories/typeorm-user.repository.ts
@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}
  async save(user: UserOrmEntity) { return this.repo.save(user); }
  async findById(id: string) { return this.repo.findOne({ where: { id } }); }
}
```

Module registers: `{ provide: 'IUserRepository', useClass: TypeOrmUserRepository }`, and the service injects `@Inject('IUserRepository') private readonly userRepository: IUserRepository`.

---

## Rules

- Controllers are thin – only HTTP concerns; call services.
- Services contain business logic; call repositories (or shared services).
- Repositories (TypeORM or custom classes implementing an interface) are the only data access layer.
- TypeORM entities in `infra/typeorm/entities/`.
- Import `DatabaseModule` in modules that need database access.
- Use `TypeOrmModule.forFeature([Entity])` to register entities.
- Apply dependency inversion by having services depend on repository interfaces when you want to keep the domain/application free of ORM details.
