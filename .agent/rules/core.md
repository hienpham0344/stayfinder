# Core Project Rules

## Purpose

These rules define the general development standards for this project.

All agents and developers must follow these rules when modifying the project.

## General Principles

- Understand the existing code before making changes.
- Prefer simple, maintainable solutions.
- Reuse existing code before creating new utilities or abstractions.
- Do not duplicate existing functionality.
- Do not modify unrelated files.
- Do not introduce unnecessary design patterns.
- Do not over-engineer simple requirements.
- Preserve existing behavior unless the task explicitly requires changing it.

## Before Coding

Before implementing a feature:

1. Inspect the relevant existing code.
2. Identify the existing architecture and conventions.
3. Check whether similar functionality already exists.
4. Reuse existing components, services, utilities, and types where possible.
5. Check the dependency policy before introducing a new library.

## Changes

Make the smallest reasonable change required by the task.

Do not:

- Refactor unrelated code.
- Rename unrelated files.
- Change the architecture without approval.
- Replace existing libraries without a clear reason.
- Remove existing functionality unless requested.

## AI Behavior

The agent must:

- Explain important architectural decisions.
- Ask for clarification when requirements are ambiguous.
- Avoid guessing critical business requirements.
- Follow existing project conventions.
- Prefer existing dependencies over adding new ones.

The agent must NOT:

- Automatically add dependencies for convenience.
- Automatically rewrite large parts of the project.
- Commit secrets or credentials.
- Ignore existing rules.