# Contributing to DataMind

Thank you for your interest in contributing to DataMind! We are building an open-source, verifiable natural-language data agent that brings mathematical and architectural integrity to AI-powered analytics.

Whether you are fixing a typo, adding a new metric to the semantic model, improving the React Flow execution map, or optimizing the SQL compiler, your contributions are welcome.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Hacktoberfest & First-Time Contributors](#hacktoberfest--first-time-contributors)
- [Architectural Invariants & Trust Boundary](#architectural-invariants--trust-boundary)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Local Gemma Setup](#local-gemma-setup)
- [Development Workflows](#development-workflows)
  - [Adding Metrics or Tables to the Semantic Model](#adding-metrics-or-tables-to-the-semantic-model)
  - [Running Tests & Linters](#running-tests--linters)
  - [Running the Diagnostic Tools](#running-the-diagnostic-tools)
- [Commit & Pull Request Conventions](#commit--pull-request-conventions)
  - [Conventional Commits](#conventional-commits)
  - [Pull Request Checklist](#pull-request-checklist)
- [Questions & Community](#questions--community)

---

## Code of Conduct

All contributors and maintainers are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating.

---

## Hacktoberfest & First-Time Contributors

DataMind proudly participates in open-source hackathons including ZeroDay OSS Hacktoberfest.

- Look for issues tagged [`good first issue`](https://github.com/ArnavBallinCode/ZeroDay/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) or [`help wanted`](https://github.com/ArnavBallinCode/ZeroDay/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22).
- **Quality over Quantity**: We do not accept AI-generated spam PRs, trivial whitespace changes, or PRs that break architectural safety.
- Every accepted contribution must include appropriate unit or integration tests and pass all CI checks.

---

## Architectural Invariants & Trust Boundary

Before writing code, please review [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Any pull request that violates these invariants will not be merged:

1. **Gemma Plans, Compiler Executes**: Google Gemma translates natural-language questions into a constrained, validated JSON semantic plan. Gemma **never** generates executable SQL directly.
2. **Deterministic SQL Compiler**: Executable SQL is created solely by our deterministic AST compiler (`datamind.compiler`).
3. **Snowflake Computes Facts**: Real answers are calculated on Snowflake at question time. We do not answer from cached prose or hardcoded fixtures in production runs.
4. **Complete Traceability Envelope**: Every response envelope must retain the question, semantic plan, parameterized SQL, bound values, tables accessed, execution duration, and Snowflake Query ID.
5. **Least Privilege & Read-Only**: The backend executes only single-statement read-only `SELECT` queries over allowlisted tables with bound parameters. Multi-statement or write operations are strictly disallowed.
6. **No Secret Leaks**: Never commit `.env`, Snowflake credentials, private keys, or non-redistributable data.

---

## Getting Started

### Prerequisites

- **Python**: 3.11, 3.12, or 3.13
- **uv**: Fast Python package manager ([install instructions](https://docs.astral.sh/uv/getting-started/installation/))
- **Node.js**: >= 20.0.0 and **npm**
- **Ollama**: For running local Gemma weights ([download](https://ollama.com/download))
- **Snowflake Account** (optional for unit tests; required for live end-to-end queries)

### Backend Setup

```bash
# Clone repository
git clone https://github.com/ArnavBallinCode/ZeroDay.git
cd ZeroDay

# Install dependencies into virtual environment
uv sync --extra dev --python 3.13

# Activate virtual environment (optional, or run commands via `uv run`)
source .venv/bin/activate
```

### Frontend Setup

```bash
cd frontend
npm ci
npm run build
```

### Local Gemma Setup

DataMind uses Google Gemma (defaulting to `gemma4:e4b` for edge efficiency):

```bash
ollama pull gemma4:e4b
ollama serve
```

You can configure alternative Gemma models (e.g. `gemma2:9b` or `gemma2:27b`) by setting `GEMMA_MODEL` in your `.env`.

---

## Development Workflows

### Adding Metrics or Tables to the Semantic Model

DataMind uses a declarative semantic model in [`config/semantic_model.yaml`](config/semantic_model.yaml). To add or modify business metrics:

1. Open `config/semantic_model.yaml`.
2. Define the new metric under `metrics`:
   ```yaml
   metrics:
     my_new_metric:
       name: my_new_metric
       label: "My New Metric"
       description: "Calculates the sum of something important"
       table: my_table
       expression: "SUM(my_table.amount)"
       type: decimal
   ```
3. Add corresponding dimension mappings or join paths under `tables` and `joins`.
4. Run compiler tests to ensure valid AST transpilation:
   ```bash
   uv run pytest tests/test_compiler.py
   ```

### Running Tests & Linters

You can run all tests and quality checks without needing live Snowflake credentials. Unit tests run locally using mocks and fixtures.

```bash
# Run backend linters & formatting checks
uv run ruff check src tests

# Run test suite with pytest
uv run pytest

# Run with test coverage
uv run pytest --cov=datamind --cov-report=term-missing

# Run frontend lint and build
cd frontend
npm run lint
npm run build
```

### Running the Diagnostic Tools

DataMind includes CLI diagnostic commands to verify your local environment:

```bash
# Check connectivity to Ollama / Gemma and Snowflake configuration
uv run datamind doctor

# Run an end-to-end smoke check
uv run datamind smoke
```

---

## Commit & Pull Request Conventions

### Conventional Commits

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat(scope)`: A new feature or capability (e.g. `feat(compiler): support rolling date windows`)
- `fix(scope)`: A bug fix (e.g. `fix(safety): sanitize identifier quotes`)
- `docs(scope)`: Documentation changes (e.g. `docs(setup): clarify PAT permissions`)
- `test(scope)`: Adding or updating tests
- `refactor(scope)`: Code refactoring without behavioral change
- `chore(scope)`: Routine maintenance, dependencies, or configuration

### Pull Request Checklist

When opening a pull request:

- [ ] Branch from `main` with a descriptive name (e.g., `feat/bounded-rankings` or `fix/parameter-binding`).
- [ ] Run `uv run ruff check src tests` with zero errors or warnings.
- [ ] Run `uv run pytest` and verify all tests pass.
- [ ] If changing the frontend, run `npm run lint` and `npm run build` inside `frontend/`.
- [ ] Ensure **no** credentials, `.env` files, or proprietary query data are committed.
- [ ] Provide a clear summary of your changes, the architectural rationale, and before/after screenshots for UI updates.

---

## Questions & Community

- **Discussions**: Share ideas, propose RFCs, or ask questions on [GitHub Discussions](https://github.com/ArnavBallinCode/ZeroDay/discussions).
- **Issues**: Report bugs or suggest enhancements via [GitHub Issues](https://github.com/ArnavBallinCode/ZeroDay/issues).
- **Security**: See [SECURITY.md](SECURITY.md) for private vulnerability reporting.
