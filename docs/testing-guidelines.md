# Testing Guidelines

This project uses Jest as the testing framework.

Testing is mandatory for business logic and critical flows.

---

# Testing Philosophy

We test behavior, not implementation details.

- Prefer testing **services** (business logic) instead of controllers.
- Domain and application layers must be highly testable.
- Infrastructure (repositories) should be tested through integration tests.

---

# Test Types

## 1. Unit Tests

Scope:
- Domain entities
- Services (business logic)
- Business rules

Rules:
- No real database
- No real external services
- Mock repositories (or use in-memory implementations of interfaces)
- Fast execution

Example:

describe('AthleteService', () => {
  it('should create athlete with valid data', async () => {
    ...
  });
});

---

## 2. Integration Tests

Scope:
- Repository implementations (TypeORM / custom repositories)
- Database integration
- Auth flow

Rules:
- Use a test database
- Do not use production database
- Use migrations before running tests

---

## 3. E2E Tests

Scope:
- Full HTTP flow
- Controller → Service → Repository (Database)

Rules:
- Use @nestjs/testing module
- Boot full application
- Use Supertest for HTTP assertions
- Use separate test environment variables

Example:

describe
