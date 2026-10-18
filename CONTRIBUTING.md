# Contributing to DataMind

Thanks for helping make verifiable data agents easier to build and trust.

## Before you start

- Open an issue before a large architectural change.
- Never commit Snowflake credentials, private keys, `.env`, query results containing private data,
  or non-redistributable datasets.
- Preserve the core trust boundary: Gemma produces a constrained semantic plan; deterministic code
  owns SQL; Snowflake computes every real answer.

## Local development

```bash
uv sync --extra dev --python 3.13
cd frontend && npm ci
```

Run the quality gates before opening a pull request:

```bash
uv run ruff check src tests
uv run pytest
cd frontend && npm run lint && npm run build
```

Snowflake is not required for unit tests. For integration work, follow
[`docs/SNOWFLAKE_SETUP.md`](docs/SNOWFLAKE_SETUP.md) and include safe query IDs in the pull request
description. Do not include credentials or private result data.

## Commit and pull-request style

Keep commits focused and use short conventional subjects such as:

- `feat(core): add a supported metric`
- `fix(safety): reject nested statements`
- `test(compiler): cover bounded ranking`
- `docs(setup): clarify Snowflake role grants`

Pull requests should explain the user-visible change, trust/safety impact, tests run, and any known
limitations. UI changes should include desktop and narrow screenshots.
