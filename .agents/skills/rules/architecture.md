# Architecture Rules

## Overall Architecture

The project consists of:

- Mobile application: React Native + TypeScript
- Backend: Java + Spring Boot
- Database: PostgreSQL / Supabase
- External services: Third-party APIs when required

## Backend Architecture

The backend follows:

Controller
↓
Service
↓
Repository
↓
Database

### Controller

Controllers are responsible for:

- HTTP request handling
- Request validation
- Authentication/authorization boundaries
- Calling services
- Returning API responses

Controllers must NOT:

- Contain business logic
- Access repositories directly
- Execute database queries
- Perform complex data transformations

Request validation (format, required fields, syntax) is done in the Controller layer using a validation library (Bean Validation — `@Valid`, `@NotNull`, `@NotBlank`, `@Size`, etc. on DTOs).

### Service

Services contain:

- Business logic
- Business validation
- Coordination between repositories
- Coordination between external services
- Transaction boundaries

Services should NOT contain HTTP-specific logic.

Business validation (e.g. checking existence, permissions, business rules) is done in the Service layer:

- Throw a custom exception (e.g. `BusinessException`, `NotFoundException`, `InvalidCredentialsException`) when a rule is violated.
- Catch specific exceptions only when there's a meaningful recovery action; otherwise let it propagate to `GlobalExceptionHandler`.

### Repository

Repositories are responsible for:

- Database access
- Query definitions
- Persistence operations

Repositories must NOT contain business logic.

### DTO

DTOs are used for:

- API requests
- API responses
- Data transfer between layers when appropriate

Do not expose JPA entities directly through public APIs.

### Entity

Entities represent database persistence models.

Entities should not be treated as general-purpose API models.

### Mapper

- Use **MapStruct** for converting between Entity ↔ DTO.
- Each Entity that has a corresponding DTO should have a dedicated Mapper interface (e.g. `UserMapper`, `OrderMapper`).
- Mapper interfaces are placed in a `mapper` package, parallel to `dto` and `entity` packages.
- Do not write manual field-by-field mapping code when MapStruct can generate it — avoid duplicating what MapStruct already handles.
- Mapping logic must stay pure (no business logic, no DB/service calls inside a mapper). If a field requires business logic to compute, do that in the Service layer, not the Mapper.
- Complex/custom mappings should use MapStruct's `@Mapping` + default/expression methods rather than being pushed into the Service unnecessarily — but if it gets too complex, move it to the Service.

### Exception Handling

- All exceptions are handled centrally via a `GlobalExceptionHandler` (`@RestControllerAdvice`). Controllers and Services must NOT catch exceptions just to return an HTTP response directly — let them propagate to the global handler, unless a specific local `try/catch` is required for control flow (e.g. fallback logic).
- Every custom exception should map to a specific **error code**, not just a raw HTTP status.
- `GlobalExceptionHandler` is responsible for:
    - Catching known custom exceptions → returning proper `ApiResponse` with matching error code & HTTP status.
    - Catching validation errors (`MethodArgumentNotValidException`, `ConstraintViolationException`) → returning field-level error details.
    - Catching unhandled/unexpected exceptions → returning a generic `500` `ApiResponse` (never leak stack traces or internal messages to the client).

**Custom Exception structure (suggested):**

```java
public class BusinessException extends RuntimeException {
    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
```

**Error Code convention (suggested):**

Define an `ErrorCode` enum centralizing all business error codes:

```java
public enum ErrorCode {
    INVALID_CREDENTIALS(1001, "Email or password is incorrect", HttpStatus.UNAUTHORIZED),
    INVALID_INPUT(1002, "Invalid input data", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(1003, "User not found", HttpStatus.NOT_FOUND),
    EMAIL_ALREADY_EXISTS(1004, "Email already registered", HttpStatus.CONFLICT),
    UNAUTHORIZED(1005, "You are not authorized to perform this action", HttpStatus.FORBIDDEN),
    INTERNAL_SERVER_ERROR(9999, "Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);

    private final int code;
    private final String message;
    private final HttpStatus status;
    // constructor, getters
}
```

