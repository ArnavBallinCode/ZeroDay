from __future__ import annotations

from decimal import Decimal
from typing import Any

from datamind.core.models import EvidenceClaim, QueryPlan, QueryResult


def render_value(value: Any) -> str:
    if value is None:
        return "missing"
    if isinstance(value, Decimal):
        return f"{value:,.2f}"
    if isinstance(value, float):
        return f"{value:,.2f}"
    if isinstance(value, int):
        return f"{value:,}"
    return str(value)


def deterministic_summary(plan: QueryPlan, result: QueryResult) -> tuple[str, list[EvidenceClaim]]:
    if not result.rows:
        return (
            "No matching rows were found in the selected data.",
            [EvidenceClaim(text="The query returned zero rows.", row_indexes=[], columns=[])],
        )

    claims: list[EvidenceClaim] = []
    if len(result.rows) == 1:
        parts = [
            f"{column.replace('_', ' ')} is {render_value(value)}"
            for column, value in zip(result.columns, result.rows[0], strict=True)
        ]
        text = "; ".join(parts) + "."
        claims.append(EvidenceClaim(text=text, row_indexes=[0], columns=result.columns))
        return text, claims

    first = result.rows[0]
    parts = [
        f"{column.replace('_', ' ')}: {render_value(value)}"
        for column, value in zip(result.columns, first, strict=True)
    ]
    order_note = "Top result" if plan.sort else "First returned result"
    summary = f"{order_note} — " + "; ".join(parts) + f". {len(result.rows)} rows returned."
    claims.append(EvidenceClaim(text=summary, row_indexes=[0], columns=result.columns))
    return summary, claims
