## Description

<!-- Provide a brief explanation of what this pull request changes and why. -->

Fixes #(issue number if applicable)

## Type of Change

- [ ] `feat`: New feature or capability
- [ ] `fix`: Bug fix
- [ ] `docs`: Documentation update
- [ ] `refactor`: Code refactoring without behavior change
- [ ] `test`: New or updated tests
- [ ] `chore`: Maintenance, dependencies, or configuration

## Architectural & Security Invariants Checklist

Please confirm that this change adheres to DataMind's core invariants:

- [ ] **Gemma Boundary**: Natural language is parsed into a semantic plan; Gemma **never** generates executable SQL directly.
- [ ] **Compiler Boundary**: Executable SQL is created strictly by the deterministic AST compiler.
- [ ] **Read-Only Safety**: SQL execution remains strictly a single parameterized `SELECT` query over allowlisted tables.
- [ ] **Evidence Envelope**: Response metadata preserves questions, plan, SQL, bound parameters, duration, claims, and query IDs.
- [ ] **Credential Safety**: No credentials, private keys, PATs, or `.env` files are committed.

## Quality & Testing Verification

Please verify you ran the following locally before submitting:

- [ ] Backend lint passes: `uv run ruff check src tests`
- [ ] Backend tests pass: `uv run pytest`
- [ ] Frontend lint passes: `cd frontend && npm run lint`
- [ ] Frontend build succeeds: `cd frontend && npm run build`
- [ ] Added/updated tests covering the changes

## Screenshots / Evidence (if UI or data changes)

<!-- Paste screenshots or terminal output here if applicable -->
