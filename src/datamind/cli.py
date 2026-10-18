from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from datamind.adapters.gemma import GemmaPlanner
from datamind.adapters.snowflake import SnowflakeExecutor
from datamind.config import Settings
from datamind.core.agent import DataMindAgent
from datamind.core.catalog import SemanticCatalog
from datamind.core.compiler import QueryCompiler
from datamind.core.models import QueryPlan

DEFAULT_SMOKE_QUESTION = "Which five customer nations generated the most revenue in 1995?"


def build_components() -> tuple[Settings, SemanticCatalog, GemmaPlanner, SnowflakeExecutor]:
    settings = Settings()
    catalog = SemanticCatalog.load(Path("config/tpch.yml"))
    planner = GemmaPlanner(settings.ollama_base_url, settings.gemma_model)
    executor = SnowflakeExecutor(settings, set(catalog.tables))
    return settings, catalog, planner, executor


def doctor() -> int:
    settings, catalog, planner, executor = build_components()
    failures: list[str] = []

    print("DataMind system check")
    print(f"  Gemma model: {settings.gemma_model}")
    if planner.health():
        print("  [ok] Gemma is available through Ollama")
    else:
        print(f"  [missing] Run: ollama pull {settings.gemma_model}")
        failures.append("Gemma")

    if not settings.snowflake_ready:
        print("  [missing] Set SNOWFLAKE_ACCOUNT and SNOWFLAKE_USER in .env")
        failures.append("Snowflake configuration")
    else:
        auth_method = "PAT" if settings.active_snowflake_pat else settings.snowflake_authenticator
        print(f"  [check] Connecting to Snowflake with {auth_method} authentication...")
        try:
            query = QueryCompiler(catalog).compile(QueryPlan(metrics=["order_count"], limit=1))
            result = executor.execute(query)
            print(f"  [ok] Snowflake returned {result.rows[0][0]:,} orders")
            print(f"       query_id={result.query_id}")
            print(f"       warehouse={result.warehouse} role={result.role}")
        except Exception as exc:  # noqa: BLE001 - doctor must report connector/auth failures cleanly.
            print(f"  [failed] Snowflake: {exc}")
            failures.append("Snowflake connection/query")

    if failures:
        print("\nSetup remaining: " + ", ".join(failures))
        return 1
    print("\nAll required systems are ready.")
    return 0


def smoke(question: str) -> int:
    settings, catalog, planner, executor = build_components()
    if not settings.snowflake_ready:
        print("Snowflake is not configured. Run `datamind doctor` for setup guidance.", file=sys.stderr)
        return 1
    if not planner.health():
        print(f"Gemma is unavailable. Run `ollama pull {settings.gemma_model}`.", file=sys.stderr)
        return 1

    print("Running the real Gemma → Snowflake → evidence path...")
    answer = DataMindAgent(catalog, planner, executor).ask(question)
    print(
        json.dumps(
            {
                "question": answer.question,
                "summary": answer.summary,
                "query_id": answer.result.query_id,
                "rows": len(answer.result.rows),
                "elapsed_ms": answer.result.elapsed_ms,
                "tables": answer.query.tables,
                "sql": answer.query.sql,
                "parameters": answer.query.parameters,
                "assumptions": answer.plan.assumptions,
            },
            indent=2,
            default=str,
        )
    )
    return 0


