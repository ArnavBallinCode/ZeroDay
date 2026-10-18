from datetime import UTC, datetime
from decimal import Decimal

from datamind.core.answer import deterministic_summary
from datamind.core.models import QueryPlan, QueryResult, Sort


def result(rows: list[list[object]]) -> QueryResult:
    return QueryResult(
        query_id="01abc",
        columns=["nation_name", "revenue"],
        rows=rows,
        elapsed_ms=12,
        warehouse="DATAMIND_WH",
        role="DATAMIND_READER",
        executed_at=datetime.now(UTC),
    )


def test_summary_values_are_copied_from_evidence_row() -> None:
    plan = QueryPlan(
        dimensions=["nation_name"],
        metrics=["revenue"],
        sort=[Sort(field="revenue")],
    )
    summary, claims = deterministic_summary(plan, result([["INDIA", Decimal("1234.50")]]))

    assert "INDIA" in summary
    assert "1,234.50" in summary
    assert claims[0].row_indexes == [0]


def test_empty_result_is_explicit() -> None:
    summary, claims = deterministic_summary(QueryPlan(metrics=["revenue"]), result([]))

    assert "No matching rows" in summary
    assert claims[0].row_indexes == []
