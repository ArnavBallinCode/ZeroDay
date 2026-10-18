from __future__ import annotations

import re
from decimal import Decimal
from typing import Any

from datamind.core.models import EvidenceClaim, QueryPlan, QueryResult, SentenceGrounding


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


def verify_sentence_grounding(
    explanation: str,
    plan: QueryPlan,
    result: QueryResult,
) -> list[SentenceGrounding]:
    """
    Sentence-level verification post-processor for Gemma explanations.
    Splits explanation into individual sentences, verifies that all mentioned numbers
    and named entities exist in Snowflake QueryResult.rows or plan filters, and links each
    sentence to exact row indexes. Flags any ungrounded hallucination.
    """
    if not explanation or not explanation.strip():
        return []

    raw_sentences = [
        s.strip()
        for s in re.split(r"(?<=[.!?])\s+", explanation.strip())
        if s.strip()
    ]

    row_values_map: list[set[str]] = []
    all_numeric_values: list[float] = []

    for row in result.rows:
        val_set = set()
        for v in row:
            if v is not None:
                s_val = str(v).lower().strip()
                val_set.add(s_val)
                try:
                    num = float(v)
                    all_numeric_values.append(num)
                    val_set.add(f"{num:,.2f}".lower())
                    val_set.add(f"{int(num):,}".lower())
                    val_set.add(f"{num:.2f}".lower())
                    val_set.add(str(int(num)).lower())
                except (ValueError, TypeError):
                    pass
        row_values_map.append(val_set)

    filter_values = set()
    for f in plan.filters:
        if f.value is not None:
            filter_values.add(str(f.value).lower().strip())

    grounded_list: list[SentenceGrounding] = []

    for sentence in raw_sentences:
        lower_sent = sentence.lower()
        matched_rows: set[int] = set()
        matched_tokens: list[str] = []

        for row_idx, val_set in enumerate(row_values_map):
            for v in val_set:
                if len(v) >= 3 and v in lower_sent:
                    matched_rows.add(row_idx)
                    if v not in matched_tokens:
                        matched_tokens.append(v)

        for fv in filter_values:
            if fv in lower_sent and fv not in matched_tokens:
                matched_tokens.append(fv)

        raw_nums = re.findall(r"\b\d+(?:,\d+)*(?:\.\d+)?\b", sentence)
        has_ungrounded_number = False
        for num_str in raw_nums:
            cleaned = num_str.replace(",", "")
            try:
                val = float(cleaned)
                known_numbers = all_numeric_values + [
                    float(result.elapsed_ms),
                    float(len(result.rows)),
                    float(plan.limit),
                ]
                for fv in filter_values:
                    try:
                        known_numbers.append(float(fv))
                    except ValueError:
                        pass

                is_known = any(abs(val - k) / (abs(k) + 1e-9) < 0.001 or abs(val - k) < 1.0 for k in known_numbers)
                if not is_known and val > 10:
                    has_ungrounded_number = True
            except ValueError:
                pass

        is_empty_description = not result.rows and (
            "no" in lower_sent or "zero" in lower_sent or "empty" in lower_sent or "did not" in lower_sent
        )
        has_matches = len(matched_rows) > 0 or len(matched_tokens) > 0 or is_empty_description
        is_grounded = has_matches and not has_ungrounded_number

        grounded_list.append(
            SentenceGrounding(
                sentence=sentence,
                grounded=is_grounded,
                matched_values=matched_tokens[:5],
                matched_row_indexes=sorted(matched_rows)[:5],
            )
        )

    return grounded_list
