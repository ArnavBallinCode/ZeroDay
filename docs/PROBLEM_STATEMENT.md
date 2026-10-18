# Problem Statement 1 — normalized requirements

Source: `ZeroDay_OSS_Hacktoberfest_2026_Participant_Guide.pdf`, supplied by the user. This file is a
working summary, not a replacement for the original guide.

## Mission

Create an AI-powered data experience where people ask everyday-language questions and receive useful
answers grounded in available data. The system must retrieve, query, or analyze real data—not merely
generate plausible prose—and must explain what it actually examined.

## Mandatory technology

- **Snowflake:** store, access, query, retrieve, or analyze the data behind answers. A dormant
  connection, mocked results, or loading data and then answering only from local files does not count.
- **Google Gemma:** any suitable Gemma variant must perform a central AI task such as interpreting
  questions or explaining verified results. Keep model inference separate from Snowflake/SQL.
- **Open source:** reusable source, setup, dependencies, and architecture documentation. Compatible
  datasets should require configuration changes rather than code rewrites.

## Mandatory product behavior (M1-M8)

1. Accept everyday-language questions, including unseen phrasing.
2. Derive answers from retrieval/query/analysis of actual data at question time.
3. Ground answers without unsupported model claims.
4. Explain filters, tables, and assumptions in plain language.
5. Expose executed query, result rows, source references, or equivalent evidence.
6. Handle ambiguity, missing data, empty results, errors, and unsupported requests sensibly.
7. Integrate Snowflake and Gemma meaningfully.
8. Provide a working, reproducible, open-source implementation.

## Track rubric (70% of final score)

| Criterion | Points | Outstanding evidence |
|---|---:|---|
| Correctness and usefulness | 20 | Independent ground truth on unseen join and multi-step questions |
| Natural-language interaction | 10 | Varied phrasing, sound field selection, follow-ups |
| Evidence and explainability | 15 | Claim → executed query → exact row trace |
| Snowflake integration | 15 | Integral modeling/execution, access control, reproducibility, cost care |
| Gemma integration | 12 | Central validated task, documented deployment, deterministic separation |
| Ambiguity/errors/missing data | 12 | Clarification, explicit assumptions, honest empty/unsupported handling |
| Reusability | 8 | Second dataset through configuration; modular design |
| Practical UX | 8 | Clear use case and readable results; polish alone earns little |

If correctness is Poor, the track score is capped at 50.

## Common rubric (30% of final score)

- Problem understanding 10
- Functional completeness 20
- Technical design 15
- Open-source quality 15
- Reproducibility 15
- UX and accessibility 10
- Testing/reliability/error handling 10
- Demo and rationale 5

## Pass/fail gates

- Public repository with open-source license.
- Reproducible real demo, with a feasible evaluation path for unavoidable credentials.
- Real system, no hard-coded outputs or mock-only demonstration.
- Dataset sources/licenses disclosed; no private or non-redistributable data committed.
- No secrets in the repository.
- Meaningful Snowflake and Gemma use; every answer computed at question time.

## Required submission evidence

- README covering overview, setup, run, configuration, troubleshooting, dependencies, tested
  environment, architecture, dataset licensing, Snowflake/Gemma roles, limitations, and reproduction.
- Real live or recorded demo; about five minutes is recommended.
- Executed queries, query IDs/history, or independent comparison proving grounding.
- A demonstration that an answer changes when the data changes.
- Recommended: evaluation question set with expected answers and results.
- Recommended: reproducible Snowflake setup script.