- Error code ranges can be grouped by domain later if the project grows (e.g. `1xxx` = auth, `2xxx` = user, `3xxx` = order...).
- Do not reuse the same error code for different meanings; do not hardcode raw strings/numbers for errors — always go through `ErrorCode`.

### API Response Format

- All API responses are wrapped in a standard `ApiResponse<T>` object and returned via `ResponseEntity<ApiResponse<T>>`.

```java
public class ApiResponse<T> {
    private boolean success;
    private int code;
    private String message;
    private T data;
    // constructor, getters/setters, static factory methods (success(), error())
}
```

Success example:
```json
{
  "success": true,
  "code": 200,
  "message": "OK",
  "data": { ... }
}
```

Error example:
```json
{
  "success": false,
  "code": 1001,
  "message": "Email or password is incorrect",
  "data": null
}
```

- Controllers should not manually build `ResponseEntity` with raw objects — always go through `ApiResponse`.
- HTTP status code on `ResponseEntity` should match the semantic meaning (`401` for auth failure, `404` for not found, `400` for validation, `500` for unexpected), while `code` inside `ApiResponse` is the specific business error code.

### API Contract

- Base path: `/api/` (prefer starting with `/api/v1/` to avoid future migration pain if versioning becomes necessary).
- REST resource naming: plural nouns, kebab-case if multi-word (e.g. `/api/v1/users`, `/api/v1/order-items`).
- Standard HTTP verbs: `GET` (read), `POST` (create), `PUT`/`PATCH` (update), `DELETE` (remove) — do not use `POST` for everything.
- All responses (success and error) go through `ApiResponse` as defined above — no exceptions returning raw objects or plain strings.

## Frontend Architecture

The frontend should separate:

- Screens/pages
- Reusable components
- API/service layer
- State management
- Types
- Utilities

UI components should not contain large amounts of business logic.

API communication should be centralized rather than duplicated across screens.

## Naming Conventions

### Backend (Java/Kotlin, Spring Boot)

| Element | Convention | Example |
|---|---|---|
| Package | lowercase, feature-based | `com.project.user`, `com.project.order` |
| Controller | `XxxController` | `UserController` |
| Service interface | `XxxService` | `UserService` |
| Service implementation | `XxxServiceImpl` | `UserServiceImpl` |
| Repository | `XxxRepository` | `UserRepository` |
| Entity | Singular noun, no suffix | `User`, `Order` |
| DTO (request) | `XxxRequest` | `CreateUserRequest`, `LoginRequest` |
| DTO (response) | `XxxResponse` | `UserResponse` |
| Mapper | `XxxMapper` | `UserMapper` |
| Custom Exception | `XxxException` | `BusinessException`, `NotFoundException` |
| Error Code enum | `ErrorCode` (single shared enum) | `ErrorCode.USER_NOT_FOUND` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_LOGIN_ATTEMPTS` |
| Test class | `XxxTest` (unit) / `XxxIT` (integration) | `UserServiceTest` |

### Database

- Table names: plural, snake_case (e.g. `users`, `order_items`).
- Column names: snake_case (e.g. `created_at`, `user_id`).
- Foreign key columns: `<referenced_table_singular>_id` (e.g. `user_id` referencing `users`).

### Frontend (React Native, TypeScript)

- Components: `PascalCase` (e.g. `UserProfileCard.tsx`)
- Hooks: `useXxx` (e.g. `useAuth.ts`)
- API service functions: grouped under a `services/` folder, one file per resource (e.g. `userApi.ts`)
- Types/interfaces: `PascalCase`, suffixed when helpful (`UserResponse`, `LoginPayload`)
- Avoid duplicating the same API call logic across multiple screens — centralize in the service layer even if lightly structured.

## Separation of Concerns

Each layer should have one clear responsibility.

Avoid:

- Business logic inside controllers
- Database logic inside services when repositories should handle it
- API calls directly scattered throughout UI components
- Duplicated validation logic