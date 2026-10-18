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
        print("  [check] Opening Snowflake browser authentication...")
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


def main() -> None:
    parser = argparse.ArgumentParser(description="Verify and run the DataMind stack")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("doctor", help="Check local Gemma and real Snowflake access")
    smoke_parser = subparsers.add_parser("smoke", help="Run a real end-to-end verified question")
    smoke_parser.add_argument("--question", default=DEFAULT_SMOKE_QUESTION)
    args = parser.parse_args()
    raise SystemExit(doctor() if args.command == "doctor" else smoke(args.question))


if __name__ == "__main__":
    main()