def benchmark_cmd() -> int:
    settings, catalog, planner, executor = build_components()
    if not settings.snowflake_ready:
        print("Snowflake is not configured. Run `datamind doctor` for setup guidance.", file=sys.stderr)
        return 1
    if not planner.health():
        print(f"Gemma is unavailable. Run `ollama pull {settings.gemma_model}`.", file=sys.stderr)
        return 1

    from datamind.core.benchmark import run_benchmark_suite

    agent = DataMindAgent(catalog, planner, executor)
    print("=" * 80)
    print("Running DataMind Ground-Truth Benchmark Suite (25 Cases)...")
    print("Evaluating against live Snowflake execution and Gemma 4 semantic planning...")
    print("=" * 80)

    report = run_benchmark_suite(agent)

    print(f"\nBenchmark Results: {report['passed_cases']}/{report['total_cases']} Passed ({report['accuracy_percent']}%)")
    print(f"Total Latency: {report['total_elapsed_ms']}ms | Avg: {report['avg_latency_ms']}ms/query\n")

    print(f"{'ID':<8} {'Category':<22} {'Status':<10} {'Latency':<10} {'Notes'}")
    print("-" * 80)
    for r in report["results"]:
        status_str = "[PASS]" if r["passed"] else "[FAIL]"
        print(f"{r['id']:<8} {r['category']:<22} {status_str:<10} {r['elapsed_ms']}ms     {r['reason'][:35]}")

    print("\nCategory Breakdown:")
    for cat, stats in report["category_summary"].items():
        pct = round((stats["passed"] / stats["total"]) * 100, 1)
        print(f"  - {cat:<24}: {stats['passed']}/{stats['total']} ({pct}%)")

    return 0 if report["failed_cases"] == 0 else 1


def demo_mutation_cmd() -> int:
    settings, _catalog, _planner, executor = build_components()
    if not settings.snowflake_ready:
        print("Snowflake is not configured. Run `datamind doctor`.", file=sys.stderr)
        return 1

    from datamind.core.mutation import run_live_data_mutation_proof

    print("=" * 80)
    print("Running Live Snowflake Data Mutation Demonstration...")
    print("Verifying that query answers change dynamically when data changes...")
    print("=" * 80)

    proof = run_live_data_mutation_proof(executor, settings)

    print(f"\nProof Mode: {proof['mode']}")
    print(f"Target:     {proof['table']}")
    print(f"Question:   {proof['question']}\n")
    print("1. Initial State Query:")
    print(f"   - Value:     {proof.get('initial_value'):,}")
    print(f"   - Query ID:  {proof.get('initial_query_id')}")
    print("\n2. Data Mutation Event:")
    print(f"   - Action:    {proof.get('mutation_event')}")
    if proof.get("mutation_query_id"):
        print(f"   - Query ID:  {proof.get('mutation_query_id')}")
    print("\n3. Post-Mutation Query:")
    print(f"   - Value:     {proof.get('mutated_value'):,}")
    print(f"   - Query ID:  {proof.get('mutated_query_id')}")
    print("\nVerification:")
    print(f"   - Row Delta: +{proof.get('delta'):,}")
    print(f"   - Genuine IDs Distinct: {proof.get('initial_query_id') != proof.get('mutated_query_id')}")
    print(f"   - Status:    {'[VERIFIED LIVE ON SNOWFLAKE]' if proof.get('verified') else '[FAILED]'}")
    return 0 if proof.get("verified") else 1


def main() -> None:
    parser = argparse.ArgumentParser(description="Verify and run the DataMind stack")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("doctor", help="Check local Gemma and real Snowflake access")
    smoke_parser = subparsers.add_parser("smoke", help="Run a real end-to-end verified question")
    smoke_parser.add_argument("--question", default=DEFAULT_SMOKE_QUESTION)
    subparsers.add_parser("benchmark", help="Run the 25-case ground truth evaluation benchmark")
    subparsers.add_parser("demo-mutation", help="Run live Snowflake data mutation proof")

    args = parser.parse_args()
    if args.command == "doctor":
        raise SystemExit(doctor())
    elif args.command == "smoke":
        raise SystemExit(smoke(args.question))
    elif args.command == "benchmark":
        raise SystemExit(benchmark_cmd())
    elif args.command == "demo-mutation":
        raise SystemExit(demo_mutation_cmd())
    else:
        parser.print_help()
        raise SystemExit(1)


if __name__ == "__main__":
    main()
