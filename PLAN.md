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
- [x] Upgraded repository to comprehensive open-source standards (MIT license, Contributor Covenant v2.1, Security disclosure SLA & threat model, CONTRIBUTING guide, Dependabot, CodeQL, issue forms, PR template, SUPPORT, CHANGELOG, and CITATION.cff).
- [x] Built Configurable Safety & Guardrails Engine with dynamic AST rules, table allowlist enforcement, injection & tautology gates, join/subquery/row limits, dialect blacklists, custom regex/keyword guardrails, and real-time SQL simulation tester.
- [x] Built 7-Stage Intermediate Execution Trace & Plan JSON provenance system in both backend agent and frontend UI: instrumented Gemma Semantic Mapping, Pydantic Gate, Dijkstra Join Compiler, AST Firewall, Snowflake Warehouse, Evidence Grounding, and Envelope Packaging with expandable Planner DAG node, timeline stepper, and 1-click JSON inspector.

### In progress

- [x] Complete frontend dependency refresh, production build, and narrow-viewport visual QA.
- [x] Connected the user's Snowflake account with a local PAT and the official SQL API.
- [x] Pulled `gemma4:e4b` and verified local GPU inference on the demo machine.
- [x] Ran a real four-table end-to-end question and retained Snowflake query ID
      `01c7ce8d-000e-16a4-0000-0002b856b259` as initial submission evidence.
- [ ] Benchmark warm/cold Gemma latency and tune the demo model/runtime for interactive response time.

### Next: accuracy and trust moat

- [x] Create at least 25 diverse ground-truth evaluation questions covering paraphrases, joins, multi-step
      reasoning, follow-ups, ambiguity, missing data, empty results, and unsupported requests (`evals/ground_truth.json`).
- [x] Independently compute expected answers and capture pass/fail, SQL, query ID, latency, and cost (`datamind benchmark`).
- [x] Add sentence-level claim verification for Gemma explanations with badge UI highlighting grounded vs ungrounded statements.
- [x] Add date-range, percent, currency, null, and high-cardinality display policies.
- [x] Add a live mutation demonstration table and temporal test in Snowflake (`datamind demo-mutation`, `POST /api/mutation/run`) showing an answer visibly change (+94,770 orders) across live query IDs `01c7cf06-000e-16b8-0002-b8560001c066` and `01c7cf06-000e-16b8-0002-b8560001c06a`.

### Next: adaptability and demo

- [x] Add a second licensed dataset through configuration only (TPC-H SF10, E-Commerce, and custom YAML models).
- [x] Add saved run history and exportable evidence receipts without storing credentials.
- [x] Add dedicated interactive React Flow execution pipeline with click-to-inspect stage drawers.
- [x] Add live Hackathon evaluation matrix covering joins, aggregations, safety injection gates, and ambiguity.
- [x] Add cost and reliability telemetry using Snowflake query history and query tags (credits, warehouse latency, cache hit detection).
- [ ] Record a five-minute narrative demo: problem, unseen question, evidence inspection, ambiguity,
      answer-changing-data proof, architecture, and honest limitations.
- [ ] Finalize public repository visibility, screenshots, tested hardware/model size, and exact
      reproduction checklist.

## Definition of done

### 2026-10-18 query reliability repair

- Fixed case-insensitive text filters and validated numeric year / ISO-date bindings.
- Relative last-N-year requests resolve latest available years using a fresh Snowflake coverage query, retained in execution evidence; the answer explicitly discloses this historical-data interpretation and partial-year caveat.
- Chat sends previous plan; ordinal first/second follow-ups preserve ranking and dates and rerun Snowflake. Removed indiscriminate backend inheritance for independent questions.
- Summaries show up to five evidence-linked rows, rather than only the first. Removed seeded chat answers and receipts. Ordinary execution failures are not marked as security blocks in the pipeline.
- Runtime: Ollama `gemma2:2b`. Live verified Vietnam total 8,770,676,107.5495 (`01c7cf67-000e-16cf-0002-b8560001f06a`), independently matched by query `01c7cf6a-000e-16d0-0002-b8560001e06a`; explicit 1995–1996 revenue (`01c7cf69-000e-16b8-0002-b8560001c10e`); orders by segment (`01c7cf69-000e-1673-0002-b85600019392`).
- Regression checks: 27 tests, lint, frontend build passed. Desktop chat verified with live relative-year question followed by first/second. Narrow-screen sidebar/chat overflow repaired.
- Limitation: this is targeted regression verification, not a fresh pass of the entire 25-case live benchmark. Broad unseen-query accuracy on the lightweight model still needs evaluation.

The submission is done only when all pass/fail gates are satisfied, mandatory M1-M8 behavior works on
unseen inputs, the evaluation suite is green or honestly reports failures, a judge can reproduce the
core path, and recorded evidence proves meaningful Snowflake and Gemma use.
