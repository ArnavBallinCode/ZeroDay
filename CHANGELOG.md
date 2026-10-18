# Changelog

All notable changes to DataMind will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-18

### Added
- **Natural Language Data Agent**: Google Gemma semantic planning engine paired with deterministic SQL compilation.
- **Snowflake Integration**: Keyless external browser SSO and short-lived PAT authentication against `SNOWFLAKE_SAMPLE_DATA`.
- **AST SQL Compiler**: Safe parameterized single-statement `SELECT` generation using SQLGlot with table allowlisting.
- **Traceability Envelope**: Complete response metadata containing SQL, bound parameters, duration, affected tables, claims, assumptions, and Snowflake Query ID.
- **React Frontend**: Premium interactive web interface featuring query execution flows (React Flow), metric previews, and evidence verification drawers.
- **CLI Utilities**: Built-in `datamind doctor` and `datamind smoke` commands for quick environment diagnostics.
- **Open Source Community Standards**: MIT license, Contributor Covenant Code of Conduct, security disclosure policy, comprehensive contributing guidelines, and GitHub issue templates.

## [Unreleased]

### Planned
- Extended semantic model coverage for financial and supply chain domains.
- Automated query cost estimators before warehouse execution.
- Multi-dialect compilation options for additional analytical warehouses.
