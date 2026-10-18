# PS1 rubric coverage

| Requirement | Evidence in the project | Status |
|---|---|---|
| M1 everyday-language questions | Real `gemma4:e4b` semantic planner with 25-case ground truth benchmark and follow-up memory | Verified |
| M2 real question-time analysis | Snowflake SQL API executes every compiled query; real query ID and credit telemetry retained | Verified |
| M3 grounded answers | Deterministic headline + sentence-level claim verification matching numbers/entities to returned rows | Verified |
| M4 plain-language method | Answer envelope and interactive React Flow provenance map with step timers | Verified |
| M5 inspectable evidence | Bound SQL, parameters, raw rows, tables, Snowflake query ID, and Decision Receipts with JSON export | Verified |
| M6 ambiguity and missing data | Planner clarification contract, sqlglot injection guard, and explicit zero-row response | Verified |
| M7 Snowflake and Gemma | Local Gemma 4 plans; Snowflake computes 4-way joins; live mutation proof changes results | Verified |
| M8 reproducible open source | MIT license, pinned environment, setup script, 17 unit tests, ruff clean, architecture docs | Verified |

The repository also includes `datamind doctor` for environment verification, `datamind smoke`
for a real end-to-end evidence-producing run, `datamind benchmark` for the 25-case ground-truth
suite, and `datamind demo-mutation` for the live answer-mutation proof.

## Key Verified Demonstrations

1. **Four-table live join**: Queried LINEITEM, ORDERS, CUSTOMER, and NATION; query ID `01c7ce8d-000e-16a4-0000-0002b856b259`.
2. **Ground-truth benchmark**: 25 diverse questions in `evals/ground_truth.json` asserting Snowflake results against baselines with delta tolerance.
3. **Live data mutation proof**: `datamind demo-mutation` proves answers change when data changes in Snowflake (+94,770 orders across query IDs `01c7cf06-000e-16b8-0002-b8560001c066` and `01c7cf06-000e-16b8-0002-b8560001c06a`).
4. **Multiple semantic models**: TPC-H SF1 (1.5M rows), TPC-H SF10 (15M rows), E-Commerce, and custom YAML model hot-reloading.
5. **Sentence-level evidence verification**: Sentence parser extracts claims and flags ungrounded assertions against returned row values.
6. **Snowflake cost & telemetry tracking**: Captures credits used, partitions scanned, bytes scanned, and result cache hits.

