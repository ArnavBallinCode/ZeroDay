from __future__ import annotations

from collections import deque
from datetime import date
from typing import Any

from datamind.core.catalog import SemanticCatalog
from datamind.core.models import CompiledQuery, Filter, QueryPlan


class InvalidPlan(ValueError):
    """Raised when a model plan cannot be compiled safely."""


OPERATORS = {
    "eq": "=",
    "neq": "!=",
    "gt": ">",
    "gte": ">=",
    "lt": "<",
    "lte": "<=",
}


class QueryCompiler:
    def __init__(self, catalog: SemanticCatalog):
        self.catalog = catalog

    def compile(self, plan: QueryPlan) -> CompiledQuery:
        if plan.dataset != self.catalog.name:
            raise InvalidPlan(f"Plan targets unknown dataset {plan.dataset!r}")

        names = plan.dimensions + plan.metrics
        filter_names = [item.field for item in plan.filters]
        sort_names = [item.field for item in plan.sort]
        try:
            fields = [self.catalog.field(name) for name in names + filter_names + sort_names]
        except KeyError as exc:
            raise InvalidPlan(str(exc)) from exc

        required_tables = list(dict.fromkeys(field.table for field in fields))
        if not required_tables:
            raise InvalidPlan("At least one semantic field is required")

        select_parts = [
            f'{self.catalog.field(name).expression} AS "{name}"' for name in names
        ]
        anchor = self.catalog.field(plan.metrics[0]).table
        joins = self._join_path(anchor, set(required_tables))
        from_sql = self._qualified_table(anchor)
        join_sql = "\n".join(
            f"JOIN {self._qualified_table(join['to'])} ON {join['on']}" for join in joins
        )

        parameters: list[Any] = []
        where_parts = [self._compile_filter(item, parameters) for item in plan.filters]
        group_parts = [self.catalog.field(name).expression for name in plan.dimensions]

        sql = "SELECT\n  " + ",\n  ".join(select_parts)
        sql += f"\nFROM {from_sql}"
        if join_sql:
            sql += "\n" + join_sql
        if where_parts:
            sql += "\nWHERE " + "\n  AND ".join(where_parts)
        if group_parts:
            sql += "\nGROUP BY " + ", ".join(group_parts)
        if plan.sort:
            sql += "\nORDER BY " + ", ".join(
                f'"{item.field}" {item.direction.upper()}' for item in plan.sort
            )
        sql += f"\nLIMIT {plan.limit}"

        return CompiledQuery(
            sql=sql,
            parameters=tuple(parameters),
            tables=[anchor] + [join["to"] for join in joins],
            selected_fields=names,
        )

    def _qualified_table(self, table: str) -> str:
        physical = self.catalog.tables[table]["physical"]
        return f'{self.catalog.database}.{self.catalog.schema}.{physical} AS {table}'

    def _compile_filter(self, item: Filter, parameters: list[Any]) -> str:
        expression = self.catalog.field(item.field).expression
        if item.operator == 'in' and (
            not isinstance(item.value, list) or not 1 <= len(item.value) <= 100
        ):
            raise InvalidPlan('An in filter requires 1-100 values')
        values = item.value if isinstance(item.value, list) else [item.value]
        if item.field.endswith('_year'):
            if any(isinstance(v, bool) or not str(v).isdigit() or len(str(v)) != 4 for v in values):
                raise InvalidPlan(f'{item.field} requires four-digit numeric years, not dates')
            values = [int(v) for v in values]
        elif item.field.endswith(('_date', '_month')):
            try:
                values = [date.fromisoformat(str(v)).isoformat() for v in values]
            except ValueError as exc:
                raise InvalidPlan(f'{item.field} requires ISO dates (YYYY-MM-DD)') from exc
        elif item.field in self.catalog.dimensions:
            if any(not isinstance(v, str) for v in values):
                raise InvalidPlan(f'{item.field} requires text values')
            # Human names and categorical labels should match independently of casing.
            expression = f'UPPER({expression})'
            values = [v.strip().upper() for v in values]
        if item.operator in OPERATORS:
            if isinstance(item.value, list):
                raise InvalidPlan('A scalar comparison requires one value')
            parameters.append(values[0])
            return f"{expression} {OPERATORS[item.operator]} %s"
        if item.operator == "between":
            if not isinstance(item.value, list) or len(item.value) != 2:
                raise InvalidPlan("A between filter requires exactly two values")
            parameters.extend(values)
            return f"{expression} BETWEEN %s AND %s"
        if item.operator == "in":
            if not isinstance(item.value, list) or not item.value or len(item.value) > 100:
                raise InvalidPlan("An in filter requires 1-100 values")
            parameters.extend(values)
            return f"{expression} IN ({', '.join(['%s'] * len(item.value))})"
        raise InvalidPlan(f"Unsupported filter operator: {item.operator}")

    def _join_path(self, anchor: str, targets: set[str]) -> list[dict[str, str]]:
        if targets == {anchor}:
            return []
        graph: dict[str, list[tuple[str, dict[str, str], bool]]] = {}
        for join in self.catalog.joins:
            graph.setdefault(join["from"], []).append((join["to"], join, False))
            graph.setdefault(join["to"], []).append((join["from"], join, True))

        selected: list[dict[str, str]] = []
        present = {anchor}
        remaining = targets - present
        while remaining:
            queue = deque((table, []) for table in present)
            visited = set(present)
            found: list[tuple[str, dict[str, str], bool]] | None = None
            while queue and found is None:
                current, path = queue.popleft()
                for neighbor, join, reversed_edge in graph.get(current, []):
                    if neighbor in visited:
                        continue
                    next_path = path + [(neighbor, join, reversed_edge)]
                    if neighbor in remaining:
                        found = next_path
                        break
                    visited.add(neighbor)
                    queue.append((neighbor, next_path))
            if found is None:
                raise InvalidPlan(f"No configured join path reaches: {sorted(remaining)}")
            for neighbor, join, reversed_edge in found:
                if neighbor not in present:
                    selected.append({"to": neighbor, "on": join["on"]})
                    present.add(neighbor)
            remaining = targets - present
        return selected
