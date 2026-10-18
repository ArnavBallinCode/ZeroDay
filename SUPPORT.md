# Support and Troubleshooting

We want to ensure your experience with DataMind is smooth and productive. Here is a guide on where and how to find help.

---

## Getting Help

### 1. Built-in CLI Diagnostics
Before filing an issue, check your environment with our built-in diagnostics tools:

```bash
# Check your Python environment, Ollama connectivity, and Snowflake configuration
uv run datamind doctor

# Execute an end-to-end smoke test
uv run datamind smoke
```

### 2. Documentation
Our documentation answers most setup, architectural, and security questions:
- [Snowflake Setup Guide](docs/SNOWFLAKE_SETUP.md): Step-by-step least-privilege setup, keyless SSO, and PAT instructions.
- [Architecture & Trust Boundaries](docs/ARCHITECTURE.md): System boundaries between Gemma, the compiler, and Snowflake.
- [Sample Datasets](docs/DATASETS.md): How TPC-H sample schemas map to the semantic model.
- [Contributing Guide](CONTRIBUTING.md): Instructions for developers and community members.

### 3. GitHub Discussions
Use [GitHub Discussions](https://github.com/ArnavBallinCode/ZeroDay/discussions) for:
- Asking questions about setting up custom Snowflake warehouses or schemas.
- Discussing design proposals and feature suggestions.
- Sharing your custom semantic models or visualization extensions.
- General Q&A and networking.

### 4. GitHub Issues
Use [GitHub Issues](https://github.com/ArnavBallinCode/ZeroDay/issues) for:
- **Bug reports**: Something broken or giving unexpected errors.
- **Feature requests**: Specific proposals for enhancements or new capabilities.
- **Semantic Model Requests**: Suggesting new metrics, dimensions, or table joins for the default model.

---

## Frequently Asked Questions (FAQ)

### Q: Do I need a live Snowflake account to contribute code?
**A:** No! All unit tests run entirely locally using mocks and fixtures without any Snowflake credentials. You only need Snowflake credentials for end-to-end integration testing or testing against live warehouses.

### Q: Can I run DataMind with a different Gemma model size?
**A:** Yes. The default model is `gemma4:e4b` for lightweight edge performance. You can use any model available in Ollama (such as `gemma2:9b` or `gemma2:27b`) by setting `GEMMA_MODEL` in your `.env`.

### Q: Why does DataMind use a deterministic compiler instead of letting Gemma write SQL directly?
**A:** Large Language Models are prone to SQL injection, hallucinations, invalid table joins, and unoptimized queries that waste warehouse credits. By having Gemma emit a constrained semantic plan and having our deterministic compiler generate SQL via an Abstract Syntax Tree (AST), DataMind guarantees strict table allowlists, parameter binding, read-only enforcement, and reproducible queries.

### Q: Where do I report security vulnerabilities?
**A:** Please report all security vulnerabilities privately according to our [Security Policy](SECURITY.md). Do not file public issues for vulnerabilities.
