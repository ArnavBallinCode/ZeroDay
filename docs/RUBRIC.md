# PS1 rubric coverage

| Requirement | Evidence in the project | Status |
|---|---|---|
| M1 everyday-language questions | Real `gemma4:e4b` semantic planner run plus examples and follow-up context | Implemented, evaluation pending |
| M2 real question-time analysis | Snowflake SQL API executes every compiled query; real query ID retained | Verified |
| M3 grounded answers | Deterministic headline plus evidence-limited explanation prompt | Implemented, evaluation pending |
| M4 plain-language method | Answer envelope and **How it worked** panel | Implemented |
| M5 inspectable evidence | SQL, parameters, rows, tables, Snowflake query ID | Implemented |
| M6 ambiguity and missing data | Planner clarification contract and explicit zero-row response | Implemented, evaluation pending |
| M7 Snowflake and Gemma | Local Gemma 4 planned; Snowflake computed a real four-table result | Verified |
| M8 reproducible open source | Apache-2.0, pinned environment, setup script, tests, architecture | Implemented |

The repository also includes `datamind doctor` for environment verification and `datamind smoke`
for a real end-to-end evidence-producing run. The first verified smoke run queried LINEITEM, ORDERS,
CUSTOMER, and NATION and produced query ID `01c7ce8d-000e-16a4-0000-0002b856b259`.

## Highest-value verification still to add

1. Expand the real Snowflake integration suite and record query IDs across the evaluation set.
2. Build an unseen-question evaluation set with independently computed expected values.
3. Demonstrate that inserting/changing permitted demo data changes the answer.
4. Add a second semantic model without changing application code.
5. Add claim-level checking for every sentence in Gemma's explanation.
