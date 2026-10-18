# PS1 rubric coverage

| Requirement | Evidence in the project | Status |
|---|---|---|
| M1 everyday-language questions | Gemma semantic planner with examples and follow-up context | In progress |
| M2 real question-time analysis | Snowflake executor runs the compiled query for every answer | Implemented |
| M3 grounded answers | Deterministic headline plus evidence-limited explanation prompt | Implemented, evaluation pending |
| M4 plain-language method | Answer envelope and **How it worked** panel | Implemented |
| M5 inspectable evidence | SQL, parameters, rows, tables, Snowflake query ID | Implemented |
| M6 ambiguity and missing data | Planner clarification contract and explicit zero-row response | Implemented, evaluation pending |
| M7 Snowflake and Gemma | Snowflake computes; local Gemma plans and explains | Implemented |
| M8 reproducible open source | Apache-2.0, pinned environment, setup script, tests, architecture | Implemented |

The repository also includes `datamind doctor` for keyless environment verification and
`datamind smoke` for a real end-to-end evidence-producing run.

## Highest-value verification still to add

1. Run the real integration suite against Snowflake and record query IDs.
2. Build an unseen-question evaluation set with independently computed expected values.
3. Demonstrate that inserting/changing permitted demo data changes the answer.
4. Add a second semantic model without changing application code.
5. Add claim-level checking for every sentence in Gemma's explanation.
