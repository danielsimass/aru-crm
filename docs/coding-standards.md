# Coding Standards

## Clean Code Rules

- Small functions
- Descriptive names
- No magic numbers
- No unused code
- Avoid `any`
- Avoid long parameter lists

## Naming Conventions

- Service classes end with `Service`
- Repository interfaces start with `I` (e.g. `IUserRepository`)
- Repository implementations (when custom) end with `Repository` (e.g. `TypeOrmUserRepository`)
- Controllers end with `Controller`

## SOLID

- Single Responsibility
- Dependency Inversion always respected
- Prefer composition over inheritance
