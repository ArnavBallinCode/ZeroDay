# Dataset disclosure

## Snowflake TPC-H sample data

- Source: `SNOWFLAKE_SAMPLE_DATA.TPCH_SF1`, shared by Snowflake into customer accounts.
- Purpose: synthetic decision-support data for joins, aggregates, filters, and rankings.
- Redistribution: no data copy is committed to this repository. The application queries the share in
  the evaluator's own Snowflake account.
- License: Snowflake does not state an open-data license for the sample in the participant guide.
  Consequently, this project references it in place and does not redistribute it.
- Preparation: none. Semantic names and metric definitions are configured in `config/tpch.yml`.
