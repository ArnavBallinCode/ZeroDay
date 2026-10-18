# DataMind

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.11 | 3.12 | 3.13](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![CI Quality Gate](https://github.com/ArnavBallinCode/ZeroDay/actions/workflows/ci.yml/badge.svg)](https://github.com/ArnavBallinCode/ZeroDay/actions/workflows/ci.yml)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Hacktoberfest](https://img.shields.io/badge/Hacktoberfest-2026-orange.svg)](https://hacktoberfest.com/)

**Ask your Snowflake data a question. Get an answer with receipts.**

DataMind is an open-source, verifiable natural-language data agent for ZeroDay OSS Hacktoberfest
2026 Problem Statement 1. Google Gemma interprets a user's question into a constrained semantic
plan. Deterministic code validates and compiles that plan. Snowflake computes the answer from real
data at question time. Every response includes the executed SQL, bound parameters, result rows,
tables, assumptions, runtime, and Snowflake query ID.

This separation is deliberate: Gemma handles language; Snowflake handles facts.

## What works today

- Everyday-language questions over Snowflake's TPC-H sample data
- Joins across orders, line items, customers, nations, regions, suppliers, and parts
- Metrics, filters, rankings, and bounded results from a reusable semantic YAML model
- Local Gemma planning and explanation through Ollama
- Parameterized, single-statement, read-only SQL with allowlisted tables
- Explicit clarification, empty-result, and unsupported-field handling
- Inspectable evidence and Snowflake query IDs in the UI
- Least-privilege Snowflake setup with automatic warehouse suspension

## Quick start

### Prerequisites

- macOS or Linux; Windows should work but has not yet been verified
- Python 3.11-3.13
- [Ollama](https://ollama.com/download)
- A Snowflake account with the `SNOWFLAKE_SAMPLE_DATA` share

### 1. Install the app

```bash
git clone https://github.com/ArnavBallinCode/ZeroDay.git
cd ZeroDay
uv sync --extra dev --python 3.13
```

### 2. Start Google Gemma locally

```bash
ollama pull gemma4:e4b
ollama serve
```

Gemma 4 E4B is the initial target because its edge-class size is practical for laptop inference while
remaining useful for semantic planning. It is not called "tested" until the final demo machine's
latency and memory are measured. Change `GEMMA_MODEL` in `.env` to another Gemma variant supported by
your hardware.

### 3. Configure Snowflake safely

In Snowsight, run [`scripts/setup_snowflake.sql`](scripts/setup_snowflake.sql). Replace the username in
the final commented statement, uncomment it, and run it. This creates:

- an X-Small `DATAMIND_WH` warehouse that suspends after 60 seconds;
- a `DATAMIND_READER` role with read-only imported privileges on sample data.

Then configure local authentication:

```bash
cp .env.example .env
```

Edit `.env` and set `SNOWFLAKE_ACCOUNT` and `SNOWFLAKE_USER`. Leave
`SNOWFLAKE_AUTHENTICATOR=externalbrowser` to use your normal browser login. Never commit `.env`.

For Google-sign-in accounts where connector SSO is unavailable, set a short-lived `SNOWFLAKE_PAT`
instead. DataMind automatically uses Snowflake's official SQL API while preserving bound parameters,
the read-only role, and query-ID evidence. See the setup guide for the network-policy requirement.

Account identifiers normally look like `myorg-myaccount`; copy yours from Snowflake's account menu.
The complete keyless walkthrough is in [Snowflake setup](docs/SNOWFLAKE_SETUP.md).

Verify both required systems before starting the UI:

```bash
uv run datamind doctor
uv run datamind smoke
```

### 4. Run

Start the API:

```bash
uv run uvicorn datamind.api:app --reload --port 8000
```

In a second terminal, start the React interface:

```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Try: **Which five customer nations generated the most revenue in
1995?** The execution map shows the live question → Gemma → safety → Snowflake → evidence path.
Open the Evidence and SQL tabs for exact rows, parameters, tables, runtime, and query ID.

## Test and quality checks

```bash
uv run pytest --cov=datamind
uv run ruff check .
cd frontend && npm run build
```

Unit tests do not fake a public demo; they isolate deterministic safety behavior. The submission demo
must use the real Snowflake integration and record its real query IDs. An integration test and
unseen-question benchmark will be added after account connection.

## Configuration and adaptability

The application does not hard-code dataset logic into its agent. [`config/tpch.yml`](config/tpch.yml)
defines physical tables, joins, user-facing dimensions, metrics, and examples. A compatible second
dataset can be introduced through another YAML model without changing the planner, compiler,
executor, evidence envelope, or UI.

Environment variables are documented in [`.env.example`](.env.example). The defaults use
`SNOWFLAKE_SAMPLE_DATA.TPCH_SF1`, an X-Small warehouse, the read-only role, and local `gemma4:e4b`.

## Community and open-source resources

We welcome all contributions, ideas, and feedback! Please explore these resources:

- [Contributing Guide](CONTRIBUTING.md): Setup instructions, architecture invariants, and PR guidelines.
- [Code of Conduct](CODE_OF_CONDUCT.md): Contributor Covenant v2.1 community standards.
- [Security Policy](SECURITY.md): Vulnerability reporting procedures, threat model, and safe harbor.
- [Support and FAQ](SUPPORT.md): Troubleshooting guides, discussions, and FAQ.
- [Changelog](CHANGELOG.md): Release history and upcoming roadmap.
- [Citation Information](CITATION.cff): CFF metadata for academic and technical attribution.

## Architecture and rubric evidence

- [Architecture and trust boundary](docs/ARCHITECTURE.md)
- [PS1 rubric coverage](docs/RUBRIC.md)
- [Dataset sources, licensing, and preparation](docs/DATASETS.md)
- [Snowflake keyless setup and verification](docs/SNOWFLAKE_SETUP.md)
- [Normalized participant-guide requirements](docs/PROBLEM_STATEMENT.md)
- [Living implementation plan](PLAN.md)

The main technical contribution is a constrained semantic-plan boundary between an open-weight
language model and a cloud data warehouse, paired with a portable evidence envelope that preserves
claim-to-query-to-row traceability.

## Troubleshooting

See [SUPPORT.md](SUPPORT.md) for full diagnostic and troubleshooting steps. Quick checks:

**Gemma shows offline.** Run `ollama list`, confirm `gemma4:e4b` exists, then start `ollama serve`.

**Browser authentication does not open.** Confirm `SNOWFLAKE_AUTHENTICATOR=externalbrowser` and that
the account identifier and username in `.env` match the Snowflake account menu.

**The sample database is missing.** Some accounts do not have the share visible by default. In
Snowsight, add the Snowflake sample data from Data Products, then rerun the grants.

**The warehouse uses more credits than expected.** Confirm `AUTO_SUSPEND = 60` and use
`SHOW WAREHOUSES LIKE 'DATAMIND_WH'`. DataMind also caps result rows and statement duration.

## Known limitations

- The first semantic model covers a practical subset of TPC-H, not every benchmark question.
- Follow-up context is passed to Gemma, but entity-resolution tests are not complete.
- The deterministic headline is fully row-grounded; Gemma's longer explanation is constrained by a
  prompt and still needs a sentence-level verifier before production use.
- Only the TPC-H model is included so far; a second dataset is planned to prove adaptability.
- Hardware, latency, Snowflake credit use, and unseen-question accuracy must be measured on the final
  demo setup rather than guessed.

## License

This project is licensed under the [MIT License](LICENSE). Snowflake sample data is not included or redistributed.

