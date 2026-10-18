# DataMind architecture

## Trust boundary

```text
question
   |
   v
read-only request check -- rejects destructive intent before model/query calls
   |
   v
local Gemma planner -- emits constrained QueryPlan JSON, never SQL
   |
   v
Pydantic validation -- known dataset, fields, operators, row limit
   |
   v
deterministic compiler -- parameterized SQL from versioned semantic YAML
   |
   v
read-only policy -- one SELECT, allowlisted tables, timeout, least-privilege role
   |
   v
Snowflake -- executes against SNOWFLAKE_SAMPLE_DATA at question time
   |
   v
evidence envelope -- query ID + SQL + parameters + rows + assumptions
   |
   v
deterministic answer + Gemma evidence explanation
```

Gemma is central to interpreting varied natural-language questions. It selects semantic dimensions,
metrics, filters, ordering, and necessary clarification. It cannot execute arbitrary SQL. Snowflake is
central to every computation. The application does not load a local copy of the answer data.

## Why a semantic plan instead of model-written SQL

Direct text-to-SQL makes safety and correctness depend on a stochastic string. DataMind constrains the
model to a reviewed vocabulary, then uses ordinary code to compile it. This makes joins and metric
definitions stable, permits exact tests, and gives every answer a reusable evidence record.

## Claim-to-row traceability

An `AnswerEnvelope` preserves the original question, validated plan, executed SQL and parameters,
Snowflake query ID, returned rows, claims, and row indexes supporting each claim. The first version
generates the headline deterministically so its names and numbers cannot exceed the evidence.

## Security and cost controls

- A dedicated role has imported read-only access to the sample database.
- Only one `SELECT` over allowlisted tables can execute.
- Core single-SELECT, no-mutation, and table allowlist policies are mandatory; optional UI rules cannot disable them. Explicit database/schema references must match the selected catalog.
- Each chat request carries its selected dataset and uses a separate agent instance; previous-plan context from a different catalog is discarded.
- Values are bound parameters; model output is never interpolated as a value.
- Result count and model-selected `LIMIT` are bounded.
- Statements time out after 30 seconds.
- The X-Small warehouse auto-suspends after 60 seconds.
- Every query receives `QUERY_TAG = datamind:interactive:v0.1` for monitoring.
- Local Google-sign-in accounts can use a Snowflake PAT through the official SQL API; the token stays
  in the ignored `.env`, while SQL values remain bound and the read-only role remains enforced.
