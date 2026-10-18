# DataMind agent instructions

## Mission

Build a winning submission for ZeroDay OSS Hacktoberfest 2026 Problem Statement 1: DataMind.
The product must answer natural-language questions from real data queried in Snowflake at question
time, use Google Gemma for a central AI task, and expose enough evidence for a judge to verify every
answer.

Read these files before architectural or product work:

- `docs/PROBLEM_STATEMENT.md` — normalized mandatory requirements and judging rubric.
- `PLAN.md` — current phase, decisions, completed work, and next steps.
- `docs/ARCHITECTURE.md` — trust boundary and system invariants.
- `docs/RUBRIC.md` — live coverage matrix.

Use the repository skill at `.agents/skills/datamind-hackathon/SKILL.md` for implementation,
evaluation, demo, or submission work.

## Non-negotiable invariants

- Snowflake computes answers from real data for every user question. Do not answer from local data,
  fixtures, cached prose, or hard-coded outputs in the real demo.
- Gemma is central to semantic planning and evidence explanation. Do not silently replace it with a
  non-Gemma model.
- Gemma emits a constrained semantic plan, never executable SQL. The deterministic compiler owns SQL.
- Only a single read-only `SELECT` over allowlisted semantic-model tables may execute.
- Values use bound parameters. Limit rows, statement duration, and warehouse cost.
- The answer envelope must retain the question, plan, SQL, parameters, tables, rows, query ID,
  assumptions, claims, and row-level support.
- Show uncertainty, clarification, empty results, and unsupported requests honestly.
- Never commit credentials or private/non-redistributable data. `.env` stays local.

## Product and design bar

- Treat the React Query interface as the primary product, not an admin afterthought.
- Preserve the premium dark visual language and React Flow execution map unless the user changes it.
- Make evidence one click from the answer. Visual polish must reinforce traceability, not obscure it.
- Keep keyboard, focus, contrast, empty, loading, error, and responsive states working.
- Ragvault at `/Users/arnavangarkar/Desktop/Arnav/dev/Ragvault` is a user-approved interaction
  reference. Reuse ideas, not its branding, private data, or unrelated product logic.

## Verification before handoff

- Run `uv run pytest` and `uv run ruff check src tests`.
- Run `npm run build` from `frontend/`.
- For UI changes, run both local servers and visually inspect the main query flow at desktop and
  narrow viewport widths.
- For Snowflake/Gemma changes, record real query IDs and Gemma model/runtime details. Never label a
  mocked or static preview as a working integration.
- Update `PLAN.md` and `docs/RUBRIC.md` when a material milestone or limitation changes.
