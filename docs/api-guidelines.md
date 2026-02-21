# API Guidelines

## API Style

The API must follow RESTful principles.

- Resources must be noun-based.
- Use HTTP methods correctly.
- Use plural resource names.

Example:

GET    /athletes
GET    /athletes/:id
POST   /athletes
PUT    /athletes/:id
PATCH  /athletes/:id
DELETE /athletes/:id

---

## HTTP Methods

- GET: Retrieve data
- POST: Create resource
- PUT: Full update
- PATCH: Partial update
- DELETE: Remove resource

Never use POST for actions that should be PUT/PATCH.

---

## Status Codes

- 200 OK
- 201 Created
- 204 No Content
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 500 Internal Server Error

Use correct status codes consistently.

---

## Controllers

- Controllers must not contain business logic.
- Each endpoint must delegate to the appropriate **Service** method.
- Controllers must only:
  - Validate input (DTOs)
  - Call service
  - Map output

---

## DTOs

- DTOs are required for all endpoints.
- DTOs must use class-validator.
- Never expose domain entities directly in responses.

---

## Response Structure

Responses must be explicit and predictable.

Avoid returning raw database objects.

Example:

{
  "id": "uuid",
  "name": "John Doe",
  "heightCm": 185,
  "category": "U16"
}

---

## Filtering and Query Params

Filtering must be done via query parameters.

Example:

GET /athletes?category=U16&minHeight=180

Do not create action-based endpoints like:

/athletes/filterByHeight

Follow REST resource principles.

---

## Versioning

API must be versioned.

Example:

/v1/athletes

Future breaking changes must increment version.
