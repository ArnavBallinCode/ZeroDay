---
name: datamind-hackathon
description: Advance, evaluate, or package the DataMind ZeroDay OSS Hacktoberfest 2026 PS1 submission. Use for DataMind architecture, Snowflake/Gemma integration, verified query UX, rubric evaluation, demo preparation, and submission documentation; do not use for unrelated data apps.
---

# DataMind Hackathon

Optimize for verified correctness on unseen questions. Visual polish matters only when the real
Snowflake/Gemma path, evidence, and failure behavior remain visible and honest.

## Start here

1. Read `../../../docs/PROBLEM_STATEMENT.md` for mandatory behavior, gates, and scoring weights.
2. Read `../../../PLAN.md` for current work and `../../../docs/ARCHITECTURE.md` before changing system
   boundaries.
3. Inspect existing changes and preserve the React query experience and semantic-plan architecture
   unless the user requests a different direction.

## Working contract

- Keep Gemma responsible for natural-language interpretation and evidence-limited explanation.
- Keep deterministic code responsible for validation, joins, parameterization, and SQL generation.
- Keep Snowflake responsible for all answer computation at question time.
- Preserve a complete answer envelope with query ID, SQL, parameters, source rows, assumptions, and
  row-linked claims.
- Never silently fall back to mocks or another model. Label setup/demo previews accurately.
- Spend the user's credits carefully: X-Small warehouse, rapid auto-suspend, bounded results,
  statement timeout, and query tags.

## Choose the mode

- **Implementation:** make the smallest coherent vertical slice, add proportionate tests, then update
  `PLAN.md` and `docs/RUBRIC.md` when status changes.
- **Evaluation:** prioritize independently checkable correctness, paraphrases, joins, follow-ups,
  ambiguity, empty data, unsafe requests, latency, and Snowflake credit evidence.
- **UI:** maintain the premium React/React Flow interface. Make the answer, execution map, evidence
  rows, SQL, assumptions, and failure states intuitive and accessible.
- **Demo/submission:** prove the real system. Include unseen questions, query IDs, Gemma role, a data
  mutation changing an answer, guardrail behavior, setup reproduction, and honest limitations.

## Verification

Run the checks required by `../../../AGENTS.md`. A completed feature must be observed at its real
boundary: production frontend build for UI, real query IDs for Snowflake, and actual local model
metadata for Gemma. Static fixtures are acceptable in unit tests, never as submission proof.
