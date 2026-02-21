# Security Guidelines

## Authentication Strategy

The system will use JWT (JSON Web Tokens) for authentication.

### Token Storage

- JWT must be stored in an HttpOnly cookie.
- The cookie must:
  - Be HttpOnly
  - Use Secure flag in production
  - Use SameSite=Lax or Strict
- The JWT must NOT be exposed to the frontend via localStorage or sessionStorage.

Reason:
- Reduces XSS attack surface
- Hides token from direct client access
- Improves overall security posture

---

## Authorization

Role-based access control (RBAC) must be implemented.

Initial roles:
- admin
- coach

Rules:
- Authorization must be enforced using Guards.
- Role validation must not be done inside controllers.
- Role logic must be centralized.

---

## Password Handling

- Passwords must be hashed using bcrypt.
- Never store plain text passwords.
- Never log passwords.

### Password policy (when setting or changing password)

- Minimum 8 characters.
- Maximum 128 characters.
- At least one letter (a–z or A–Z).
- At least one number (0–9).

Applied to: create user (optional password), set first password, reset password, change password.

---

## Input Validation

- All incoming requests must be validated using class-validator.
- Never trust client input.
- Reject invalid payloads with proper HTTP status codes.

---

## Identifiers

- Use UUIDs for public identifiers.
- Do not expose internal database incremental IDs.

---

## Error Handling

- Do not expose stack traces.
- Do not leak internal database errors.
- Return standardized error responses.

---

## Future Enhancements

- Refresh token rotation
- Rate limiting
- Account lock after multiple failed attempts
- Audit logs
