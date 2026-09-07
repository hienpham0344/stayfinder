# Dependency Policy

## General Rule

Do not add a dependency unless it provides meaningful functionality
that cannot reasonably be implemented using the existing stack.

## Before Adding a Dependency

The agent must check:

1. Whether Java/Spring already provides the functionality.
2. Whether an existing project dependency provides it.
3. Whether the functionality can be implemented simply without a dependency.
4. Whether the dependency is actively maintained.
5. Whether the dependency is compatible with the project's Java/Spring versions.

## Backend Approved Dependencies

The project currently uses:

- Spring Boot
- Spring Web
- Spring Data JPA
- Spring Security
- Spring Validation
- MapStruct
- PostgreSQL Driver
- Lombok (if already enabled)
- JUnit 5 (testing)
- Mockito (testing)
- JWT library (e.g. `jjwt` or Spring Security's built-in JWT support) — for authentication as defined in `project-context.md`

Do not introduce another library for functionality already provided
by these dependencies.

## Frontend Approved Dependencies

The project currently uses:

- React Native
- Expo
- TypeScript

Additional libraries require justification.

## Dependency Addition Rule

Before adding a new dependency, the agent must explain:

- Why it is needed.
- Why existing dependencies are insufficient.
- What functionality it provides.
- Whether it introduces significant complexity or maintenance cost.

The agent must present this explanation and **wait for explicit user approval**
before adding the dependency — do not add it first and explain afterward.

Do not add dependencies merely for convenience.

## Version Pinning

New dependencies must use a specific, pinned version in `pom.xml`
(no `LATEST` or open-ended version ranges), to keep builds reproducible.