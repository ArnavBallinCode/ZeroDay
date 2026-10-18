# DataMind implementation plan

Last updated: 2026-10-18

## Product thesis

DataMind is a verifiable analytics agent, not a generic chatbot. Google Gemma maps varied natural
language into a constrained semantic plan. Deterministic code validates and compiles that plan.
Snowflake performs every calculation. The UI presents the answer and its complete evidence trail.

## Current phase: foundation and first real integration

### Completed

- [x] Extracted PS1 mandatory requirements, scoring rubric, gates, and submission deliverables.
- [x] Chosen Snowflake TPC-H SF1 for the first benchmark and disclosed its source/licensing limits.
- [x] Built reusable YAML semantic catalog with joins, dimensions, and metrics.
- [x] Built constrained Pydantic query-plan contract and deterministic SQL compiler.
- [x] Added parameter binding, table allowlist, one-SELECT policy, timeout, row limit, query tags,
      least-privilege role, and auto-suspending warehouse setup.
- [x] Added local Gemma/Ollama planner and evidence-explanation adapter.
- [x] Added evidence envelope with Snowflake query ID and deterministic row-grounded headline.
- [x] Added FastAPI boundary and initial unit tests.
- [x] Replaced the early Streamlit prototype with a purpose-built React interface and React Flow
      provenance canvas.
- [x] Added repository context files and project skill.
- [x] Added automated backend/frontend quality gates and contribution/security guidance.

### In progress

- [x] Complete frontend dependency refresh, production build, and narrow-viewport visual QA.
- [x] Connected the user's Snowflake account with a local PAT and the official SQL API.
- [x] Pulled `gemma4:e4b` and verified local GPU inference on the demo machine.
- [x] Ran a real four-table end-to-end question and retained Snowflake query ID
      `01c7ce8d-000e-16a4-0000-0002b856b259` as initial submission evidence.
- [ ] Benchmark warm/cold Gemma latency and tune the demo model/runtime for interactive response time.

### Next: accuracy and trust moat

- [ ] Create at least 30 unseen evaluation questions covering paraphrases, joins, multi-step
      reasoning, follow-ups, ambiguity, missing data, empty results, and unsupported requests.
- [ ] Independently compute expected answers and capture pass/fail, SQL, query ID, latency, and cost.
- [ ] Add sentence-level claim verification for Gemma explanations.
- [ ] Add date-range, percent, currency, null, and high-cardinality display policies.
- [ ] Add a mutation demonstration on a small project-owned Snowflake table so an answer visibly
      changes when source data changes.

### Next: adaptability and demo

- [ ] Add a second licensed dataset through configuration only.
- [ ] Add saved run history and exportable evidence receipts without storing credentials.
- [ ] Add cost and reliability telemetry using Snowflake query history and query tags.
- [ ] Record a five-minute narrative demo: problem, unseen question, evidence inspection, ambiguity,
      answer-changing-data proof, architecture, and honest limitations.
- [ ] Finalize public repository visibility, screenshots, tested hardware/model size, and exact
      reproduction checklist.

## Definition of done

The submission is done only when all pass/fail gates are satisfied, mandatory M1-M8 behavior works on
unseen inputs, the evaluation suite is green or honestly reports failures, a judge can reproduce the
core path, and recorded evidence proves meaningful Snowflake and Gemma use.
